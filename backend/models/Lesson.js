// ==============================================
// LESSON MODEL
// Each lesson belongs to a Course (referenced)
// ==============================================

const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema(
  {
    title: { type: String, default: "", trim: true },
    url: { type: String, required: true, trim: true },
    publicId: { type: String, default: "", trim: true },
    resourceType: { type: String, default: "raw", trim: true },
    originalName: { type: String, default: "", trim: true },
  },
  { _id: true }
);

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "Course reference is required"],
      index: true,
    },

    title: {
      type: String,
      required: [true, "Lesson title is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["Video", "Document", "Image"],
      required: [true, "Lesson type is required"],
    },

    order: {
      type: Number,
      default: 0,
      min: 0,
    },

    fileUrl: { type: String, default: "", trim: true },
    filePublicId: { type: String, default: "", trim: true },
    fileResourceType: { type: String, default: "", trim: true },
    fileOriginalName: { type: String, default: "", trim: true },

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
  {
    timestamps: true,
  }
);

// Compound index for fetching lessons by course in order
lessonSchema.index({ courseId: 1, order: 1 });

const Lesson = mongoose.model("Lesson", lessonSchema);

module.exports = Lesson;
