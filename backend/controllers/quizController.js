// ==============================================
// QUIZ CONTROLLER (REDESIGNED)
// Uses separate Quiz collection
// ==============================================

const Quiz = require("../models/Quiz");
const Course = require("../models/Course");

// Validate questions array
const validateQuestions = (questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    return "At least one question is required";
  }
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    if (!q.question) return `Question ${i + 1}: question text is required`;
    if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
      return `Question ${i + 1}: at least 2 options are required`;
    }
    if (q.correctAnswer === undefined || q.correctAnswer === null) {
      return `Question ${i + 1}: correctAnswer is required`;
    }
    if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
      return `Question ${i + 1}: correctAnswer index is out of range`;
    }
  }
  return null;
};

const addQuiz = async (req, res) => {
  try {
    const { id } = req.params; // courseId
    const { title, questions, rewards } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Quiz title is required" });
    }

    const validationError = validateQuestions(questions);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Get next order
    const lastQuiz = await Quiz.findOne({ courseId: id }).sort({ order: -1 });
    const order = lastQuiz ? lastQuiz.order + 1 : 0;

    const quiz = await Quiz.create({
      courseId: id,
      title: title.trim(),
      order,
      questions,
      rewards: rewards || {
        firstAttempt: 100,
        secondAttempt: 75,
        thirdAttempt: 50,
        fourthAndMore: 25,
      },
    });

    res.status(201).json({ success: true, message: "Quiz added successfully", data: quiz });
  } catch (error) {
    console.error("Add Quiz Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while adding quiz" });
  }
};

const updateQuiz = async (req, res) => {
  try {
    const { id, quizId } = req.params;
    const { title, questions, rewards } = req.body;

    const quiz = await Quiz.findOne({ _id: quizId, courseId: id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found in this course" });
    }

    if (title !== undefined) quiz.title = title.trim();

    if (questions !== undefined) {
      const validationError = validateQuestions(questions);
      if (validationError) {
        return res.status(400).json({ success: false, message: validationError });
      }
      quiz.questions = questions;
    }

    if (rewards !== undefined) {
      if (rewards.firstAttempt !== undefined) quiz.rewards.firstAttempt = rewards.firstAttempt;
      if (rewards.secondAttempt !== undefined) quiz.rewards.secondAttempt = rewards.secondAttempt;
      if (rewards.thirdAttempt !== undefined) quiz.rewards.thirdAttempt = rewards.thirdAttempt;
      if (rewards.fourthAndMore !== undefined) quiz.rewards.fourthAndMore = rewards.fourthAndMore;
    }

    await quiz.save();

    res.status(200).json({ success: true, message: "Quiz updated successfully", data: quiz });
  } catch (error) {
    console.error("Update Quiz Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while updating quiz" });
  }
};

const deleteQuiz = async (req, res) => {
  try {
    const { id, quizId } = req.params;
    const quiz = await Quiz.findOneAndDelete({ _id: quizId, courseId: id });
    if (!quiz) {
      return res.status(404).json({ success: false, message: "Quiz not found in this course" });
    }

    res.status(200).json({ success: true, message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Delete Quiz Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while deleting quiz" });
  }
};

module.exports = { addQuiz, updateQuiz, deleteQuiz };