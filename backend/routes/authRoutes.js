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
  adminSignup,
} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/admin-signup", adminSignup);

// Protected routes
router.get("/me", protect, getMe);

router.get("/users", protect, authorize("Admin", "Instructor"), getAllUsers);

module.exports = router;
