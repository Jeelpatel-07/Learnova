// ==============================================
// PROGRESS CONTROLLER (COMPLETELY REWRITTEN)
// Tracks lesson completion, quiz completion,
// and overall course progress
// ==============================================

const Progress = require("../models/Progress");
const Course = require("../models/Course");
const User = require("../models/User");

// ==============================================
// GET PROGRESS
// GET /api/progress/:courseId
// Returns progress of logged-in user for a course
// ==============================================
const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Find progress record
    let progress = await Progress.findOne({ userId, courseId })
      .populate("userId", "name email")
      .populate("courseId", "title lessons quizzes");

    // If no progress exists, the user hasn't enrolled
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

// ==============================================
// COMPLETE LESSON
// POST /api/progress/:courseId/complete-lesson
// Body: { "lessonId": "abc123" }
//
// Adds lessonId to completedContentIds
// Recalculates progressPercent
// Updates status to InProgress
// ==============================================
const completeLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId } = req.body;
    const userId = req.user._id;

    // Validate lessonId
    if (!lessonId) {
      return res.status(400).json({
        success: false,
        message: "lessonId is required in the request body",
      });
    }

    // Find the course to validate lesson exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if lesson exists in the course
    const lessonExists = course.lessons.some(
      (lesson) => lesson._id.toString() === lessonId
    );

    if (!lessonExists) {
      return res.status(404).json({
        success: false,
        message: "Lesson not found in this course",
      });
    }

    // Find progress record
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    // Check if lesson is already completed
    const alreadyCompleted = progress.completedContentIds.some(
      (id) => id.toString() === lessonId
    );

    if (alreadyCompleted) {
      return res.status(400).json({
        success: false,
        message: "This lesson is already marked as complete",
      });
    }

    // Add lesson to completedContentIds
    progress.completedContentIds.push(lessonId);

    // Set start date if this is the first activity
    if (!progress.startDate) {
      progress.startDate = new Date();
    }

    // Update status to InProgress
    if (progress.status === "YetToStart") {
      progress.status = "InProgress";
    }

    // -------------------------------------------
    // RECALCULATE PROGRESS PERCENTAGE
    // Formula: (completed items / total items) * 100
    //
    // Total items = number of lessons + number of quizzes
    // Completed items = completed lessons + (1 if quiz completed)
    // -------------------------------------------
    const totalLessons = course.lessons.length;
    const totalQuizzes = course.quizzes.length;
    const totalItems = totalLessons + totalQuizzes;

    const completedLessons = progress.completedContentIds.length;
    const completedQuizzes = progress.quizCompleted ? totalQuizzes : 0;
    const completedItems = completedLessons + completedQuizzes;

    if (totalItems > 0) {
      progress.progressPercent = Math.round((completedItems / totalItems) * 100);
    } else {
      progress.progressPercent = 0;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: "Lesson marked as complete",
      data: {
        completedContentIds: progress.completedContentIds,
        progressPercent: progress.progressPercent,
        status: progress.status,
      },
    });
  } catch (error) {
    console.error("Complete Lesson Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while completing lesson",
    });
  }
};

// ==============================================
// COMPLETE QUIZ
// POST /api/progress/:courseId/complete-quiz
// Body: { "score": 85, "answers": [0, 2, 1, 3] }
//
// Stores quiz attempts and score
// Awards points based on attempt number
// Recalculates progressPercent
// ==============================================
const completeQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { score, answers } = req.body;
    const userId = req.user._id;

    // Validate score
    if (score === undefined || score === null) {
      return res.status(400).json({
        success: false,
        message: "Score is required",
      });
    }

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find progress record
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    // Set start date if this is the first activity
    if (!progress.startDate) {
      progress.startDate = new Date();
    }

    // Update status to InProgress
    if (progress.status === "YetToStart") {
      progress.status = "InProgress";
    }

    // Increment quiz attempts
    progress.quizAttempts += 1;

    // Store the score (latest score)
    progress.score = score;

    // Mark quiz as completed if score >= 70%
    const passed = score >= 70;

    // -------------------------------------------
    // AWARD POINTS based on attempt number
    // Only award if quiz is passed AND not previously passed
    // -------------------------------------------
    let pointsEarned = 0;

    if (passed && !progress.quizCompleted) {
      // First time passing — award points based on attempt number
      progress.quizCompleted = true;

      // Get rewards from the first quiz (or use defaults)
      const quiz = course.quizzes.length > 0 ? course.quizzes[0] : null;
      const rewards = quiz
        ? quiz.rewards
        : {
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

      // Add points to user's total
      await User.findByIdAndUpdate(userId, {
        $inc: { points: pointsEarned },
      });
    }

    // -------------------------------------------
    // RECALCULATE PROGRESS PERCENTAGE
    // -------------------------------------------
    const totalLessons = course.lessons.length;
    const totalQuizzes = course.quizzes.length;
    const totalItems = totalLessons + totalQuizzes;

    const completedLessons = progress.completedContentIds.length;
    const completedQuizzes = progress.quizCompleted ? totalQuizzes : 0;
    const completedItems = completedLessons + completedQuizzes;

    if (totalItems > 0) {
      progress.progressPercent = Math.round((completedItems / totalItems) * 100);
    } else {
      progress.progressPercent = 0;
    }

    await progress.save();

    res.status(200).json({
      success: true,
      message: passed
        ? `Quiz passed! 🎉 You earned ${pointsEarned} points!`
        : "Quiz not passed. Try again!",
      data: {
        score: progress.score,
        passed,
        quizAttempts: progress.quizAttempts,
        quizCompleted: progress.quizCompleted,
        pointsEarned,
        progressPercent: progress.progressPercent,
        status: progress.status,
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

// ==============================================
// COMPLETE COURSE
// POST /api/progress/:courseId/complete-course
//
// Marks the course as Completed
// Sets completedDate
// ==============================================
const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    // Find progress record
    let progress = await Progress.findOne({ userId, courseId });

    if (!progress) {
      return res.status(400).json({
        success: false,
        message: "You must enroll in this course first",
      });
    }

    // Check if already completed
    if (progress.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This course is already marked as completed",
      });
    }

    // Find the course to verify all content is done
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if all lessons are completed
    const totalLessons = course.lessons.length;
    const completedLessons = progress.completedContentIds.length;

    if (totalLessons > 0 && completedLessons < totalLessons) {
      return res.status(400).json({
        success: false,
        message: `Please complete all lessons first. ${completedLessons}/${totalLessons} done.`,
      });
    }

    // Check if quiz is completed (if there are quizzes)
    if (course.quizzes.length > 0 && !progress.quizCompleted) {
      return res.status(400).json({
        success: false,
        message: "Please pass the quiz first before completing the course.",
      });
    }

    // Mark as completed
    progress.status = "Completed";
    progress.progressPercent = 100;
    progress.completedDate = new Date();

    await progress.save();

    res.status(200).json({
      success: true,
      message: "🎉 Congratulations! Course completed successfully!",
      data: {
        status: progress.status,
        progressPercent: progress.progressPercent,
        completedDate: progress.completedDate,
      },
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