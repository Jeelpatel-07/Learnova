// ==============================================
// PROGRESS MODEL (REDESIGNED)
// Tracks each learner's progress in a course
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

    // IDs of completed lessons (from Lesson collection)
    completedLessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lesson",
      },
    ],

    // IDs of completed quizzes (from Quiz collection)
    completedQuizzes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quiz",
      },
    ],

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    status: {
      type: String,
      enum: ["YetToStart", "InProgress", "Completed"],
      default: "YetToStart",
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

    timeSpent: {
      type: Number,
      default: 0,
      min: 0,
    },

    lastLessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One progress record per user per course
progressSchema.index({ userId: 1, courseId: 1 }, { unique: true });
// For reporting: filter by course + status
progressSchema.index({ courseId: 1, status: 1 });

const Progress = mongoose.model("Progress", progressSchema);

module.exports = Progress;
