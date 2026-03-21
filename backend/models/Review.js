// ==============================================
// REVIEW MODEL
// Learners can rate and review courses
// One review per user per course
// ==============================================

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  // Who wrote this review
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Which course is being reviewed
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  // Rating from 1 to 5
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot be more than 5"],
  },

  // Written review text
  comment: {
    type: String,
    default: "",
    maxlength: [1000, "Comment cannot exceed 1000 characters"],
  },

  // When the review was created
  createdAt: {
    type: Date,
    default: Date.now,
  },

  // When the review was last updated
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure one review per user per course
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;