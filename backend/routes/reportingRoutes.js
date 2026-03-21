const express = require("express");
const router = express.Router();

const {
  getReport,
  getReportByCourse,
} = require("../controllers/reportingController");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// GET /api/reporting
router.get("/", protect, authorize("Admin"), getReport);

// GET /api/reporting/course/:courseId
router.get("/course/:courseId", protect, authorize("Admin"), getReportByCourse);

module.exports = router;