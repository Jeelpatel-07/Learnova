// ==============================================
// QUIZ MODEL
// Each quiz belongs to a Course (referenced)
// Questions and rewards are embedded in the quiz
// ==============================================

const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, "Question text is required"],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: (v) => v.length >= 2,
        message: "A question must have at least 2 options",
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, "Correct answer index is required"],
      min: 0,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Quiz title is required"],
      trim: true,
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    rewards: {
      firstAttempt: { type: Number, default: 100 },
      secondAttempt: { type: Number, default: 75 },
      thirdAttempt: { type: Number, default: 50 },
      fourthAndMore: { type: Number, default: 25 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fetching quizzes by course
quizSchema.index({ courseId: 1, order: 1 });

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
