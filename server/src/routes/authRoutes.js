
const express = require("express");
const { loginLimiter, registerLimiter } = require("../middleware/authRateLimiter");

const {
  registerSchema,
  loginSchema,
} = require("../validators/authValidator");

const validateRequest = require("../validators/validateRequest");
const authenticate = require("../middleware/authenticate");
const requireCsrfToken = require("../middleware/requireCsrfToken");

const {
  register,
  login,
  getCurrentUser,
  logout
} = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  registerLimiter,
  validateRequest(registerSchema),
  register
);

router.post(
  "/login",
  loginLimiter,
  validateRequest(loginSchema),
  login
);

router.post("/logout", authenticate, requireCsrfToken, logout);

router.get("/me", authenticate, getCurrentUser);

module.exports = router;
