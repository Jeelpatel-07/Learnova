// ==============================================
// PROGRESS ROUTES (UPDATED)
// ==============================================

const express = require("express");
const router = express.Router();

const {
  getProgress,
  completeLesson,
  completeQuiz,
  completeCourse,
} = require("../controllers/progressController");

const protect = require("../middleware/authMiddleware");

// All progress routes require authentication

// Get progress for a specific course
router.get("/:courseId", protect, getProgress);

// Mark a lesson as complete
router.post("/:courseId/complete-lesson", protect, completeLesson);

// Submit quiz completion
router.post("/:courseId/complete-quiz", protect, completeQuiz);

// Mark entire course as completed
router.post("/:courseId/complete-course", protect, completeCourse);

module.exports = router;