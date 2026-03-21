// ==============================================
// COURSE CONTROLLER
// Handles all course CRUD operations,
// enrollment, and image upload
// ==============================================

const Course = require("../models/Course");
const User = require("../models/User");
const Progress = require("../models/Progress");

// ==============================================
// CREATE COURSE
// POST /api/courses
// Admin or Instructor only
// ==============================================
const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      tags,
      published,
      visibility,
      accessRule,
      price,
      responsible,
      lessons,
      quizzes,
    } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Course title is required",
      });
    }

    const course = await Course.create({
      title,
      description,
      tags,
      published,
      visibility,
      accessRule,
      price,
      responsible,
      lessons: lessons || [],
      quizzes: quizzes || [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Create Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while creating course",
    });
  }
};

// ==============================================
// GET ALL COURSES (Admin)
// GET /api/courses
// Returns all courses including unpublished
// ==============================================
const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get All Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
  }
};

// ==============================================
// GET PUBLISHED COURSES
// GET /api/courses/published
// Public route — no auth needed
// ==============================================
const getPublishedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ published: true })
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get Published Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching published courses",
    });
  }
};

// ==============================================
// GET MY COURSES
// GET /api/courses/my-courses
// Returns courses the logged-in user is enrolled in
// ==============================================
const getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "enrolledCourses",
      populate: {
        path: "createdBy",
        select: "name email",
      },
    });

    res.status(200).json({
      success: true,
      count: user.enrolledCourses.length,
      data: user.enrolledCourses,
    });
  } catch (error) {
    console.error("Get My Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your courses",
    });
  }
};

// ==============================================
// GET COURSE BY ID
// GET /api/courses/:id
// Increments view count
// ==============================================
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("attendees", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Increment view count
    course.views += 1;
    await course.save();

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Get Course By ID Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course",
    });
  }
};

// ==============================================
// UPDATE COURSE
// PUT /api/courses/:id
// ==============================================
const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Update Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating course",
    });
  }
};

// ==============================================
// DELETE COURSE
// DELETE /api/courses/:id
// Also removes from users' enrolledCourses
// and deletes related progress records
// ==============================================
const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Remove course from all users' enrolledCourses
    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    // Delete all progress records for this course
    await Progress.deleteMany({ courseId: course._id });

    // Delete the course
    await Course.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while deleting course",
    });
  }
};

// ==============================================
// TOGGLE PUBLISH
// PATCH /api/courses/:id/toggle-publish
// Switches published true ↔ false
// ==============================================
const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    course.published = !course.published;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.published ? "published" : "unpublished"} successfully`,
      data: course,
    });
  } catch (error) {
    console.error("Toggle Publish Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while toggling publish",
    });
  }
};

// ==============================================
// ENROLL USER
// POST /api/courses/:id/enroll
// Adds course to user + user to course
// Creates a progress record
// ==============================================
const enrollUser = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = course.attendees.some(
      (attendee) => attendee.toString() === userId.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    // Add user to course attendees
    course.attendees.push(userId);
    await course.save();

    // Add course to user's enrolledCourses
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId },
    });

    // Create initial progress record
    await Progress.create({
      userId: userId,
      courseId: courseId,
    });

    res.status(200).json({
      success: true,
      message: "Successfully enrolled in the course",
      data: course,
    });
  } catch (error) {
    console.error("Enroll User Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while enrolling",
    });
  }
};

// ==============================================
// UPLOAD COURSE IMAGE
// POST /api/courses/:id/upload-image
// Saves uploaded file path to course.image
// ==============================================
const uploadCourseImage = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Save file path
    course.image = `uploads/${req.file.filename}`;
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course image uploaded successfully",
      data: {
        image: course.image,
      },
    });
  } catch (error) {
    console.error("Upload Image Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while uploading image",
    });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getPublishedCourses,
  getMyCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  togglePublish,
  enrollUser,
  uploadCourseImage,
};