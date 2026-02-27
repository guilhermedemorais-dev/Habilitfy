import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import path from "path";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: "50mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

import rateLimit from "express-rate-limit";

// Trust proxy is required if behind a proxy (like Replit/Heroku/NGINX)
// server/auth.ts already sets 'trust proxy' to 1, but we should probably set it here too if widely used.
app.set("trust proxy", 1);

const isOAuthFlowRequest = (req: Request) => {
  const url = req.originalUrl || req.url || "";
  return (
    url.startsWith("/api/auth/google") ||
    (req.method === "GET" && url.startsWith("/api/login"))
  );
};

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  skip: isOAuthFlowRequest,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 auth attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: isOAuthFlowRequest,
  message: { message: "Too many requests, please try again later." },
});

// Apply stricter rate limits only to sensitive write endpoints.
// Do not rate-limit OAuth redirect endpoints (/api/auth/google, callback),
// otherwise valid login attempts can be blocked.
app.use("/api/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api/auth/verify-email", authLimiter);
app.use("/api", apiLimiter);


import { logger } from "./utils/logger";

const summarizeResponsePayload = (payload: unknown) => {
  if (payload === undefined) return undefined;
  if (payload === null) return null;

  if (Array.isArray(payload)) {
    return {
      type: "array",
      length: payload.length,
      sampleShape:
        payload.length > 0 && payload[0] && typeof payload[0] === "object"
          ? Object.keys(payload[0] as Record<string, unknown>).slice(0, 10)
          : undefined,
    };
  }

  if (typeof payload === "object") {
    const keys = Object.keys(payload as Record<string, unknown>);
    return {
      type: "object",
      keyCount: keys.length,
      keys: keys.slice(0, 20),
    };
  }

  if (typeof payload === "string") {
    return { type: "string", length: payload.length };
  }

  return { type: typeof payload };
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  console.log(`[DEPLOY CHECK ${new Date().toISOString()}] Incoming request: ${req.method} ${path}`);
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.info(`${req.method} ${path} ${res.statusCode} in ${duration}ms`, {
        method: req.method,
        path,
        statusCode: res.statusCode,
        duration,
        responseSummary: summarizeResponsePayload(capturedJsonResponse),
      });
    }
  });

  next();
});

(async () => {
  logger.info("Starting server...");
  try {
    logger.info("Calling registerRoutes...");
    await registerRoutes(app, httpServer);
    logger.info("registerRoutes finished.");
  } catch (err) {
    logger.error("CRITICAL: registerRoutes failed!", err);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    logger.error(`Unhandled Error: ${message}`, err);
    res.status(status).json({ message });
    return;
  });

  if (process.env.NODE_ENV === "production") {
    if (process.env.SKIP_STATIC === "true") {
      logger.info("SKIP_STATIC=true, não servindo client build");
    } else {
      serveStatic(app);
    }
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // Suporte a Named Pipes (Passenger/Hostinger) e Portas Numéricas
  const portEnv = process.env.PORT;
  const port = isNaN(Number(portEnv)) ? portEnv : (Number(portEnv) || 3000);
  const host = process.env.HOST || "0.0.0.0";

  // Se for pipe (string), host é ignorado
  const listenOptions = typeof port === 'string' ? { path: port } : { port, host };

  httpServer.listen(listenOptions, () => {
    logger.info(`serving on ${typeof port === 'string' ? 'QPipe: ' + port : host + ':' + port}`);
  });
})();
