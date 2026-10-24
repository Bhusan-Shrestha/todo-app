const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../db");
const { redis } = require("../redis");
const { z } = require("zod");

const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS) || 604800;

function publicUser(user) {
  return { id: user.id, name: user.name, username: user.name, email: user.email };
}

async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  await redis.set(`session:${token}`, String(userId), { EX: SESSION_TTL_SECONDS });
  return token;
}

async function register(req, res, next) {
  try {
    const userSchema = z.object({
      name: z.string().min(1).max(100),
      email: z.string().email(),
      password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/, "Password must contain at least one letter and one number"),
      confirmPassword: z.string().min(8),
    });
    const { name, email, password, confirmPassword } = userSchema.parse(req.body);
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
    const loginSchema = z.object({
      email: z.string().trim().email(),
      password: z.string().min(1),
    });
    const { email, password } = loginSchema.parse(req.body);
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email.toLowerCase()]
    );
    if (
      rows.length === 0 ||
      !rows[0].password_hash ||
      !(await bcrypt.compare(password, rows[0].password_hash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password",
      });
    }
    const token = await createSession(rows[0].id);
    return res.json({
      user: publicUser(rows[0]),
      token,
    });
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

async function updateProfile(req, res, next) {
  try {
    const { name, username, email } = req.body;
    const incomingName = username !== undefined ? username : name;
    if (incomingName === undefined && !email) {
      return res.status(400).json({ error: "Username or email is required" });
    }

    const { rows: userRows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (userRows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = userRows[0];

    let newName = user.name;
    if (incomingName && incomingName.trim()) {
      newName = incomingName.trim().slice(0, 100);
    }

    let newEmail = user.email;
    if (email && email.trim()) {
      const normalizedEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        return res.status(400).json({ error: "Invalid email format" });
      }
      if (normalizedEmail !== user.email) {
        const existing = await pool.query("SELECT id FROM users WHERE email = $1 AND id != $2", [
          normalizedEmail,
          req.userId,
        ]);
        if (existing.rows.length > 0) {
          return res.status(409).json({ error: "Email is already registered to another account" });
        }
        newEmail = normalizedEmail;
      }
    }

    const { rows } = await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING id, name, email",
      [newName, newEmail, req.userId],
    );

    res.json({ user: publicUser(rows[0]), message: "Profile updated successfully" });
  } catch (err) {
    if (err.code === "23505") return res.status(409).json({ error: "Email is already registered to another account" });
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "New password must be at least 8 characters" });
    }
    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    const user = rows[0];

    // If user has an existing password (not OAuth-only account without password)
    if (user.password_hash) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required" });
      }
      const match = await bcrypt.compare(currentPassword, user.password_hash);
      if (!match) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await pool.query("UPDATE users SET password_hash = $1 WHERE id = $2", [passwordHash, req.userId]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  me,
  logout,
  createSession,
  updateProfile,
  changePassword,
};
