import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

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

import rateLimit from "express-rate-limit";

// Trust proxy is required if behind a proxy (like Replit/Heroku/NGINX)
// server/auth.ts already sets 'trust proxy' to 1, but we should probably set it here too if widely used.
app.set("trust proxy", 1);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: "Too many requests, please try again later." },
});

app.use("/api/auth", authLimiter);
app.use("/api/login", authLimiter);
app.use("/api/users/register", authLimiter);
app.use("/api", apiLimiter);


import { logger } from "./utils/logger";

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
        response: capturedJsonResponse
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
    throw err;
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

  const port = Number(process.env.PORT) || 3000; // fallback só para ambiente local
  const host = process.env.HOST || "0.0.0.0";
  const reusePort = process.env.REUSE_PORT === "true";
  httpServer.listen(
    {
      port,
      host,
      reusePort,
    },
    () => {
      logger.info(`serving on ${host}:${port}`);
    },
  );
})();
