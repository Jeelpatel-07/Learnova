const Course = require("../models/Course");
const {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} = require("../utils/cloudinary");

const VALID_TYPES = ["Video", "Document", "Image"];

const normalizeAttachment = (attachment) => {
  if (typeof attachment === "string") {
    return { title: "", url: attachment.trim() };
  }

  return {
    title: attachment?.title?.trim?.() || "",
    url: attachment?.url?.trim?.() || "",
    publicId: attachment?.publicId?.trim?.() || "",
    resourceType: attachment?.resourceType?.trim?.() || "raw",
    originalName: attachment?.originalName?.trim?.() || "",
  };
};

const buildLesson = (payload) => ({
  title: payload.title?.trim?.() || "",
  type: payload.type,
  fileUrl: payload.fileUrl?.trim?.() || "",
  filePublicId: payload.filePublicId?.trim?.() || "",
  fileResourceType: payload.fileResourceType?.trim?.() || "",
  fileOriginalName: payload.fileOriginalName?.trim?.() || "",
  duration: Number(payload.duration) || 0,
  allowDownload: Boolean(payload.allowDownload),
  description: payload.description?.trim?.() || "",
  responsible: payload.responsible?.trim?.() || "",
  attachments: Array.isArray(payload.attachments)
    ? payload.attachments.map(normalizeAttachment).filter((attachment) => attachment.url)
    : [],
});

const validateLesson = (lesson) => {
  if (!lesson.title) {
    return "Lesson title is required";
  }
  if (!lesson.type || !VALID_TYPES.includes(lesson.type)) {
    return "Lesson type must be Video, Document, or Image";
  }
  return null;
};

const addLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = buildLesson(req.body);
    const validationError = validateLesson(lesson);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course.lessons.push(lesson);
    await course.save();

    res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      data: course.lessons[course.lessons.length - 1],
    });
  } catch (error) {
    console.error("Add Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while adding lesson",
    });
  }
};

const updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    const nextLesson = buildLesson({
      ...lesson.toObject(),
      ...req.body,
      attachments:
        req.body.attachments === undefined ? lesson.attachments : req.body.attachments,
    });

    const validationError = validateLesson(nextLesson);
    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    Object.assign(lesson, nextLesson);
    await course.save();

    res.status(200).json({
      success: true,
      message: "Lesson updated successfully",
      data: lesson,
    });
  } catch (error) {
    console.error("Update Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating lesson",
    });
  }
};

const deleteLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    course.lessons.pull({ _id: lessonId });
    await course.save();

    res.status(200).json({
      success: true,
      message: "Lesson deleted successfully",
    });
  } catch (error) {
    console.error("Delete Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while deleting lesson",
    });
  }
};

const uploadLessonMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file",
      });
    }

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured on the backend",
      });
    }

    const resourceType = req.body.resourceType || "auto";
    const uploaded = await uploadBufferToCloudinary(
      req.file,
      "learnova/course-assets",
      resourceType
    );

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        url: uploaded.secure_url,
        publicId: uploaded.public_id,
        resourceType: uploaded.resource_type,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    console.error("Upload Lesson Media Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while uploading lesson media",
    });
  }
};

module.exports = {
  addLesson,
  updateLesson,
  deleteLesson,
  uploadLessonMedia,
};
