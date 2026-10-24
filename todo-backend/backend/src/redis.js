const { createClient } = require("redis");

const configuredRedisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const redisUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(configuredRedisUrl)
  ? configuredRedisUrl
  : `redis://${configuredRedisUrl}`;

const redis = createClient({
  url: redisUrl,
});

redis.on("error", (err) => {
  console.error("Redis client error:", err);
});

async function connectRedis() {
  if (!redis.isOpen) await redis.connect();
}

module.exports = { redis, connectRedis };
