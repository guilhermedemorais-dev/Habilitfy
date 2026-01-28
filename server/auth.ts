import { logger } from "./utils/logger";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

const scryptAsync = promisify(scrypt);

// =============================================================================
// Password Hashing Utilities
// =============================================================================

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

// =============================================================================
// Session Configuration
// =============================================================================

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days

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

// =============================================================================
// Auth Setup
// =============================================================================

export async function setupAuth(app: Express) {
    app.set("trust proxy", 1);
    app.use(getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // -------------------------------------------------------------------------
    // Google OAuth 2.0 Strategy
    // -------------------------------------------------------------------------
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback";

    if (googleClientId && googleClientSecret) {
        logger.info("[auth] Configuring Google OAuth 2.0 Strategy...");
        passport.use(
            new GoogleStrategy(
                {
                    clientID: googleClientId,
                    clientSecret: googleClientSecret,
                    callbackURL: googleCallbackUrl,
                    scope: ["profile", "email"],
                },
                async (accessToken, refreshToken, profile, done) => {
                    try {
                        const email = profile.emails?.[0]?.value;
                        const googleId = profile.id;

                        // Try to find user by googleId first, then by email
                        let user = await storage.getUserByGoogleId?.(googleId);

                        if (!user && email) {
                            user = await storage.getUserByEmail?.(email);
                        }

                        if (user) {
                            // Update user with Google profile info if needed
                            if (!user.googleId) {
                                await storage.upsertUser({
                                    id: user.id,
                                    googleId: googleId,
                                    email: email || user.email,
                                    firstName: profile.name?.givenName || user.firstName,
                                    lastName: profile.name?.familyName || user.lastName,
                                    profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
                                });
                                user = await storage.getUser(user.id);
                            }
                        } else {
                            // Create new user
                            const newUserId = `google_${googleId}`;
                            await storage.upsertUser({
                                id: newUserId,
                                googleId: googleId,
                                email: email,
                                firstName: profile.name?.givenName,
                                lastName: profile.name?.familyName,
                                profileImageUrl: profile.photos?.[0]?.value,
                                role: "student", // Default role for new users
                            });
                            user = await storage.getUser(newUserId);
                        }

                        return done(null, user);
                    } catch (err) {
                        return done(err as Error);
                    }
                }
            )
        );
        logger.info("[auth] Google OAuth 2.0 Strategy registered.");
    } else {
        logger.warn("[auth] Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)");
    }

    // -------------------------------------------------------------------------
    // Local Strategy (username/password)
    // -------------------------------------------------------------------------
    passport.use(
        new LocalStrategy(async (username, password, done) => {
            try {
                const user = await storage.getUserByUsername(username);
                if (!user || !user.password) {
                    return done(null, false);
                }

                const isValid = await comparePassword(password, user.password);
                if (!isValid) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        })
    );

    // -------------------------------------------------------------------------
    // Serialize/Deserialize
    // -------------------------------------------------------------------------
    passport.serializeUser((user: any, done) => done(null, user.id));
    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await storage.getUser(id);
            done(null, user);
        } catch (err) {
            done(null, false);
        }
    });

    logger.info("[auth] Registering Auth Routes...");

    // -------------------------------------------------------------------------
    // Google OAuth Routes
    // -------------------------------------------------------------------------
    app.get("/api/auth/google", (req, res, next) => {
        const redirect = req.query.redirect as string;
        const state = redirect ? Buffer.from(redirect).toString("base64") : undefined;

        passport.authenticate("google", {
            scope: ["profile", "email"],
            state,
        } as any)(req, res, next);
    });

    app.get("/api/auth/google/callback", (req, res, next) => {
        passport.authenticate("google", (err: any, user: any, info: any) => {
            if (err) {
                console.error("[auth] Google callback error:", err);
                return res.redirect("/login?error=auth_failed");
            }
            if (!user) {
                return res.redirect("/login?error=auth_failed");
            }

            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    console.error("[auth] Login error:", loginErr);
                    return res.redirect("/login?error=auth_failed");
                }

                // Decode redirect URL from state parameter
                const state = req.query.state as string;
                let redirectUrl = "/";
                if (state) {
                    try {
                        redirectUrl = Buffer.from(state, "base64").toString("utf-8") || "/";
                    } catch {
                        redirectUrl = "/";
                    }
                }

                // Redirect to role-specific dashboard
                if (user.role === "admin") {
                    return res.redirect("/admin");
                } else if (user.role === "instructor") {
                    return res.redirect("/dashboard/instrutor");
                } else {
                    return res.redirect(redirectUrl === "/" ? "/dashboard/aluno" : redirectUrl);
                }
            });
        })(req, res, next);
    });

    // -------------------------------------------------------------------------
    // Legacy /api/login - Redirect to Google or handle local
    // -------------------------------------------------------------------------
    app.get("/api/login", async (req, res, next) => {
        logger.info(`[auth] GET /api/login hit (Authenticated: ${req.isAuthenticated()})`, { authenticated: req.isAuthenticated() });

        // Local mode for development
        if (process.env.AUTH_MODE === "local") {
            logger.info("[auth] Local mode detected. Performing auto-login...");
            try {
                const userId = process.env.LOCAL_USER_ID || "local-admin";
                const localRole = process.env.LOCAL_USER_ROLE as "student" | "instructor" | "admin" | undefined;
                let mockUser = await storage.getUser(userId);

                if (!mockUser) {
                    logger.info(`[auth] Local user ${userId} not found. Creating...`);
                    await storage.upsertUser({
                        id: userId,
                        email: process.env.LOCAL_USER_EMAIL || "admin@example.com",
                        firstName: process.env.LOCAL_USER_FIRSTNAME || "Local",
                        lastName: process.env.LOCAL_USER_LASTNAME || "Admin",
                        ...(localRole ? { role: localRole } : {}),
                    });
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
                        logger.info(`[auth] Local auto-login success for ${mockUser!.id}`);
                        return res.redirect("/");
                    });
                    return;
                }
            } catch (err) {
                console.error("[auth] Local auto-login failed:", err);
            }
        }

        // Redirect to Google OAuth
        const hasGoogle = (passport as any)._strategies?.google;
        if (hasGoogle) {
            const redirect = req.query.redirect as string || "/";
            return res.redirect(`/api/auth/google?redirect=${encodeURIComponent(redirect)}`);
        }

        console.warn("[auth] No authentication strategy available for /api/login");
        res.redirect("/login?error=auth_unavailable");
    });

    // -------------------------------------------------------------------------
    // POST /api/login - Local Strategy (username/password)
    // -------------------------------------------------------------------------
    app.post("/api/login", (req, res, next) => {
        logger.info("[auth] POST /api/login hit (LocalStrategy)");
        passport.authenticate("local", (err: any, user: any, info: any) => {
            if (err) return next(err);
            if (!user) return res.status(401).json({ message: "Credenciais inválidas" });
            req.logIn(user, (loginErr) => {
                if (loginErr) return next(loginErr);
                return res.json(user);
            });
        })(req, res, next);
    });

    // -------------------------------------------------------------------------
    // Logout Routes
    // -------------------------------------------------------------------------
    app.get("/api/logout", (req, res, next) => {
        logger.info("GET /api/logout hit");
        req.logout((err) => {
            if (err) return next(err);
            res.redirect("/");
        });
    });

    app.post("/api/logout", (req, res, next) => {
        logger.info("POST /api/logout hit");
        req.logout((err) => {
            if (err) return next(err);
            res.sendStatus(200);
        });
    });

    // -------------------------------------------------------------------------
    // Auth Status Route
    // -------------------------------------------------------------------------
    app.get("/api/auth/user", (req, res) => {
        if (req.isAuthenticated() && req.user) {
            const user = req.user as any;
            return res.json({
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                profileImageUrl: user.profileImageUrl,
                role: user.role,
            });
        }
        return res.status(401).json({ message: "Not authenticated" });
    });

    logger.info("[auth] Auth Routes Registered.");
}

// =============================================================================
// Authentication Middleware
// =============================================================================

export const isAuthenticated: RequestHandler = async (req, res, next) => {
    // Local/offline mode
    if (process.env.AUTH_MODE === "local") {
        let user = (req as any).user;
        if (!user) {
            const isTestEnv = process.env.NODE_ENV === "test" || process.env.VITEST === "true";
            const allowBypass = process.env.E2E_AUTH_BYPASS === "true" || process.env.E2E_AUTH_BYPASS === "1";

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

    // Production mode - check session
    if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach claims for backward compatibility
    const user = req.user as any;
    if (!user.claims) {
        user.claims = { sub: user.id };
    }

    return next();
};
