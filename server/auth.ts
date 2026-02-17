import { logger } from "./utils/logger";
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import MySQLStore from "express-mysql-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { scrypt, randomBytes, randomUUID, timingSafeEqual } from "crypto";
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
    if (!stored || !stored.includes(".")) return false;

    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) return false;

    try {
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
        if (hashedBuf.length !== suppliedBuf.length) return false;
        return timingSafeEqual(hashedBuf, suppliedBuf);
    } catch {
        return false;
    }
}

// =============================================================================
// Session Configuration
// =============================================================================

export function getSession() {
    const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 7 days

    if (!process.env.SESSION_SECRET && process.env.AUTH_MODE === "local") {
        process.env.SESSION_SECRET = "local-dev-secret";
    }

    const MySQLStoreSession = MySQLStore(session);

    // Parse DATABASE_URL to extract connection params for the session store
    let dbHost = process.env.DB_HOST || 'localhost';
    let dbPort = parseInt(process.env.DB_PORT || '3306');
    let dbUser = process.env.DB_USER || 'root';
    let dbPassword = process.env.DB_PASSWORD || '';
    let dbName = process.env.DB_NAME || 'habilitfy';

    if (process.env.DATABASE_URL) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            dbHost = url.hostname || dbHost;
            dbPort = url.port ? parseInt(url.port) : dbPort;
            dbUser = url.username || dbUser;
            dbPassword = url.password || dbPassword;
            dbName = url.pathname.replace('/', '') || dbName;
        } catch (e) {
            // fallback to individual env vars
        }
    }

    const sessionStore = new MySQLStoreSession({
        host: dbHost,
        port: dbPort,
        user: dbUser,
        password: dbPassword,
        database: dbName,
        createDatabaseTable: false,
        schema: {
            tableName: 'sessions',
            columnNames: {
                session_id: 'session_id',
                expires: 'expires',
                data: 'data'
            }
        }
    });

    sessionStore.on?.('error', (error: any) => {
        logger.error('❌ Session store error:', error);
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
                        logger.info(`[auth] Google Strategy - Looking up user: googleId=${googleId}, email=${email}`);

                        // Try to find user by googleId first, then by email
                        let user = await storage.getUserByGoogleId?.(googleId);

                        if (!user && email) {
                            user = await storage.getUserByEmail?.(email);
                        }

                        if (user) {
                            logger.info(`[auth] Google Strategy - User found: id=${user.id}, email=${user.email}`);
                            // Update user with Google profile info if needed
                            const defaultGooglePassword = process.env.GOOGLE_AUTO_REGISTER_PASSWORD;
                            const shouldSetPassword =
                                typeof defaultGooglePassword === "string" &&
                                defaultGooglePassword.length > 0 &&
                                (!user.password || user.password.length === 0);

                            if (!user.googleId || shouldSetPassword) {
                                await storage.upsertUser({
                                    id: user.id,
                                    googleId: googleId,
                                    email: email || user.email,
                                    firstName: profile.name?.givenName || user.firstName,
                                    lastName: profile.name?.familyName || user.lastName,
                                    profileImageUrl: profile.photos?.[0]?.value || user.profileImageUrl,
                                    ...(shouldSetPassword
                                        ? { password: await hashPassword(defaultGooglePassword!) }
                                        : {}),
                                });
                                user = await storage.getUser(user.id);
                            }
                            return done(null, user);
                        }

                        const shouldAutoRegisterGoogle =
                            process.env.GOOGLE_AUTO_REGISTER === "true" ||
                            process.env.GOOGLE_AUTO_REGISTER === "1";

                        if (shouldAutoRegisterGoogle && email) {
                            logger.info(`[auth] Google Strategy - Auto-register enabled for email=${email}`);

                            const defaultGooglePassword = process.env.GOOGLE_AUTO_REGISTER_PASSWORD;
                            const autoPasswordHash =
                                typeof defaultGooglePassword === "string" && defaultGooglePassword.length > 0
                                    ? await hashPassword(defaultGooglePassword)
                                    : undefined;

                            const autoCreated = await storage.upsertUser({
                                id: randomUUID(),
                                googleId: googleId,
                                email: email.toLowerCase().trim(),
                                firstName: profile.name?.givenName || "Usuário",
                                lastName: profile.name?.familyName || "Google",
                                profileImageUrl: profile.photos?.[0]?.value,
                                role: "student",
                                kycStatus: "approved",
                                isVerified: true,
                                password: autoPasswordHash,
                            });

                            return done(null, autoCreated);
                        }

                        logger.info(`[auth] Google Strategy - User NOT found, passing to registration flow`);
                        // User not found - return false but pass profile for registration flow
                        return done(null, false, { profile } as any);
                    } catch (err: any) {
                        logger.error(`[auth] Google Strategy ERROR: ${err?.message || err}`, { stack: err?.stack });
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
        new LocalStrategy(
            {
                usernameField: "username",
                passwordField: "password",
                passReqToCallback: true,
            },
            async (req: any, username, password, done) => {
            try {
                const fallbackEmail = typeof req?.body?.email === "string" ? req.body.email : "";
                const candidate = (username || fallbackEmail || "").trim().toLowerCase();
                if (!candidate || typeof password !== "string") {
                    return done(null, false);
                }

                const user = await storage.getUserByUsername(candidate);
                if (!user || !user.password) {
                    return done(null, false);
                }

                let isValid = await comparePassword(password, user.password);
                if (!isValid && !user.password.includes(".")) {
                    // Backward compatibility for legacy/plaintext rows: migrate on successful login.
                    if (user.password === password) {
                        const migratedHash = await hashPassword(password);
                        await storage.updateUser(user.id, { password: migratedHash });
                        isValid = true;
                    }
                }

                if (!isValid) {
                    return done(null, false);
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
            },
        )
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
            console.log("[auth] Google callback - err:", err);
            console.log("[auth] Google callback - user:", user ? { id: user.id, email: user.email } : null);
            console.log("[auth] Google callback - info:", info);

            if (err) {
                console.error("[auth] Google callback error:", err);
                return res.redirect("/login?error=auth_failed");
            }
            if (!user) {
                // User not found - check if profile was passed to store in session
                const profile = (info as any)?.profile;
                console.log("[auth] Google callback - profile from info:", profile ? { id: profile.id, email: profile.emails?.[0]?.value } : null);

                if (!profile) {
                    console.log("[auth] No profile found, redirecting to login with error");
                    return res.redirect("/login?error=account_not_found");
                }

                (req.session as any).pendingGoogleUser = {
                    googleId: profile.id,
                    email: profile.emails?.[0]?.value,
                    firstName: profile.name?.givenName,
                    lastName: profile.name?.familyName,
                    profileImageUrl: profile.photos?.[0]?.value,
                };
                console.log("[auth] Saved pendingGoogleUser to session, redirecting to signup");
                return res.redirect("/signup-student?google_connected=true");
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
    // Helper: Get Pending Google User (for registration flow)
    // -------------------------------------------------------------------------
    app.get("/api/auth/pending-google-user", (req, res) => {
        const pendingUser = (req.session as any).pendingGoogleUser;
        if (pendingUser) {
            return res.json(pendingUser);
        }
        return res.status(404).json({ message: "No pending Google user found" });
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
            if (err) {
                logger.error(`[auth] POST /api/login DB/Auth error: ${err?.message || err}`, { stack: err?.stack });
                return res.status(500).json({ message: err?.message || "Erro interno de autenticação" });
            }
            if (!user) return res.status(401).json({ message: "Credenciais inválidas" });
            req.logIn(user, (loginErr) => {
                if (loginErr) {
                    logger.error(`[auth] POST /api/login session error: ${loginErr?.message}`);
                    return res.status(500).json({ message: loginErr?.message || "Erro ao criar sessão" });
                }
                const { password: _pw, verificationToken: _vt, ...safeUser } = user;
                return res.json(safeUser);
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

export function requireAdminRole(requiredRole: 'master' | 'manager' | 'support' = 'support') {
    return (req: any, res: any, next: any) => {
        if (!req.isAuthenticated() || !req.user || req.user.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Admin access required" });
        }

        const userRole = req.user.adminRole;

        // Hierarchy: master > manager > support
        const roles = ['support', 'manager', 'master'];
        const userRoleIndex = roles.indexOf(userRole);
        const requiredRoleIndex = roles.indexOf(requiredRole);

        if (userRoleIndex < requiredRoleIndex) {
            return res.status(403).json({ message: `Forbidden: Requires ${requiredRole} role` });
        }

        next();
    };
}
