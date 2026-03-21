const express = require("express");
const multer = require("multer");

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
  addAttendees,
  contactAttendees,
} = require("../controllers/courseController");
const {
  addLesson,
  updateLesson,
  deleteLesson,
  uploadLessonMedia,
} = require("../controllers/lessonController");
const {
  addQuiz,
  updateQuiz,
  deleteQuiz,
} = require("../controllers/quizController");
const {
  getReviewsByCourse,
  addReview,
} = require("../controllers/reviewController");
const protect = require("../middleware/authMiddleware");
const optionalProtect = require("../middleware/optionalAuthMiddleware");
const authorize = require("../middleware/roleMiddleware");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.get("/published", optionalProtect, getPublishedCourses);
router.get("/my-courses", protect, getMyCourses);
router.get("/", protect, authorize("Admin", "Instructor"), getAllCourses);
router.get("/:id", optionalProtect, getCourseById);

router.post("/", protect, authorize("Admin", "Instructor"), createCourse);
router.put("/:id", protect, authorize("Admin", "Instructor"), updateCourse);
router.patch(
  "/:id/toggle-publish",
  protect,
  authorize("Admin", "Instructor"),
  togglePublish
);
router.delete("/:id", protect, authorize("Admin", "Instructor"), deleteCourse);

router.post("/:id/enroll", protect, enrollUser);
router.post(
  "/:id/upload-image",
  protect,
  authorize("Admin", "Instructor"),
  upload.single("image"),
  uploadCourseImage
);
router.post(
  "/:id/media",
  protect,
  authorize("Admin", "Instructor"),
  upload.single("file"),
  uploadLessonMedia
);
router.post(
  "/:id/attendees",
  protect,
  authorize("Admin", "Instructor"),
  addAttendees
);
router.post(
  "/:id/contact-attendees",
  protect,
  authorize("Admin", "Instructor"),
  contactAttendees
);

router.post("/:id/lessons", protect, authorize("Admin", "Instructor"), addLesson);
router.put(
  "/:id/lessons/:lessonId",
  protect,
  authorize("Admin", "Instructor"),
  updateLesson
);
router.delete(
  "/:id/lessons/:lessonId",
  protect,
  authorize("Admin", "Instructor"),
  deleteLesson
);

router.post("/:id/quizzes", protect, authorize("Admin", "Instructor"), addQuiz);
router.put(
  "/:id/quizzes/:quizId",
  protect,
  authorize("Admin", "Instructor"),
  updateQuiz
);
router.delete(
  "/:id/quizzes/:quizId",
  protect,
  authorize("Admin", "Instructor"),
  deleteQuiz
);

router.get("/:id/reviews", getReviewsByCourse);
router.post("/:id/reviews", protect, addReview);

module.exports = router;
