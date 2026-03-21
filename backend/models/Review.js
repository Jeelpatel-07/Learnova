// ==============================================
// REVIEW MODEL
// Learners can rate and review courses
// One review per user per course
// ==============================================

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot be more than 5"],
    },

    comment: {
      type: String,
      default: "",
      maxlength: [1000, "Comment cannot exceed 1000 characters"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// One review per user per course
reviewSchema.index({ userId: 1, courseId: 1 }, { unique: true });
// For aggregating reviews by course
reviewSchema.index({ courseId: 1 });

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
