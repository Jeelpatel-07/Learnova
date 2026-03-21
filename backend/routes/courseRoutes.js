// ==============================================
// COURSE ROUTES (UPDATED)
// Includes lesson, quiz, and review sub-routes
// ==============================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

// Course controller
const {
  createCourse,
  getAllCourses,
  getPublishedCourses,
  getMyCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  togglePublish,
  enrollUser,
  uploadCourseImage,
} = require("../controllers/courseController");

// Lesson controller
const {
  addLesson,
  updateLesson,
  deleteLesson,
} = require("../controllers/lessonController");

// Quiz controller
const {
  addQuiz,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quizController");

// Review controller
const {
  getReviewsByCourse,
  addReview,
} = require("../controllers/reviewController");

// Middleware
const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// ==============================================
// MULTER CONFIGURATION
// ==============================================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ==============================================
// COURSE ROUTES
// ==============================================

// Public
router.get("/published", getPublishedCourses);

// Protected — Learner
router.get("/my-courses", protect, getMyCourses);

// Admin only — all courses
router.get("/", protect, authorize("Admin"), getAllCourses);

// Protected — single course
router.get("/:id", protect, getCourseById);

// Admin/Instructor — CRUD
router.post("/", protect, authorize("Admin", "Instructor"), createCourse);
router.put("/:id", protect, authorize("Admin", "Instructor"), updateCourse);
router.patch(
  "/:id/toggle-publish",
  protect,
  authorize("Admin", "Instructor"),
  togglePublish
);
router.delete("/:id", protect, authorize("Admin", "Instructor"), deleteCourse);

// Enrollment
router.post("/:id/enroll", protect, enrollUser);

// Image upload
router.post(
  "/:id/upload-image",
  protect,
  authorize("Admin", "Instructor"),
  upload.single("image"),
  uploadCourseImage
);

// ==============================================
// LESSON ROUTES (inside course)
// ==============================================

// Add lesson to course
router.post(
  "/:id/lessons",
  protect,
  authorize("Admin", "Instructor"),
  addLesson
);

// Update a lesson
router.put(
  "/:id/lessons/:lessonId",
  protect,
  authorize("Admin", "Instructor"),
  updateLesson
);

// Delete a lesson
router.delete(
  "/:id/lessons/:lessonId",
  protect,
  authorize("Admin", "Instructor"),
  deleteLesson
);

// ==============================================
// QUIZ ROUTES (inside course)
// ==============================================

// Add quiz to course
router.post(
  "/:id/quizzes",
  protect,
  authorize("Admin", "Instructor"),
  addQuiz
);

// Update a quiz
router.put(
  "/:id/quizzes/:quizId",
  protect,
  authorize("Admin", "Instructor"),
  updateQuiz
);

// Delete a quiz
router.delete(
  "/:id/quizzes/:quizId",
  protect,
  authorize("Admin", "Instructor"),
  deleteQuiz
);

// ==============================================
// REVIEW ROUTES (inside course)
// ==============================================

// Get all reviews for a course (public)
router.get("/:id/reviews", getReviewsByCourse);

// Add a review (logged-in users)
router.post("/:id/reviews", protect, addReview);

module.exports = router;