// ==============================================
// PROGRESS MODEL (UPDATED)
// Tracks each learner's progress in a course
// Matches the exact fields requested
// ==============================================

const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema(
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
    completedContentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
      },
    ],
    quizCompleted: {
      type: Boolean,
      default: false,
    },
    quizAttempts: {
      type: Number,
      default: 0,
    },
    score: {
      type: Number,
      default: 0,
    },
    progressPercent: {
      type: Number,
      default: 0,
    },
    enrolledDate: {
      type: Date,
      default: Date.now,
    },
    startDate: {
      type: Date,
      default: null,
    },
    completedDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["YetToStart", "InProgress", "Completed"],
      default: "YetToStart",
    },
    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one progress record per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;
