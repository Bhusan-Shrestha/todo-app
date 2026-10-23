const { redis } = require("../redis");

function rateLimit({ name, windowSeconds, maxRequests }) {
  return async (req, res, next) => {
    try {
      const clientKey = req.ip || req.socket.remoteAddress || "unknown";
      const key = `rate-limit:${name}:${clientKey}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSeconds);

      res.set("X-RateLimit-Limit", String(maxRequests));
      res.set("X-RateLimit-Remaining", String(Math.max(maxRequests - count, 0)));

      if (count > maxRequests) {
        const retryAfter = await redis.ttl(key);
        if (retryAfter > 0) res.set("Retry-After", String(retryAfter));
        return res.status(429).json({ error: "Too many requests; try again later" });
      }
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { rateLimit };
