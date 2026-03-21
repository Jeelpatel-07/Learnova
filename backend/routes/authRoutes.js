// ==============================================
// AUTH ROUTES
// ==============================================

const express = require("express");
const router = express.Router();

const {
  signup,
  login,
  getMe,
  getAllUsers,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/me", protect, getMe);

// Admin only
router.get("/users", protect, authorize("Admin"), getAllUsers);

module.exports = router;