// ==============================================
// MAIN SERVER FILE (FINAL VERSION)
// ==============================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// ==============================================
// MIDDLEWARE
// ==============================================

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==============================================
// ROUTES
// ==============================================

// Health check
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🚀 Learnova API Running",
  });
});

// Auth routes
app.use("/api/auth", require("./routes/authRoutes"));

// Course routes (includes lessons, quizzes, reviews)
app.use("/api/courses", require("./routes/courseRoutes"));

// Progress routes
app.use("/api/progress", require("./routes/progressRoutes"));

// Review routes (standalone admin routes)
app.use("/api/reviews", require("./routes/reviewRoutes"));

// Reporting routes
app.use("/api/reporting", require("./routes/reportingRoutes"));

// ==============================================
// START SERVER
// ==============================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🟢 Server running on http://localhost:${PORT}`);
});