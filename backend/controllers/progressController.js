const Progress = require("../models/Progress");
const Course = require("../models/Course");
const User = require("../models/User");

const calculateProgressPercent = (course, progress) => {
  const totalLessons = course.lessons.length;
  const totalQuizzes = course.quizzes.length;
  const totalItems = totalLessons + totalQuizzes;
  const completedLessons = progress.completedContentIds.length;
  const completedQuizzes = progress.quizCompleted ? totalQuizzes : 0;

  if (!totalItems) {
    return 0;
  }

  return Math.round(((completedLessons + completedQuizzes) / totalItems) * 100);
};

const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId, courseId })
      .populate("userId", "name email role points")
      .populate("courseId", "title lessons quizzes");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "No progress found. Please enroll in this course first.",
      });
    }

    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    console.error("Get Progress Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching progress",
    });
  }
};

const completeLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, timeSpent = 0 } = req.body;
    const userId = req.user._id;

    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required in the request body",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const lessonExists = course.lessons.some(
      (lesson) => lesson._id.toString() === lessonId
    );
    if (!lessonExists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    if (!progress.completedContentIds.some((id) => id.toString() === lessonId)) {
      progress.completedContentIds.push(lessonId);
    }

    if (!progress.startDate) {
      progress.startDate = new Date();
    }

    progress.status = "InProgress";
    progress.lastLessonId = lessonId;
    progress.timeSpent += Math.max(Number(timeSpent) || 0, 0);
    progress.progressPercent = calculateProgressPercent(course, progress);

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Lesson marked as complete",
      data: progress,
    });
  } catch (error) {
    console.error("Complete Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while completing lesson",
    });
  }
};

const completeQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { score } = req.body;
    const userId = req.user._id;

    if (score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        message: "Score is required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    if (!progress.startDate) {
      progress.startDate = new Date();
    }

    progress.status = "InProgress";
    progress.quizAttempts += 1;
    progress.score = Number(score) || 0;

    const passed = progress.score >= 70;
    let pointsEarned = 0;

    if (passed && !progress.quizCompleted) {
      progress.quizCompleted = true;
      const quiz = course.quizzes[0];
      const rewards = quiz?.rewards || {
        firstAttempt: 100,
        secondAttempt: 75,
        thirdAttempt: 50,
        fourthAndMore: 25,
      };

      if (progress.quizAttempts === 1) {
        pointsEarned = rewards.firstAttempt;
      } else if (progress.quizAttempts === 2) {
        pointsEarned = rewards.secondAttempt;
      } else if (progress.quizAttempts === 3) {
        pointsEarned = rewards.thirdAttempt;
      } else {
        pointsEarned = rewards.fourthAndMore;
      }

      await User.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });
    }

    progress.progressPercent = calculateProgressPercent(course, progress);
    await progress.save();

    res.status(200).json({
      success: true,
      message: passed
        ? `Quiz passed! You earned ${pointsEarned} points.`
        : "Quiz not passed. Try again.",
      data: {
        ...progress.toObject(),
        passed,
        pointsEarned,
      },
    });
  } catch (error) {
    console.error("Complete Quiz Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while completing quiz",
    });
  }
};

const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (progress.completedContentIds.length < course.lessons.length) {
      return res.status(400).json({
        success: false,
        message: `Please complete all lessons first. ${progress.completedContentIds.length}/${course.lessons.length} done.`,
      });
    }

    if (course.quizzes.length > 0 && !progress.quizCompleted) {
      return res.status(400).json({
        success: false,
        message: "Please pass the quiz first before completing the course.",
      });
    }

    progress.status = "Completed";
    progress.progressPercent = 100;
    progress.completedDate = new Date();
    await progress.save();

    res.status(200).json({
      success: true,
      message: "Congratulations! Course completed successfully!",
      data: progress,
    });
  } catch (error) {
    console.error("Complete Course Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while completing course",
    });
  }
};

module.exports = {
  getProgress,
  completeLesson,
  completeQuiz,
  completeCourse,
};
