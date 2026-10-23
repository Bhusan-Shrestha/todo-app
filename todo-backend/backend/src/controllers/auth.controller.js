const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../db");
const { redis } = require("../redis");

const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS) || 604800;

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(`session:${token}`, String(userId), { EX: SESSION_TTL_SECONDS });
  return token;
}

async function register(req, res, next) {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !name.trim() || !email || !email.trim() || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (password.length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });
    if (password !== confirmPassword) return res.status(400).json({ error: "passwords do not match" });

    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email",
      [name.trim(), normalizedEmail, passwordHash],
    );
    const token = await createSession(rows[0].id);
    res.status(201).json({ user: publicUser(rows[0]), token });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email is already registered" });
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email and password are required" });
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.trim().toLowerCase()]);
    if (rows.length === 0 || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const token = await createSession(rows[0].id);
    res.json({ user: publicUser(rows[0]), token });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    const { rows } = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) return res.status(401).json({ error: "User not found" });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    await redis.del(`session:${req.get("authorization").slice(7).trim()}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me, logout, createSession };
