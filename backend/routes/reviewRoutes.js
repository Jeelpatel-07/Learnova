// ==============================================
// REVIEW ROUTES (STANDALONE)
// These are ADDITIONAL routes if you want
// to access reviews without going through /courses
//
// Primary review routes are in courseRoutes.js:
//   GET  /api/courses/:id/reviews
//   POST /api/courses/:id/reviews
// ==============================================

const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

const protect = require("../middleware/authMiddleware");
const authorize = require("../middleware/roleMiddleware");

// ==============================================
// GET ALL REVIEWS (Admin)
// GET /api/reviews
// ==============================================
router.get("/", protect, authorize("Admin"), async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (error) {
    console.error("Get All Reviews Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
    });
  }
});

// ==============================================
// DELETE REVIEW BY ID (Admin)
// DELETE /api/reviews/:reviewId
// ==============================================
router.delete(
  "/:reviewId",
  protect,
  authorize("Admin"),
  async (req, res) => {
    try {
      const review = await Review.findById(req.params.reviewId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      await Review.findByIdAndDelete(req.params.reviewId);

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error("Delete Review Error:", error.message);
      res.status(500).json({
        success: false,
        message: "Server error while deleting review",
      });
    }
  }
);

module.exports = router;