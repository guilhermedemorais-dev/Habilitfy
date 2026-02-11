import { type Request, type Response, type NextFunction } from "express";
import { getCache, setCache } from "./redis";

/**
 * Express middleware for caching GET responses.
 *
 * @param ttlSeconds - Time to live in seconds
 * @param keyGenerator - Optional function to generate a custom cache key
 */
export function cacheMiddleware(
    ttlSeconds: number,
    keyGenerator?: (req: Request) => string
) {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Only cache GET requests
        if (req.method !== "GET") {
            return next();
        }

        const key = keyGenerator
            ? keyGenerator(req)
            : `cache:${req.originalUrl}`;

        try {
            const cached = await getCache<{ body: unknown; statusCode: number }>(key);

            if (cached) {
                return res.status(cached.statusCode).json(cached.body);
            }

            // Intercept res.json to cache the response
            const originalJson = res.json.bind(res);
            res.json = function (body) {
                // Only cache successful responses
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    setCache(key, { body, statusCode: res.statusCode }, ttlSeconds).catch(
                        () => { }
                    );
                }
                return originalJson(body);
            };

            next();
        } catch {
            // If cache fails, just proceed normally
            next();
        }
    };
}
