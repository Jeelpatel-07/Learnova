// ==============================================
// REVIEW CONTROLLER (REWRITTEN)
// Handles course reviews with userName stored
// ==============================================

const Review = require("../models/Review");
const Course = require("../models/Course");

// ==============================================
// GET REVIEWS BY COURSE
// GET /api/courses/:id/reviews
// Public — anyone can see reviews
// ==============================================
const getReviewsByCourse = async (req, res) => {
  try {
    const courseId = req.params.id;

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Get all reviews for this course
    const reviews = await Review.find({ courseId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Calculate average rating
    let averageRating = 0;
    if (reviews.length > 0) {
      const totalRating = reviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      averageRating = Number((totalRating / reviews.length).toFixed(1));
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      averageRating,
      data: reviews,
    });
  } catch (error) {
    console.error("Get Reviews Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching reviews",
    });
  }
};

// ==============================================
// ADD REVIEW
// POST /api/courses/:id/reviews
// Body: { "rating": 5, "comment": "Great!" }
//
// Logged-in users only
// One review per user per course
// ==============================================
const addReview = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { rating, comment } = req.body;
    const userId = req.user._id;
    const userName = req.user.name;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating is required and must be between 1 and 5",
      });
    }

    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const review = await Review.findOneAndUpdate(
      { userId, courseId },
      {
        userId,
        courseId,
        rating,
        comment: comment || "",
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    res.status(201).json({
      success: true,
      message: "Review saved successfully",
      data: review,
    });
  } catch (error) {
    console.error("Add Review Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while adding review",
    });
  }
};

module.exports = {
  getReviewsByCourse,
  addReview,
};
