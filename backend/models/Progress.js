// ==============================================
// PROGRESS MODEL (UPDATED)
// Tracks each learner's progress in a course
// Matches the exact fields requested
// ==============================================

const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  // Which user this progress belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Which course this progress is for
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },

  // Array of lesson/content IDs that have been completed
  // Stores the _id of each lesson from Course.lessons
  completedContentIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
    },
  ],

  // Whether the quiz for this course is completed
  quizCompleted: {
    type: Boolean,
    default: false,
  },

  // How many times the user attempted the quiz
  quizAttempts: {
    type: Number,
    default: 0,
  },

  // Quiz score as percentage (0-100)
  score: {
    type: Number,
    default: 0,
  },

  // Overall progress percentage (0-100)
  // Calculated from: completed lessons + quiz completion
  progressPercent: {
    type: Number,
    default: 0,
  },

  // When the user started this course
  startDate: {
    type: Date,
    default: null,
  },

  // When the user completed this course
  completedDate: {
    type: Date,
    default: null,
  },

  // Current status of the user in this course
  status: {
    type: String,
    enum: ["YetToStart", "InProgress", "Completed"],
    default: "YetToStart",
  },

  // Total time spent on this course (in minutes)
  timeSpent: {
    type: Number,
    default: 0,
  },
});

// Ensure one progress record per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;