// ==============================================
// COURSE MODEL
// Lessons and Quizzes are EMBEDDED inside Course
// ==============================================

const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    publicId: {
      type: String,
      default: "",
      trim: true,
    },
    resourceType: {
      type: String,
      default: "raw",
      trim: true,
    },
    originalName: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: true }
);

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: Number,
      required: true,
    },
  },
  { _id: true }
);

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [questionSchema],
    rewards: {
      firstAttempt: { type: Number, default: 100 },
      secondAttempt: { type: Number, default: 75 },
      thirdAttempt: { type: Number, default: 50 },
      fourthAndMore: { type: Number, default: 25 },
    },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Video", "Document", "Image"],
      required: true,
    },
    fileUrl: {
      type: String,
      default: "",
      trim: true,
    },
    filePublicId: {
      type: String,
      default: "",
      trim: true,
    },
    fileResourceType: {
      type: String,
      default: "",
      trim: true,
    },
    fileOriginalName: {
      type: String,
      default: "",
      trim: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    allowDownload: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    responsible: {
      type: String,
      default: "",
      trim: true,
    },
    attachments: {
      type: [attachmentSchema],
      default: [],
    },
  },
  { _id: true }
);

const attendeeMessageSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      default: "",
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    sentBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const courseSchema = new mongoose.Schema(
  {
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
    imagePublicId: {
      type: String,
      default: "",
    },

    published: {
      type: Boolean,
      default: false,
    },

    website: {
      type: String,
      default: "",
      trim: true,
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
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    attendeeMessages: {
      type: [attendeeMessageSchema],
      default: [],
    },

    views: {
      type: Number,
      default: 0,
    },

    // Who created this course
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
