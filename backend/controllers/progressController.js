// ==============================================
// PROGRESS CONTROLLER (REDESIGNED)
// Uses separate Lesson/Quiz/QuizAttempt collections
// ==============================================

const Progress = require("../models/Progress");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Quiz = require("../models/Quiz");
const QuizAttempt = require("../models/QuizAttempt");
const User = require("../models/User");

const calculateProgressPercent = async (courseId, progress) => {
  const [lessonCount, quizCount] = await Promise.all([
    Lesson.countDocuments({ courseId }),
    Quiz.countDocuments({ courseId }),
  ]);

  const totalItems = lessonCount + quizCount;
  if (!totalItems) return 0;

  const completedItems = (progress.completedLessons?.length || 0) + (progress.completedQuizzes?.length || 0);
  return Math.round((completedItems / totalItems) * 100);
};

const getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId, courseId })
      .populate("userId", "name email role points")
      .populate("courseId", "title");

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: "No progress found. Please enroll in this course first.",
      });
    }

    // Fetch quiz attempts for this user+course
    const quizAttempts = await QuizAttempt.find({ userId, courseId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...progress.toObject(),
        quizAttempts,
      },
    });
  } catch (error) {
    console.error("Get Progress Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while fetching progress" });
  }
};

const completeLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonId, timeSpent = 0 } = req.body;
    const userId = req.user._id;

    if (!lessonId) {
      return res.status(400).json({ success: false, message: "lessonId is required" });
    }

    // Verify lesson exists in this course
    const lesson = await Lesson.findOne({ _id: lessonId, courseId });
    if (!lesson) {
      return res.status(404).json({ success: false, message: "Lesson not found in this course" });
    }

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({ success: false, message: "You must enroll in this course first" });
    }

    // Add lesson to completedLessons if not already there
    if (!progress.completedLessons.some((id) => id.toString() === lessonId)) {
      progress.completedLessons.push(lessonId);
    }

    if (!progress.startDate) progress.startDate = new Date();
    progress.status = "InProgress";
    progress.lastLessonId = lessonId;
    progress.timeSpent += Math.max(Number(timeSpent) || 0, 0);
    progress.progressPercent = await calculateProgressPercent(courseId, progress);

    await progress.save();

    res.status(200).json({ success: true, message: "Lesson marked as complete", data: progress });
  } catch (error) {
    console.error("Complete Lesson Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while completing lesson" });
  }
};

const completeQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { quizId, score, answers = [] } = req.body;
    const userId = req.user._id;

    if (score === undefined || score === null) {
      return res.status(400).json({ success: false, message: "Score is required" });
    }

    // Find the quiz
    const quiz = quizId
      ? await Quiz.findOne({ _id: quizId, courseId })
      : await Quiz.findOne({ courseId }).sort({ order: 1 });

    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found in this course" });
    }

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({ success: false, message: "You must enroll in this course first" });
    }

    if (!progress.startDate) progress.startDate = new Date();
    progress.status = "InProgress";

    // Count previous attempts for this quiz
    const previousAttempts = await QuizAttempt.countDocuments({ userId, quizId: quiz._id });
    const attemptNumber = previousAttempts + 1;

    // Calculate correctness
    const totalQuestions = quiz.questions.length;
    const correctCount = Math.round((Number(score) / 100) * totalQuestions);
    const passed = Number(score) >= 70;

    let pointsEarned = 0;
    const alreadyCompleted = progress.completedQuizzes.some((id) => id.toString() === quiz._id.toString());

    if (passed && !alreadyCompleted) {
      progress.completedQuizzes.push(quiz._id);

      const rewards = quiz.rewards || {
        firstAttempt: 100, secondAttempt: 75, thirdAttempt: 50, fourthAndMore: 25,
      };

      if (attemptNumber === 1) pointsEarned = rewards.firstAttempt;
      else if (attemptNumber === 2) pointsEarned = rewards.secondAttempt;
      else if (attemptNumber === 3) pointsEarned = rewards.thirdAttempt;
      else pointsEarned = rewards.fourthAndMore;

      await User.findByIdAndUpdate(userId, { $inc: { points: pointsEarned } });
    }

    // Create QuizAttempt record
    await QuizAttempt.create({
      userId,
      courseId,
      quizId: quiz._id,
      attemptNumber,
      answers,
      score: Number(score),
      totalQuestions,
      correctCount,
      pointsEarned,
      passed,
    });

    progress.progressPercent = await calculateProgressPercent(courseId, progress);
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
        attemptNumber,
      },
    });
  } catch (error) {
    console.error("Complete Quiz Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while completing quiz" });
  }
};

const completeCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const progress = await Progress.findOne({ userId, courseId });
    if (!progress) {
      return res.status(400).json({ success: false, message: "You must enroll in this course first" });
    }

    const [lessonCount, quizCount] = await Promise.all([
      Lesson.countDocuments({ courseId }),
      Quiz.countDocuments({ courseId }),
    ]);

    if (progress.completedLessons.length < lessonCount) {
      return res.status(400).json({
        success: false,
        message: `Please complete all lessons first. ${progress.completedLessons.length}/${lessonCount} done.`,
      });
    }

    if (quizCount > 0 && progress.completedQuizzes.length < quizCount) {
      return res.status(400).json({
        success: false,
        message: "Please pass all quizzes before completing the course.",
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
    res.status(500).json({ success: false, message: "Server error while completing course" });
  }
};

module.exports = { getProgress, completeLesson, completeQuiz, completeCourse };
