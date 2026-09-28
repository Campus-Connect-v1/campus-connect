// utils/responseCache.js
//
// Redis-backed caching of whole GET responses.
//
// Only for endpoints whose response is either identical for everyone
// (scope "public") or depends on nothing but the caller's own id (scope
// "user"). Most endpoints in this API are neither: the feed, stories, profiles
// and follow-stats all carry viewer-relative fields (has_liked, is_following,
// connection status), and caching them would mean invalidating on dozens of
// write paths. Measure before adding one of those here.
//
// Keys:   rc:<tag>:<scope-id>:<originalUrl>
//   tag       groups entries for invalidation ("university", "recs")
//   scope-id  "all" for public, the user id for per-user entries
//   url       includes the query string, so ?search=x is its own entry
//
// The cache fails open everywhere: a Redis error serves the request from the
// database as if the cache did not exist, never a 500.

import redisClient from "../config/redis.js";

const PREFIX = "rc";

const keyFor = (tag, req, scope) =>
  `${PREFIX}:${tag}:${scope === "user" ? req.user?.id : "all"}:${req.originalUrl}`;

/**
 * Cache successful JSON GET responses for `ttl` seconds.
 *
 *   router.get("/x", cacheResponse({ tag: "university", ttl: 3600 }), handler)
 */
export const cacheResponse =
  ({ tag, ttl, scope = "public" }) =>
  async (req, res, next) => {
    if (req.method !== "GET") return next();
    // A per-user entry without a user would be shared by every anonymous
    // caller under "undefined" -- serve those uncached instead.
    if (scope === "user" && !req.user?.id) return next();

    const key = keyFor(tag, req, scope);

    try {
      const hit = await redisClient.get(key);
      if (hit) {
        res.set("X-Cache", "HIT");
        return res.type("application/json").send(hit);
      }
    } catch (error) {
      console.error("responseCache read failed:", error.message);
      return next();
    }

    res.set("X-Cache", "MISS");
    const json = res.json.bind(res);
    res.json = (body) => {
      // Errors and empty-because-broken responses must not be pinned for an
      // hour; only a clean 200 is worth remembering.
      if (res.statusCode === 200) {
        redisClient
          .setex(key, ttl, JSON.stringify(body))
          .catch((error) => console.error("responseCache write failed:", error.message));
      }
      return json(body);
    };
    next();
  };

const deleteMatching = async (pattern) => {
  // SCAN rather than KEYS: KEYS blocks Redis for the whole keyspace walk.
  // The in-memory fallback has no SCAN, only its own keys().
  if (typeof redisClient.scanStream !== "function") {
    const keys = await redisClient.keys(pattern);
    await Promise.all(keys.map((key) => redisClient.del(key)));
    return;
  }

  const stream = redisClient.scanStream({ match: pattern, count: 200 });
  for await (const keys of stream) {
    if (keys.length) await redisClient.del(...keys);
  }
};

/**
 * Drop cached entries for a tag -- every user's, or just the given users'.
 * Never throws: a failed invalidation costs staleness up to the TTL, not the
 * write that triggered it.
 */
export const invalidateCache = async (tag, userIds = null) => {
  const patterns = userIds
    ? userIds.filter(Boolean).map((id) => `${PREFIX}:${tag}:${id}:*`)
    : [`${PREFIX}:${tag}:*`];

  try {
    await Promise.all(patterns.map(deleteMatching));
  } catch (error) {
    console.error(`responseCache invalidate(${tag}) failed:`, error.message);
  }
};

/**
 * Invalidate a tag after any successful non-GET request on this router.
 *
 * For routers whose every write can affect cached data (the admin API edits
 * universities, buildings and facilities through generic handlers, seed packs
 * and imports), hooking the router is more reliable than finding every write.
 */
export const invalidateOnWrite = (tag) => (req, res, next) => {
  if (req.method === "GET") return next();
  res.on("finish", () => {
    if (res.statusCode < 400) void invalidateCache(tag);
  });
  next();
};
