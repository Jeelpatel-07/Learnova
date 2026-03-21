// ==============================================
// COURSE MODEL
// Lessons and Quizzes are EMBEDDED inside Course
// ==============================================

const mongoose = require("mongoose");

// ------ Question Sub-Schema ------
const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
  },
  options: {
    type: [String],
    required: true,
  },
  // Index of correct answer in options array
  // Example: 0 means first option is correct
  correctAnswer: {
    type: Number,
    required: true,
  },
});

// ------ Quiz Sub-Schema ------
const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  questions: [questionSchema],
  // Points based on attempt number
  rewards: {
    firstAttempt: { type: Number, default: 100 },
    secondAttempt: { type: Number, default: 75 },
    thirdAttempt: { type: Number, default: 50 },
    fourthAndMore: { type: Number, default: 25 },
  },
});

// ------ Lesson Sub-Schema ------
const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["Video", "Document", "Image"],
    required: true,
  },
  fileUrl: {
    type: String,
    default: "",
  },
  duration: {
    type: String,
    default: "",
  },
  allowDownload: {
    type: Boolean,
    default: false,
  },
  description: {
    type: String,
    default: "",
  },
  attachments: {
    type: [String],
    default: [],
  },
});

// ------ Main Course Schema ------
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Course title is required"],
    trim: true,
  },

  description: {
    type: String,
    default: "",
  },

  tags: {
    type: [String],
    default: [],
  },

  image: {
    type: String,
    default: "",
  },

  published: {
    type: Boolean,
    default: false,
  },

  visibility: {
    type: String,
    enum: ["Everyone", "SignedIn"],
    default: "Everyone",
  },

  accessRule: {
    type: String,
    enum: ["Open", "Invitation", "Paid"],
    default: "Open",
  },

  price: {
    type: Number,
    default: 0,
  },

  responsible: {
    type: String,
    default: "",
  },

  // Embedded lessons array
  lessons: [lessonSchema],

  // Embedded quizzes array
  quizzes: [quizSchema],

  // Users enrolled in this course
  attendees: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],

  views: {
    type: Number,
    default: 0,
  },

  // Who created this course
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;