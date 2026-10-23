const express = require("express");
const { register, login, me, logout } = require("../controllers/auth.controller");
const { startOAuth, handleOAuthCallback, exchangeOAuthCode } = require("../services/oauth");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/logout", requireAuth, logout);
router.get("/oauth/:provider", startOAuth);
router.get("/oauth/:provider/callback", handleOAuthCallback);
router.post("/oauth/exchange", exchangeOAuthCode);

module.exports = router;
