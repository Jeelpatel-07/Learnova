const express = require("express");
const protect = require("../middleware/authMiddleware");
const { createCourseOrder, verifyCoursePayment } = require("../controllers/paymentController");

const router = express.Router();

router.post("/courses/:courseId/order", protect, createCourseOrder);
router.post("/courses/:courseId/verify", protect, verifyCoursePayment);

module.exports = router;
