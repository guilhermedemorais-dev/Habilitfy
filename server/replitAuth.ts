import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const getOidcConfig = memoize(
  async () => {
    const issuerUrl = process.env.ISSUER_URL ?? "https://replit.com/oidc";
    const clientId = process.env.OIDC_CLIENT_ID ?? process.env.REPL_ID;
    const clientSecret = process.env.OIDC_CLIENT_SECRET ?? process.env.REPL_SECRET;
    if (!clientId) {
      throw new Error("OIDC_CLIENT_ID (ou REPL_ID) must be set for OIDC");
    }
    return await client.discovery(
      new URL(issuerUrl),
      clientId,
      clientSecret,
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  if (!process.env.SESSION_SECRET && process.env.AUTH_MODE === "local") {
    process.env.SESSION_SECRET = "local-dev-secret";
  }
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure:
        process.env.SESSION_COOKIE_SECURE === "true" ||
        (process.env.SESSION_COOKIE_SECURE !== "false" &&
          process.env.NODE_ENV === "production"),
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(
  user: any,
  tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}

async function upsertUser(
  claims: any,
) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"],
  });
}

import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { Strategy as LocalStrategy } from "passport-local";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePassword(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Local Strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // Simple compare since bcrypt might be missing for some users, but should use comparePassword in prod
        if (user?.password) {
          const isValid = await comparePassword(password, user.password);
          if (!isValid) return done(null, false);
        } else {
          return done(null, false);
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // OIDC Strategy (Replit Auth) - Only if not in strict local mode
  if (process.env.AUTH_MODE !== "local") {
    try {
      console.log("[auth] Attempting OIDC discovery...");
      const config = await getOidcConfig();
      passport.use("oidc", new Strategy({ client: config } as any, async (tokens: any, done: any) => {
        try {
          const claims = tokens.claims();
          await upsertUser(claims);
          const user = await storage.getUser(claims.sub);
          done(null, user);
        } catch (err) {
          done(err);
        }
      }));
      console.log("[auth] OIDC Strategy registered.");
    } catch (err) {
      console.log("[auth] OIDC discovery failed. Replit Auth will be unavailable.");
    }
  } else {
    console.log("[auth] AUTH_MODE=local. Skipping OIDC discovery.");
  }

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(null, false);
    }
  });

  console.log("Registering Auth Routes...");

  // Authentication Routes Registration
  console.log(`[auth] Registering routes (AUTH_MODE=${process.env.AUTH_MODE || "oidc"})`);

  // GET /api/login: The main entry point for login
  app.get("/api/login", async (req, res, next) => {
    console.log(`[auth] GET /api/login hit (Authenticated: ${req.isAuthenticated()})`);

    // LOCAL MODE: Auto-login during development
    if (process.env.AUTH_MODE === "local") {
      console.log("[auth] Local mode detected. Performing auto-login...");
      try {
        const userId = process.env.LOCAL_USER_ID || "local-admin";
        const localRole = process.env.LOCAL_USER_ROLE as
          | "student"
          | "instructor"
          | "admin"
          | undefined;
        let mockUser = await storage.getUser(userId);

        if (!mockUser) {
          console.log(`[auth] Local user ${userId} not found. Creating...`);
          const newUser = {
            id: userId,
            email: process.env.LOCAL_USER_EMAIL || "admin@example.com",
            firstName: process.env.LOCAL_USER_FIRSTNAME || "Local",
            lastName: process.env.LOCAL_USER_LASTNAME || "Admin",
            ...(localRole ? { role: localRole } : {}),
          };
          await storage.upsertUser(newUser);
          mockUser = await storage.getUser(userId);
        } else if (localRole && mockUser.role !== localRole) {
          await storage.upsertUser({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            lastName: mockUser.lastName,
            role: localRole,
          });
          mockUser = await storage.getUser(userId);
        }

        if (mockUser) {
          req.login(mockUser, (err) => {
            if (err) return next(err);
            console.log(`[auth] Local auto-login success for ${mockUser.id}`);
            return res.redirect("/");
          });
          return;
        }
      } catch (err) {
        console.error("[auth] Local auto-login failed:", err);
      }
    }

    // OIDC MODE: Redirect to Replit Auth
    const hasOidc = (passport as any)._strategies?.oidc;
    if (hasOidc) {
      console.log("[auth] Redirecting to OIDC provider...");
      return passport.authenticate("oidc")(req, res, next);
    }

    console.warn("[auth] No authentication strategy available for /api/login");
    res.redirect("/login?error=auth_unavailable");
  });

  // OIDC Callback
  app.get("/api/auth/callback", (req, res, next) => {
    console.log("[auth] OIDC callback hit");
    passport.authenticate("oidc", {
      successRedirect: "/",
      failureRedirect: "/login?error=auth_failed"
    })(req, res, next);
  });

  // POST /api/login: Traditional form login (LocalStrategy)
  app.post("/api/login", (req, res, next) => {
    console.log("[auth] POST /api/login hit (LocalStrategy)");
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: "Credenciais inválidas" });
      req.logIn(user, (err) => {
        if (err) return next(err);
        return res.json(user);
      });
    })(req, res, next);
  });

  app.get("/api/logout", (req, res, next) => {
    console.log("GET /api/logout hit");
    req.logout((err) => {
      if (err) return next(err);
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("POST /api/logout hit");
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  console.log("Auth Routes Registered.");
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  // Modo local/offline: aceitar sempre se usuário fake foi injetado
  if (process.env.AUTH_MODE === "local") {
    let user = (req as any).user;
    if (!user) {
      const isTestEnv =
        process.env.NODE_ENV === "test" || process.env.VITEST === "true";
      const allowBypass =
        process.env.E2E_AUTH_BYPASS === "true" ||
        process.env.E2E_AUTH_BYPASS === "1";
      if (!isTestEnv && !allowBypass) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const localUserId = process.env.LOCAL_USER_ID || "local-admin";
      user = {
        id: localUserId,
        role: process.env.LOCAL_USER_ROLE,
        claims: { sub: localUserId },
      };
      (req as any).user = user;
    } else {
      if (!user.claims) {
        user.claims = { sub: user.id };
      } else if (!user.claims.sub) {
        user.claims.sub = user.id;
      }
    }
    return next();
  }

  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
