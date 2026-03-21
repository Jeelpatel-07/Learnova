// ==============================================
// LESSON CONTROLLER
// Manages lessons INSIDE the Course document
// Uses MongoDB $push, $pull, and positional $
// ==============================================

const Course = require("../models/Course");

// ==============================================
// ADD LESSON
// POST /api/courses/:id/lessons
//
// Body example:
// {
//   "title": "Introduction to JavaScript",
//   "type": "Video",
//   "fileUrl": "https://example.com/video.mp4",
//   "duration": "15 mins",
//   "allowDownload": true,
//   "description": "Welcome to the course",
//   "attachments": ["file1.pdf", "file2.pdf"]
// }
// ==============================================
const addLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, fileUrl, duration, allowDownload, description, attachments } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: "Lesson title and type are required",
      });
    }

    // Validate lesson type
    const validTypes = ["Video", "Document", "Image"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Lesson type must be Video, Document, or Image",
      });
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Build the lesson object
    const newLesson = {
      title,
      type,
      fileUrl: fileUrl || "",
      duration: duration || "",
      allowDownload: allowDownload || false,
      description: description || "",
      attachments: attachments || [],
    };

    // Use $push to add lesson to the lessons array
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $push: { lessons: newLesson } },
      { new: true, runValidators: true }
    );

    // Get the newly added lesson (last item in array)
    const addedLesson = updatedCourse.lessons[updatedCourse.lessons.length - 1];

    res.status(201).json({
      success: true,
      message: "Lesson added successfully",
      data: addedLesson,
    });
  } catch (error) {
    console.error("Add Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while adding lesson",
    });
  }
};

// ==============================================
// UPDATE LESSON
// PUT /api/courses/:id/lessons/:lessonId
//
// Updates specific fields of a lesson
// ==============================================
const updateLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;
    const { title, type, fileUrl, duration, allowDownload, description, attachments } = req.body;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find the lesson inside the course
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    // Update only the fields that are provided
    if (title !== undefined) lesson.title = title;
    if (type !== undefined) {
      const validTypes = ["Video", "Document", "Image"];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Lesson type must be Video, Document, or Image",
        });
      }
      lesson.type = type;
    }
    if (fileUrl !== undefined) lesson.fileUrl = fileUrl;
    if (duration !== undefined) lesson.duration = duration;
    if (allowDownload !== undefined) lesson.allowDownload = allowDownload;
    if (description !== undefined) lesson.description = description;
    if (attachments !== undefined) lesson.attachments = attachments;

    // Save the course (which saves the embedded lesson)
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

// ==============================================
// DELETE LESSON
// DELETE /api/courses/:id/lessons/:lessonId
//
// Uses $pull to remove lesson from array
// ==============================================
const deleteLesson = async (req, res) => {
  try {
    const { id, lessonId } = req.params;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if lesson exists
    const lesson = course.lessons.id(lessonId);
    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    // Use $pull to remove the lesson from the array
    await Course.findByIdAndUpdate(id, {
      $pull: { lessons: { _id: lessonId } },
    });

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

module.exports = {
  addLesson,
  updateLesson,
  deleteLesson,
};