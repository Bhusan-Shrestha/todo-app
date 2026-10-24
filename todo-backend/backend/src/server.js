require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const pool = require("./db");
const todosRouter = require("./routes/todos.routes");
const authRouter = require("./routes/auth.routes");
const { redis, connectRedis } = require("./redis");
const { rateLimit } = require("./middleware/rate-limit");

const app = express();
const PORT = process.env.PORT || 4000;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction) app.set("trust proxy", 1);

app.use(
  helmet({
    hsts: false,
    contentSecurityPolicy: {
      directives: {
        "upgrade-insecure-requests": null,
      },
    },
  }),
);

app.use(express.json({ limit: "100kb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use((req, res, next) => {
  const configuredOrigins = (process.env.FRONTEND_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const allowedOrigins = new Set([
    ...configuredOrigins,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
  ]);

  const requestOrigin = req.get("origin");
  const normalizedOrigin = requestOrigin ? requestOrigin.replace(/\/+$/, "") : null;

  if (normalizedOrigin && (allowedOrigins.has(normalizedOrigin) || allowedOrigins.has("*"))) {
    res.header("Access-Control-Allow-Origin", requestOrigin);
    res.header("Vary", "Origin");
  }
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    if (!redis.isReady) throw new Error("Redis is not ready");
    res.json({ status: "ok", db: "connected", redis: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error" });
  }
});

const authRateLimit = rateLimit({ name: "auth", windowSeconds: 900, maxRequests: 20 });
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/oauth/exchange", authRateLimit);
app.use("/api/todos", todosRouter);
app.use("/api/auth", authRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({
    error: status === 500 && isProduction ? "Internal server error" : err.message || "Request failed",
  });
});

async function start() {
  await connectRedis();
  const server = app.listen(PORT, () => console.log(`Todo API listening on port ${PORT}`));
  let shuttingDown = false;
  async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`Received ${signal}; shutting down`);
    server.close(async () => {
      await Promise.allSettled([pool.end(), redis.quit()]);
      process.exit(0);
    });
  }
  process.once("SIGTERM", () => shutdown("SIGTERM"));
  process.once("SIGINT", () => shutdown("SIGINT"));
}

start().catch((err) => {
  console.error("Failed to start Todo API:", err);
  process.exitCode = 1;
});
