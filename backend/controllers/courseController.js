const Course = require("../models/Course");
const User = require("../models/User");
const Progress = require("../models/Progress");
const Review = require("../models/Review");
const {
  isCloudinaryConfigured,
  uploadBufferToCloudinary,
} = require("../utils/cloudinary");

const normalizeTags = (tags) => {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const normalizeLessonPayload = (lesson = {}) => {
  const attachments = Array.isArray(lesson.attachments)
    ? lesson.attachments
        .map((attachment) => {
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
        })
        .filter((attachment) => attachment.url)
    : [];

  return {
    title: lesson.title?.trim?.() || "",
    type: lesson.type,
    fileUrl: lesson.fileUrl?.trim?.() || "",
    filePublicId: lesson.filePublicId?.trim?.() || "",
    fileResourceType: lesson.fileResourceType?.trim?.() || "",
    fileOriginalName: lesson.fileOriginalName?.trim?.() || "",
    duration: Number(lesson.duration) || 0,
    allowDownload: Boolean(lesson.allowDownload),
    description: lesson.description?.trim?.() || "",
    responsible: lesson.responsible?.trim?.() || "",
    attachments,
  };
};

const summarizeCourse = (courseDoc, ratingSummary = {}) => {
  const course = courseDoc.toObject ? courseDoc.toObject() : courseDoc;
  const durationMinutes = (course.lessons || []).reduce(
    (total, lesson) => total + (Number(lesson.duration) || 0),
    0
  );

  return {
    ...course,
    durationMinutes,
    reviewCount: ratingSummary.reviewCount || 0,
    averageRating: ratingSummary.averageRating || 0,
  };
};

const getRatingsMap = async (courseIds) => {
  const rows = await Review.aggregate([
    { $match: { courseId: { $in: courseIds } } },
    {
      $group: {
        _id: "$courseId",
        averageRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 },
      },
    },
  ]);

  return rows.reduce((map, row) => {
    map[row._id.toString()] = {
      averageRating: Number((row.averageRating || 0).toFixed(1)),
      reviewCount: row.reviewCount || 0,
    };
    return map;
  }, {});
};

const canAccessCourse = (course, user) => {
  if (!course) return false;
  if (course.published) {
    if (course.visibility === "Everyone") return true;
    if (course.visibility === "SignedIn") return Boolean(user);
  }

  if (!user) return false;

  if (["Admin", "Instructor"].includes(user.role)) return true;

  return (
    course.createdBy?.toString() === user._id.toString() ||
    course.attendees.some((attendee) => attendee.toString() === user._id.toString()) ||
    course.invitedUsers.some((invitedUser) => invitedUser.toString() === user._id.toString())
  );
};

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

    if (!title?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Course title is required",
      });
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
      lessons: Array.isArray(lessons) ? lessons.map(normalizeLessonPayload) : [],
      quizzes: Array.isArray(quizzes) ? quizzes : [],
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: summarizeCourse(course),
    });
  } catch (error) {
    console.error("Create Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while creating course",
    });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role")
      .sort({ createdAt: -1 });

    const ratingsMap = await getRatingsMap(courses.map((course) => course._id));
    const data = courses.map((course) =>
      summarizeCourse(course, ratingsMap[course._id.toString()])
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get All Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching courses",
    });
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
      .sort({ createdAt: -1 });

    const ratingsMap = await getRatingsMap(courses.map((course) => course._id));
    const data = courses.map((course) =>
      summarizeCourse(course, ratingsMap[course._id.toString()])
    );

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get Published Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching published courses",
    });
  }
};

const getMyCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "enrolledCourses",
      populate: [
        { path: "createdBy", select: "name email role" },
        { path: "attendees", select: "name email role" },
      ],
    });

    const courseIds = (user?.enrolledCourses || []).map((course) => course._id);
    const ratingsMap = await getRatingsMap(courseIds);

    res.status(200).json({
      success: true,
      count: user?.enrolledCourses?.length || 0,
      data: (user?.enrolledCourses || []).map((course) =>
        summarizeCourse(course, ratingsMap[course._id.toString()])
      ),
    });
  } catch (error) {
    console.error("Get My Courses Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching your courses",
    });
  }
};

const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role")
      .populate("attendeeMessages.sentBy", "name email")
      .populate("attendeeMessages.recipients", "name email");

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!canAccessCourse(course, req.user || null)) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this course",
      });
    }

    if (
      course.published &&
      (!req.user || course.createdBy?._id?.toString() !== req.user._id.toString())
    ) {
      course.views += 1;
      await course.save();
    }

    const ratingsMap = await getRatingsMap([course._id]);

    res.status(200).json({
      success: true,
      data: summarizeCourse(course, ratingsMap[course._id.toString()]),
    });
  } catch (error) {
    console.error("Get Course By ID Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching course",
    });
  }
};

const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const updates = { ...req.body };
    if (Object.prototype.hasOwnProperty.call(updates, "tags")) {
      updates.tags = normalizeTags(updates.tags);
    }
    if (Object.prototype.hasOwnProperty.call(updates, "price")) {
      updates.price = Number(updates.price) || 0;
    }
    if (Object.prototype.hasOwnProperty.call(updates, "lessons")) {
      updates.lessons = Array.isArray(updates.lessons)
        ? updates.lessons.map(normalizeLessonPayload)
        : [];
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate("createdBy", "name email role")
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role");

    const ratingsMap = await getRatingsMap([updatedCourse._id]);

    res.status(200).json({
      success: true,
      data: summarizeCourse(updatedCourse, ratingsMap[updatedCourse._id.toString()]),
    });
  } catch (error) {
    console.error("Update Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating course",
    });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    await User.updateMany(
      { enrolledCourses: course._id },
      { $pull: { enrolledCourses: course._id } }
    );

    await Progress.deleteMany({ courseId: course._id });
    await Review.deleteMany({ courseId: course._id });
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

    const ratingsMap = await getRatingsMap([course._id]);

    res.status(200).json({
      success: true,
      message: `Course ${course.published ? "published" : "unpublished"} successfully`,
      data: summarizeCourse(course, ratingsMap[course._id.toString()]),
    });
  } catch (error) {
    console.error("Toggle Publish Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while toggling publish",
    });
  }
};

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

    if (!course.published && req.user.role === "Learner") {
      return res.status(403).json({
        success: false,
        message: "This course is not published yet",
      });
    }

    if (course.visibility === "SignedIn" && !req.user) {
      return res.status(403).json({
        success: false,
        message: "Please sign in to access this course",
      });
    }

    if (
      course.accessRule === "Invitation" &&
      !course.invitedUsers.some((invitedUser) => invitedUser.toString() === userId.toString()) &&
      !course.attendees.some((attendee) => attendee.toString() === userId.toString()) &&
      !["Admin", "Instructor"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "This course is invitation-only",
      });
    }

    const alreadyEnrolled = course.attendees.some(
      (attendee) => attendee.toString() === userId.toString()
    );

    if (alreadyEnrolled) {
      const existingProgress = await Progress.findOne({ userId, courseId });
      return res.status(200).json({
        success: true,
        message: "You are already enrolled in this course",
        data: existingProgress,
      });
    }

    course.attendees.push(userId);
    course.invitedUsers = course.invitedUsers.filter(
      (invitedUser) => invitedUser.toString() !== userId.toString()
    );
    await course.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId },
    });

    const progress = await Progress.findOneAndUpdate(
      { userId, courseId },
      {
        $setOnInsert: {
          userId,
          courseId,
          enrolledDate: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.status(200).json({
      success: true,
      message:
        course.accessRule === "Paid"
          ? "Course access granted. Payment flow can now be connected on top of this enrollment."
          : "Successfully enrolled in the course",
      data: progress,
    });
  } catch (error) {
    console.error("Enroll User Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while enrolling",
    });
  }
};

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

    if (!isCloudinaryConfigured()) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary is not configured on the backend",
      });
    }

    const uploaded = await uploadBufferToCloudinary(
      req.file,
      "learnova/course-images",
      "image"
    );

    course.image = uploaded.secure_url;
    course.imagePublicId = uploaded.public_id;
    await course.save();

    res.status(200).json({
      success: true,
      message: "Course image uploaded successfully",
      data: {
        image: course.image,
        imagePublicId: course.imagePublicId,
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

const addAttendees = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const { userIds = [], emails = [] } = req.body;

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const emailList = Array.isArray(emails)
      ? emails.map((email) => String(email).trim().toLowerCase()).filter(Boolean)
      : [];
    const idList = Array.isArray(userIds)
      ? userIds.map((userId) => String(userId)).filter(Boolean)
      : [];

    const users = await User.find({
      $or: [{ _id: { $in: idList } }, { email: { $in: emailList } }],
    });

    if (!users.length) {
      return res.status(400).json({
        success: false,
        message: "No matching users found to add as attendees",
      });
    }

    const addedUsers = [];
    for (const user of users) {
      if (!course.invitedUsers.some((invited) => invited.toString() === user._id.toString())) {
        course.invitedUsers.push(user._id);
      }

      if (course.accessRule !== "Invitation") {
        if (!course.attendees.some((attendee) => attendee.toString() === user._id.toString())) {
          course.attendees.push(user._id);
        }

        await User.findByIdAndUpdate(user._id, {
          $addToSet: { enrolledCourses: course._id },
        });

        await Progress.findOneAndUpdate(
          { userId: user._id, courseId: course._id },
          {
            $setOnInsert: {
              userId: user._id,
              courseId: course._id,
              enrolledDate: new Date(),
            },
          },
          { upsert: true, new: true }
        );
      }

      addedUsers.push({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    }

    await course.save();

    const freshCourse = await Course.findById(course._id)
      .populate("attendees", "name email role")
      .populate("invitedUsers", "name email role");

    const ratingsMap = await getRatingsMap([freshCourse._id]);

    res.status(200).json({
      success: true,
      message: `${addedUsers.length} attendee(s) added successfully`,
      data: {
        addedUsers,
        course: summarizeCourse(
          freshCourse,
          ratingsMap[freshCourse._id.toString()]
        ),
      },
    });
  } catch (error) {
    console.error("Add Attendees Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while adding attendees",
    });
  }
};

const contactAttendees = async (req, res) => {
  try {
    const { subject = "", message } = req.body;
    const course = await Course.findById(req.params.id).populate(
      "attendees",
      "name email role"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    const recipients = course.attendees.map((attendee) => attendee._id);
    course.attendeeMessages.push({
      subject: subject.trim(),
      message: message.trim(),
      sentBy: req.user._id,
      recipients,
    });
    await course.save();

    res.status(200).json({
      success: true,
      message: `Message saved for ${recipients.length} attendee(s)`,
      data: course.attendeeMessages[course.attendeeMessages.length - 1],
    });
  } catch (error) {
    console.error("Contact Attendees Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while contacting attendees",
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
  addAttendees,
  contactAttendees,
};
