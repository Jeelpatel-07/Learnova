// ==============================================
// AUTH CONTROLLER
// Handles signup, login, admin signup
// ==============================================

const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const isStrongPassword = (password = "") =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(password);

// ==============================================
// SIGNUP (Learner / Instructor only)
// POST /api/auth/signup
// ==============================================
const signup = async (req, res) => {
  try {
    const { name, email: rawEmail, password, role: rawRole } = req.body;
    const email = rawEmail?.trim().toLowerCase();
    const role = rawRole === "Instructor" ? "Instructor" : "Learner";

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a special character",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const user = await User.create({ name, email, password, role });
    const token = generateToken(user);

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
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }
    if (error.name === "ValidationError") {
      const firstError = Object.values(error.errors)[0];
      return res.status(400).json({
        success: false,
        message: firstError?.message || "Invalid signup data",
      });
    }
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
    const { email: rawEmail, password } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

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
      .select("-password");

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
// GET ALL USERS (Admin / Instructor)
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

// ==============================================
// ADMIN SIGNUP
// POST /api/auth/admin-signup
// Requires ADMIN_SECRET_KEY for authorization
// ==============================================
const adminSignup = async (req, res) => {
  try {
    const { name, email: rawEmail, password, adminKey } = req.body;
    const email = rawEmail?.trim().toLowerCase();

    if (!adminKey || adminKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret key",
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, and a special character",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: "Admin",
    });

    const token = generateToken(user);

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
    console.error("Admin Signup Error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A user with this email already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Server error during admin signup",
    });
  }
};

module.exports = { signup, login, getMe, getAllUsers, adminSignup };
