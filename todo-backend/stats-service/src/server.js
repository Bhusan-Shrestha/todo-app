const express = require("express");
const morgan = require("morgan");
const os = require("os");
const { calculateStats } = require("./calculateStats");

const app = express();
const PORT = process.env.PORT || 5000;

// Which container / which swarm node answered. Handy to see scaling work.
// NODE_NAME is filled in by Swarm (see docker-compose.yml).
const whoAmI = () => ({
  container: os.hostname(),
  node: process.env.NODE_NAME || "unknown",
});

app.use(express.json({ limit: "2mb" }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Used by the Docker healthcheck
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "todo-stats", ...whoAmI() });
});

// POST /stats   body: { "todos": [ { id, title, completed, created_at }, ... ] }
app.post("/stats", (req, res) => {
  const { todos } = req.body || {};
  if (!Array.isArray(todos)) {
    return res.status(400).json({ error: "todos must be an array" });
  }
  res.json({ ...calculateStats(todos), servedBy: whoAmI() });
});

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

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Todo stats service listening on port ${PORT}`);
});
