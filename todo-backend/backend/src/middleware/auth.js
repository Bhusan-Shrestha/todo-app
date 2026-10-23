const { redis } = require("../redis");

async function requireAuth(req, res, next) {
  try {
    const header = req.get("authorization") || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const userId = await redis.get(`session:${token}`);
    if (!userId) return res.status(401).json({ error: "Session expired or invalid" });

    req.userId = Number(userId);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAuth };
