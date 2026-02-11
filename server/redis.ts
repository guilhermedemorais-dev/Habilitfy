import Redis from "ioredis";
import { logger } from "./utils/logger";

let redis: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL;

if (REDIS_URL) {
    try {
        redis = new Redis(REDIS_URL, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            connectTimeout: 5000,
            retryStrategy(times) {
                if (times > 3) {
                    logger.warn("[REDIS] Max retries reached, giving up");
                    return null; // Stop retrying
                }
                return Math.min(times * 200, 2000);
            },
        });

        redis.on("connect", () => {
            logger.info("[REDIS] Connected successfully");
        });

        redis.on("error", (err) => {
            logger.warn(`[REDIS] Connection error: ${err.message}`);
        });

        // Try to connect
        redis.connect().catch(() => {
            logger.warn("[REDIS] Could not connect, running without cache");
            redis = null;
        });
    } catch {
        logger.warn("[REDIS] Failed to initialize, running without cache");
        redis = null;
    }
} else {
    logger.info("[REDIS] No REDIS_URL configured, running without cache");
}

/**
 * Get cached data by key
 */
export async function getCache<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
        const data = await redis.get(key);
        if (data) {
            logger.info(`[CACHE HIT] ${key}`);
            return JSON.parse(data) as T;
        }
        logger.info(`[CACHE MISS] ${key}`);
        return null;
    } catch {
        return null;
    }
}

/**
 * Set cached data with TTL in seconds
 */
export async function setCache(key: string, data: unknown, ttlSeconds: number): Promise<void> {
    if (!redis) return;
    try {
        await redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch {
        // Silently fail
    }
}

/**
 * Invalidate cache keys matching a pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
    if (!redis) return;
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(...keys);
            logger.info(`[CACHE INVALIDATED] ${keys.length} keys matching "${pattern}"`);
        }
    } catch {
        // Silently fail
    }
}

export { redis };
