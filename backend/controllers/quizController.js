// ==============================================
// QUIZ CONTROLLER
// Manages quizzes INSIDE the Course document
// Uses MongoDB $push, $pull operators
// ==============================================

const Course = require("../models/Course");

// ==============================================
// ADD QUIZ
// POST /api/courses/:id/quizzes
//
// Body example:
// {
//   "title": "JavaScript Basics Quiz",
//   "questions": [
//     {
//       "question": "What keyword declares a variable?",
//       "options": ["var", "int", "string", "dim"],
//       "correctAnswer": 0
//     },
//     {
//       "question": "Which is not a JS data type?",
//       "options": ["String", "Boolean", "Float", "Number"],
//       "correctAnswer": 2
//     }
//   ],
//   "rewards": {
//     "firstAttempt": 100,
//     "secondAttempt": 75,
//     "thirdAttempt": 50,
//     "fourthAndMore": 25
//   }
// }
// ==============================================
const addQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, questions, rewards } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Quiz title is required",
      });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one question is required",
      });
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      if (!q.question) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: question text is required`,
        });
      }

      if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: at least 2 options are required`,
        });
      }

      if (q.correctAnswer === undefined || q.correctAnswer === null) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: correctAnswer is required`,
        });
      }

      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        return res.status(400).json({
          success: false,
          message: `Question ${i + 1}: correctAnswer index is out of range`,
        });
      }
    }

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Build quiz object
    const newQuiz = {
      title,
      questions,
      rewards: rewards || {
        firstAttempt: 100,
        secondAttempt: 75,
        thirdAttempt: 50,
        fourthAndMore: 25,
      },
    };

    // Use $push to add quiz to the quizzes array
    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { $push: { quizzes: newQuiz } },
      { new: true, runValidators: true }
    );

    // Get the newly added quiz (last item in array)
    const addedQuiz = updatedCourse.quizzes[updatedCourse.quizzes.length - 1];

    res.status(201).json({
      success: true,
      message: "Quiz added successfully",
      data: addedQuiz,
    });
  } catch (error) {
    console.error("Add Quiz Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while adding quiz",
    });
  }
};

// ==============================================
// UPDATE QUIZ
// PUT /api/courses/:id/quizzes/:quizId
//
// Can update title, questions, or rewards
// ==============================================
const updateQuiz = async (req, res) => {
  try {
    const { id, quizId } = req.params;
    const { title, questions, rewards } = req.body;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Find the quiz inside the course
    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found in this course",
      });
    }

    // Update title if provided
    if (title !== undefined) {
      quiz.title = title;
    }

    // Update questions if provided
    if (questions !== undefined) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Questions must be a non-empty array",
        });
      }

      // Validate each question
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];

        if (!q.question) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: question text is required`,
          });
        }

        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: at least 2 options are required`,
          });
        }

        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: correctAnswer is required`,
          });
        }

        if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
          return res.status(400).json({
            success: false,
            message: `Question ${i + 1}: correctAnswer index is out of range`,
          });
        }
      }

      quiz.questions = questions;
    }

    // Update rewards if provided
    if (rewards !== undefined) {
      if (rewards.firstAttempt !== undefined) quiz.rewards.firstAttempt = rewards.firstAttempt;
      if (rewards.secondAttempt !== undefined) quiz.rewards.secondAttempt = rewards.secondAttempt;
      if (rewards.thirdAttempt !== undefined) quiz.rewards.thirdAttempt = rewards.thirdAttempt;
      if (rewards.fourthAndMore !== undefined) quiz.rewards.fourthAndMore = rewards.fourthAndMore;
    }

    // Save the course (saves embedded quiz)
    await course.save();

    res.status(200).json({
      success: true,
      message: "Quiz updated successfully",
      data: quiz,
    });
  } catch (error) {
    console.error("Update Quiz Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while updating quiz",
    });
  }
};

// ==============================================
// DELETE QUIZ
// DELETE /api/courses/:id/quizzes/:quizId
//
// Uses $pull to remove quiz from array
// ==============================================
const deleteQuiz = async (req, res) => {
  try {
    const { id, quizId } = req.params;

    // Find the course
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Check if quiz exists
    const quiz = course.quizzes.id(quizId);
    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz not found in this course",
      });
    }

    // Use $pull to remove the quiz from the array
    await Course.findByIdAndUpdate(id, {
      $pull: { quizzes: { _id: quizId } },
    });

    res.status(200).json({
      success: true,
      message: "Quiz deleted successfully",
    });
  } catch (error) {
    console.error("Delete Quiz Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while deleting quiz",
    });
  }
};

module.exports = {
  addQuiz,
  updateQuiz,
  deleteQuiz,
};