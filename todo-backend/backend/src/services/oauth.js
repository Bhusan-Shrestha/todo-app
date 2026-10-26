const crypto = require("crypto");
const pool = require("../db");
const { redis } = require("../redis");
const { createSession } = require("../controllers/auth.controller");

const STATE_TTL_SECONDS = 600;
const DEPLOYED_FRONTEND_ORIGIN = "https://taskflow.bhusanshrestha.com.np";

const FRONTEND_ORIGIN = (process.env.FRONTEND_ORIGIN || DEPLOYED_FRONTEND_ORIGIN)
  .split(",")[0]
  .trim()
  .replace(/\/+$/, "");

function sanitizeReturnTo(url) {
  if (!url) return FRONTEND_ORIGIN;
  try {
    const origin = new URL(url).origin.replace(/\/+$/, "");
    const allowed = (process.env.FRONTEND_ORIGIN || "")
      .split(",")
      .map((o) => o.trim().replace(/\/+$/, ""))
      .concat([
        DEPLOYED_FRONTEND_ORIGIN,
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
      ]);
    if (allowed.includes(origin)) return origin;
  } catch (_) {}
  return FRONTEND_ORIGIN;
}

const providers = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: "openid email profile",
    grantType: "authorization_code",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    authorizationUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: "read:user user:email",
  },
};

function callbackUrl(provider, req) {
  const configuredOrigin = process.env.OAUTH_CALLBACK_ORIGIN || process.env.API_ORIGIN;
  if (configuredOrigin) {
    let origin;
    try {
      const parsed = new URL(configuredOrigin);
      if (
        parsed.username ||
        parsed.password ||
        parsed.pathname !== "/" ||
        parsed.search ||
        parsed.hash ||
        (process.env.NODE_ENV === "production" && parsed.protocol !== "https:")
      ) {
        throw new Error();
      }
      origin = parsed.origin;
    } catch (_) {
      const error = new Error("OAuth callback origin must be a public origin without a path");
      error.status = 500;
      throw error;
    }
    return `${origin}/api/auth/oauth/${provider}/callback`;
  }
  if (process.env.NODE_ENV !== "production" && req) {
    const host = req.get("host");
    if (host && (host.startsWith("localhost") || host.startsWith("127.0.0.1"))) {
      return `${req.protocol}://${host}/api/auth/oauth/${provider}/callback`;
    }
  }
  const error = new Error("OAuth callback origin is not configured");
  error.status = 500;
  throw error;
}

function providerConfig(provider) {
  const config = providers[provider];
  if (!config || !config.clientId || !config.clientSecret) {
    const error = new Error(`${provider} OAuth is not configured`);
    error.status = 503;
    throw error;
  }
  return config;
}

function redirectError(message, targetOrigin = FRONTEND_ORIGIN) {
  return `${targetOrigin}/?oauth_error=${encodeURIComponent(message)}`;
}

async function startOAuth(req, res, next) {
  try {
    const { provider } = req.params;
    const config = providerConfig(provider);
    const returnTo = sanitizeReturnTo(req.query.return_to || req.get("referer"));
    const redirectUri = callbackUrl(provider, req);

    const state = crypto.randomBytes(32).toString("hex");
    await redis.set(
      `oauth-state:${state}`,
      JSON.stringify({ provider, returnTo, redirectUri }),
      { EX: STATE_TTL_SECONDS },
    );

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: config.scopes,
      state,
    });
    res.redirect(`${config.authorizationUrl}?${params}`);
  } catch (err) {
    next(err);
  }
}

async function exchangeCode(provider, code, redirectUri) {
  const config = providerConfig(provider);
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: redirectUri || callbackUrl(provider),
      ...(config.grantType ? { grant_type: config.grantType } : {}),
    }),
  });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error(body.error_description || body.error || "OAuth token exchange failed");
  return body.access_token;
}

async function fetchProfile(provider, accessToken) {
  if (provider === "google") {
    const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const profile = await response.json();
    if (!response.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error("Google did not return a verified email");
    }
    return { providerId: profile.sub, email: profile.email, name: profile.name || profile.email.split("@")[0] };
  }

  const profileResponse = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "User-Agent": "todo-app" },
  });
  const profile = await profileResponse.json();
  const emailResponse = await fetch("https://api.github.com/user/emails", {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/vnd.github+json", "User-Agent": "todo-app" },
  });
  const emails = await emailResponse.json();
  const email = Array.isArray(emails) && emails.find((item) => item.primary && item.verified)?.email;
  if (!profileResponse.ok || !profile.id || !email) throw new Error("GitHub did not return a verified email");
  return { providerId: String(profile.id), email, name: profile.name || profile.login || email.split("@")[0] };
}

async function findOrCreateUser(provider, profile) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const linked = await client.query(
      `SELECT u.id, u.name, u.email FROM oauth_accounts oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.provider = $1 AND oa.provider_user_id = $2`,
      [provider, profile.providerId],
    );
    let user = linked.rows[0];
    if (!user) {
      const existing = await client.query("SELECT id, name, email FROM users WHERE email = $1", [profile.email.toLowerCase()]);
      if (existing.rows[0]) {
        user = existing.rows[0];
      } else {
        const created = await client.query(
          "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, NULL) RETURNING id, name, email",
          [profile.name.trim().slice(0, 100), profile.email.toLowerCase()],
        );
        user = created.rows[0];
      }
      await client.query(
        "INSERT INTO oauth_accounts (user_id, provider, provider_user_id) VALUES ($1, $2, $3)",
        [user.id, provider, profile.providerId],
      );
    }
    await client.query("COMMIT");
    return user;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function handleOAuthCallback(req, res) {
  const { provider } = req.params;
  const { code, state, error } = req.query;
  let targetOrigin = FRONTEND_ORIGIN;
  try {
    if (!providers[provider] || typeof state !== "string") {
      throw new Error("Invalid OAuth callback");
    }

    const stateRaw = await redis.getDel(`oauth-state:${state}`);
    if (!stateRaw) throw new Error("Invalid or expired OAuth state");

    const stateData = JSON.parse(stateRaw);
    if (stateData.provider !== provider) throw new Error("Invalid or expired OAuth state");
    targetOrigin = stateData.returnTo || FRONTEND_ORIGIN;
    if (error) throw new Error("OAuth sign-in was cancelled");
    if (typeof code !== "string" || !code) throw new Error("Invalid OAuth callback");

    const profile = await fetchProfile(provider, await exchangeCode(provider, code, stateData.redirectUri));
    const user = await findOrCreateUser(provider, profile);
    const handoff = crypto.randomBytes(32).toString("hex");
    await redis.set(`oauth-result:${handoff}`, String(user.id), { EX: 60 });
    return res.redirect(`${targetOrigin}/?oauth_code=${encodeURIComponent(handoff)}`);
  } catch (err) {
    return res.redirect(redirectError(err.message || "OAuth sign-in failed", targetOrigin));
  }
}

async function exchangeOAuthCode(req, res, next) {
  try {
    const { code } = req.body;
    if (!code || !/^[a-f0-9]{64}$/.test(code)) return res.status(400).json({ error: "Invalid OAuth code" });
    const userId = await redis.getDel(`oauth-result:${code}`);
    if (!userId) return res.status(400).json({ error: "OAuth code is invalid or expired" });
    const { rows } = await pool.query("SELECT id, name, email FROM users WHERE id = $1", [userId]);
    if (!rows[0]) return res.status(401).json({ error: "User not found" });
    const token = await createSession(userId);
    res.json({ user: rows[0], token });
  } catch (err) {
    next(err);
  }
}

module.exports = { startOAuth, handleOAuthCallback, exchangeOAuthCode };
