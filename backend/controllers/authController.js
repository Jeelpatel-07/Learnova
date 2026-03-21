// ==============================================
// AUTH CONTROLLER
// Handles signup and login
// ==============================================

const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// ==============================================
// SIGNUP
// POST /api/auth/signup
// ==============================================
const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // Create user (password hashed automatically by pre-save hook)
    const user = await User.create({
      name,
      email,
      password,
      role: role || "Learner",
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
          enrolledCourses: user.enrolledCourses,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during signup",
    });
  }
};

// ==============================================
// LOGIN
// POST /api/auth/login
// ==============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          points: user.points,
          enrolledCourses: user.enrolledCourses,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ==============================================
// GET CURRENT USER
// GET /api/auth/me
// ==============================================
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("enrolledCourses", "title image published");

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get Me Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching user",
    });
  }
};

// ==============================================
// GET ALL USERS (Admin only)
// GET /api/auth/users
// ==============================================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get All Users Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while fetching users",
    });
  }
};

module.exports = { signup, login, getMe, getAllUsers };