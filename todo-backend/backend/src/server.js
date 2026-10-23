require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const pool = require("./db");
const todosRouter = require("./routes/todos.routes");
const authRouter = require("./routes/auth.routes");
const { connectRedis } = require("./redis");

const app = express();
const PORT = process.env.PORT || 4000;

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

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", process.env.FRONTEND_ORIGIN || "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health check (used by Docker healthcheck later)
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(503)
      .json({ status: "error", db: "unreachable", message: err.message });
  }
});

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
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal server error" });
});

async function start() {
  await connectRedis();
  app.listen(PORT, () => console.log(`Todo API listening on port ${PORT}`));
}

start().catch((err) => {
  console.error("Failed to start Todo API:", err);
  process.exitCode = 1;
});
