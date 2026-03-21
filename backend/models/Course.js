// ==============================================
// COURSE MODEL (REDESIGNED)
// Lightweight — lessons, quizzes stored separately
// ==============================================

const mongoose = require("mongoose");

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
      min: 0,
    },

    responsible: {
      type: String,
      default: "",
    },

    // Users enrolled in this course
    attendees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // Users invited but not yet enrolled
    invitedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Who created this course
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
courseSchema.index({ published: 1, visibility: 1 });
courseSchema.index({ createdBy: 1 });
courseSchema.index({ tags: 1 });

const Course = mongoose.model("Course", courseSchema);

module.exports = Course;
