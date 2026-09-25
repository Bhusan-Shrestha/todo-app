require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const pool = require("./db");
const todosRouter = require("./routes/todos.routes");

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

app.listen(PORT, () => {
  console.log(`Todo API listening on port ${PORT}`);
});
