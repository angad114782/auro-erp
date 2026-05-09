import Redis from "ioredis";

/* --------------------------------------------------
   Redis client – production-grade singleton
   Falls back gracefully if Redis is unavailable
-------------------------------------------------- */

let client = null;
let isReady = false;

function getRedisUrl() {
  return process.env.REDIS_URL || "redis://127.0.0.1:6379";
}

export function getRedis() {
  if (client) return client;

  try {
    client = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 5) return null; // stop retrying after 5 attempts
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
      enableReadyCheck: true,
      connectTimeout: 5000,
    });

    client.on("ready", () => {
      isReady = true;
      console.log("✅ Redis connected");
    });

    client.on("error", (err) => {
      if (isReady) console.error("⚠️ Redis error:", err.message);
      isReady = false;
    });

    client.on("close", () => {
      isReady = false;
    });

    // Don't block server startup – connect async
    client.connect().catch(() => {
      console.warn("⚠️ Redis not available – running without cache");
    });
  } catch {
    console.warn("⚠️ Redis init failed – running without cache");
  }

  return client;
}

/* --------------------------------------------------
   Cache helpers – fail silently if Redis is down
-------------------------------------------------- */

/**
 * Get cached value (parsed JSON). Returns null on miss or error.
 */
export async function cacheGet(key) {
  try {
    if (!client || !isReady) return null;
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Set cache value with TTL (seconds). Fails silently.
 */
export async function cacheSet(key, value, ttlSeconds = 300) {
  try {
    if (!client || !isReady) return;
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    // ignore
  }
}

/**
 * Delete one or more cache keys. Supports glob patterns.
 */
export async function cacheDel(...patterns) {
  try {
    if (!client || !isReady) return;
    for (const pattern of patterns) {
      if (pattern.includes("*")) {
        const keys = await client.keys(pattern);
        if (keys.length) await client.del(...keys);
      } else {
        await client.del(pattern);
      }
    }
  } catch {
    // ignore
  }
}

/**
 * Wrap an async function with cache.
 * Usage: const data = await cacheWrap("key", 300, () => expensiveQuery());
 */
export async function cacheWrap(key, ttlSeconds, fn) {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const result = await fn();
  await cacheSet(key, result, ttlSeconds);
  return result;
}

// Initialize on import
getRedis();
