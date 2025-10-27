// config/redis.js
import Redis from "ioredis";
import dotenv from "dotenv";
import { COLORS } from "../helper/logger.js";

dotenv.config();
// ✅ Fallback in-memory cache for when Redis is unavailable
class MemoryCache {
  constructor() {
    this.store = new Map();
    console.log(
      COLORS[process.env.WARNING],
      "Using in-memory cache (Redis not available)"
    );
  }

  async get(key) {
    return this.store.get(key);
  }

  async setex(key, seconds, value) {
    this.store.set(key, value);
    setTimeout(() => this.store.delete(key), seconds * 1000);
    return "OK";
  }

  async del(key) {
    return this.store.delete(key);
  }

  async keys(pattern) {
    const regex = new RegExp(pattern.replace("*", ".*"));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  async quit() {
    this.store.clear();
  }
}

let redisClient;

/**
 * Initialize Redis connection.
 * Falls back to in-memory cache if connection fails.
 */
async function initializeRedis() {
  const redisUrl = process.env.REDIS_URL;
  const isLocal =
    redisUrl.includes("localhost") || redisUrl.includes("127.0.0.1");

  try {
    console.log(
      COLORS[process.env.WARNING],
      `Initializing Redis Client: ${
        isLocal ? "Local" : "Cloud (Redis Cloud)"
      } mode`
    );

    // Configure connection
    const client = new Redis(redisUrl, {
      //   tls: isLocal ? undefined : {}, // Redis Cloud requires TLS
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      retryStrategy(times) {
        // Wait 2 seconds between retries, max 5 retries
        return times < 5 ? 2000 : null;
      },
    });

    // Try a ping test
    await client.ping();
    console.log(COLORS[process.env.SUCCESS], "Connected to Redis successfully");

    redisClient = client;
    return redisClient;
  } catch (error) {
    console.error(
      "Redis connection failed → switching to in-memory cache:",
      error.message
    );
    redisClient = new MemoryCache();
    return redisClient;
  }
}

// Initialize immediately (top-level await supported in ESM)
redisClient = await initializeRedis();

export default redisClient;
