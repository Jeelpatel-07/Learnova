const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const User = require("../models/User");
const Progress = require("../models/Progress");
const Review = require("../models/Review");
const {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} = require("../utils/cloudinary");

// ---- helpers ----

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags).split(",").map((t) => t.trim()).filter(Boolean);
};

const enrichCourse = async (courseDoc) => {
  const course = courseDoc.toObject ? courseDoc.toObject() : { ...courseDoc };
  const courseId = course._id;

  // Fetch lessons & quizzes counts + duration
  const [lessons, quizzes, ratingAgg] = await Promise.all([
    Lesson.find({ courseId }).sort({ order: 1 }).lean(),
    Quiz.find({ courseId }).sort({ order: 1 }).lean(),
    Review.aggregate([
      { $match: { courseId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]),
  ]);

  const durationMinutes = lessons.reduce((sum, l) => sum + (l.duration || 0), 0);
  const rating = ratingAgg[0] || { avg: 0, count: 0 };

  return {
    ...course,
    lessons,
    quizzes,
    durationMinutes,
    averageRating: Number((rating.avg || 0).toFixed(1)),
    reviewCount: rating.count || 0,
  };
};

const canAccessCourse = (course, user) => {
  if (!course) return false;
  if (course.published) {
    if (course.visibility === "Everyone") return true;
    if (course.visibility === "SignedIn") return Boolean(user);
  }
  if (!user) return false;
  if (["Admin", "Instructor"].includes(user.role)) return true;
  const uid = user._id.toString();
  return (
    course.createdBy?.toString() === uid ||
    (course.attendees || []).some((a) => a.toString() === uid) ||
    (course.invitedUsers || []).some((i) => i.toString() === uid)
  );
};

const enrollLearnerInCourse = async (course, userId) => {
  const alreadyEnrolled = course.attendees.some((attendeeId) => attendeeId.toString() === userId.toString());
  if (!alreadyEnrolled) {
    course.attendees.push(userId);
    course.invitedUsers = course.invitedUsers.filter((invitedId) => invitedId.toString() !== userId.toString());
    await course.save();
  }

  return Progress.findOneAndUpdate(
    { userId, courseId: course._id },
    { $setOnInsert: { userId, courseId: course._id, enrolledDate: new Date() } },
    { new: true, upsert: true }
  );
};

// ---- controllers ----

const createCourse = async (req, res) => {
  try {
    const { title, description, tags, published, visibility, accessRule, price, responsible } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Course title is required" });
    }

    const course = await Course.create({
      title: title.trim(),
      description: description?.trim?.() || "",
      tags: normalizeTags(tags),
      published: Boolean(published),
      visibility: visibility || "Everyone",
      accessRule: accessRule || "Open",
      price: Number(price) || 0,
      responsible: responsible?.trim?.() || req.user.name || "",
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: await enrichCourse(course) });
  } catch (error) {
    console.error("Create Course Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while creating course" });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(courses.map(enrichCourse));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get All Courses Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching courses" });
  }
};

const getPublishedCourses = async (req, res) => {
  try {
    const filter = { published: true };
    if (req.user) {
      filter.$or = [
        { visibility: "Everyone" },
        { visibility: "SignedIn" },
        { attendees: req.user._id },
        { invitedUsers: req.user._id },
      ];
    } else {
      filter.visibility = "Everyone";
    }

    const courses = await Course.find(filter)
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(courses.map(enrichCourse));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get Published Courses Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching published courses" });
  }
};

const getMyCourses = async (req, res) => {
  try {
    // Find courses where user is an attendee
    const courses = await Course.find({ attendees: req.user._id })
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    const data = await Promise.all(courses.map(enrichCourse));
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get My Courses Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching your courses" });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role");

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    if (!canAccessCourse(course, req.user || null)) {
      return res.status(403).json({ success: false, message: "You are not allowed to access this course" });
    }

    // Increment views for non-creators
    if (course.published && (!req.user || course.createdBy?._id?.toString() !== req.user._id.toString())) {
      course.views += 1;
      await course.save();
    }

    res.status(200).json({ success: true, data: await enrichCourse(course) });
  } catch (error) {
    console.error("Get Course By ID Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching course" });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    const updates = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updates, "tags")) {
      updates.tags = normalizeTags(updates.tags);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "price")) {
      updates.price = Number(updates.price) || 0;
    }
    // Remove any embedded lesson/quiz data from updates (they have their own endpoints)
    delete updates.lessons;
    delete updates.quizzes;

    const updated = await Course.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true, runValidators: true })
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role");

    res.status(200).json({ success: true, data: await enrichCourse(updated) });
  } catch (error) {
    console.error("Update Course Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating course" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Clean up all related data
    await Promise.all([
      Lesson.deleteMany({ courseId: course._id }),
      Quiz.deleteMany({ courseId: course._id }),
      Progress.deleteMany({ courseId: course._id }),
      Review.deleteMany({ courseId: course._id }),
      Course.findByIdAndDelete(req.params.id),
    ]);

    res.status(200).json({ success: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete Course Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while deleting course" });
  }
};

const togglePublish = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    course.published = !course.published;
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.published ? "published" : "unpublished"} successfully`,
      data: await enrichCourse(course),
    });
  } catch (error) {
    console.error("Toggle Publish Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while toggling publish" });
  }
};

const enrollUser = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user._id;
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    if (!course.published && req.user.role === "Learner") {
      return res.status(403).json({ success: false, message: "This course is not published yet" });
    }

    if (course.accessRule === "Invitation" &&
      !course.invitedUsers.some((i) => i.toString() === userId.toString()) &&
      !course.attendees.some((a) => a.toString() === userId.toString()) &&
      !["Admin", "Instructor"].includes(req.user.role)
    ) {
      return res.status(403).json({ success: false, message: "This course is invitation-only" });
    }

    const alreadyEnrolled = course.attendees.some((a) => a.toString() === userId.toString());
    if (alreadyEnrolled) {
      const existingProgress = await Progress.findOne({ userId, courseId });
      return res.status(200).json({ success: true, message: "Already enrolled", data: existingProgress });
    }

    if (course.accessRule === "Paid" && req.user.role === "Learner") {
      return res.status(403).json({ success: false, message: "Payment is required before enrolling in this course" });
    }

    const progress = await enrollLearnerInCourse(course, userId);

    res.status(200).json({ success: true, message: "Successfully enrolled", data: progress });
  } catch (error) {
    console.error("Enroll User Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while enrolling" });
  }
};

const uploadCourseImage = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!req.file) return res.status(400).json({ success: false, message: "Please upload an image file" });
    if (!isCloudinaryConfigured()) return res.status(500).json({ success: false, message: "Cloudinary is not configured" });

    const uploaded = await uploadBufferToCloudinary(req.file, "learnova/course-images", "image");
    course.image = uploaded.secure_url;
    course.imagePublicId = uploaded.public_id;
    await course.save();

    res.status(200).json({ success: true, data: { image: course.image, imagePublicId: course.imagePublicId } });
  } catch (error) {
    console.error("Upload Image Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while uploading image" });
  }
};

const addAttendees = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const { userIds = [], emails = [] } = req.body;
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const emailList = Array.isArray(emails) ? emails.map((e) => String(e).trim().toLowerCase()).filter(Boolean) : [];
    const idList = Array.isArray(userIds) ? userIds.map(String).filter(Boolean) : [];

    const users = await User.find({ $or: [{ _id: { $in: idList } }, { email: { $in: emailList } }] });
    if (!users.length) return res.status(400).json({ success: false, message: "No matching users found" });

    const addedUsers = [];
    for (const user of users) {
      if (!course.invitedUsers.some((i) => i.toString() === user._id.toString())) {
        course.invitedUsers.push(user._id);
      }
      if (course.accessRule !== "Invitation") {
        if (!course.attendees.some((a) => a.toString() === user._id.toString())) {
          course.attendees.push(user._id);
        }
        await Progress.findOneAndUpdate(
          { userId: user._id, courseId: course._id },
          { $setOnInsert: { userId: user._id, courseId: course._id, enrolledDate: new Date() } },
          { upsert: true, new: true }
        );
      }
      addedUsers.push({ _id: user._id, name: user.name, email: user.email, role: user.role });
    }

    await course.save();
    const fresh = await Course.findById(course._id)
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role");

    res.status(200).json({
      success: true,
      message: `${addedUsers.length} attendee(s) added`,
      data: { addedUsers, course: await enrichCourse(fresh) },
    });
  } catch (error) {
    console.error("Add Attendees Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while adding attendees" });
  }
};

const contactAttendees = async (req, res) => {
  try {
    const { subject = "", message } = req.body;
    const course = await Course.findById(req.params.id).populate("attendees", "name email role");
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    if (!message?.trim()) return res.status(400).json({ success: false, message: "Message is required" });

    // In production, send emails here. For now, just return success.
    const recipients = course.attendees.map((a) => ({ _id: a._id, name: a.name, email: a.email }));

    res.status(200).json({
      success: true,
      message: `Message sent to ${recipients.length} attendee(s)`,
      data: { subject: subject.trim(), message: message.trim(), recipients, sentAt: new Date() },
    });
  } catch (error) {
    console.error("Contact Attendees Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while contacting attendees" });
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
  addAttendees,
  contactAttendees,
  enrollLearnerInCourse,
};
