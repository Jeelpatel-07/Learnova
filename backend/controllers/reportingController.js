const Progress = require("../models/Progress");

// ==============================================
// GET REPORT
// GET /api/reporting
// ==============================================
const getReport = async (req, res) => {
  try {
    const totalParticipants = await Progress.distinct("userId");

    const yetToStart = await Progress.countDocuments({
      status: "YetToStart",
    });

    const inProgress = await Progress.countDocuments({
      status: "InProgress",
    });

    const completed = await Progress.countDocuments({
      status: "Completed",
    });

    const progressRecords = await Progress.find()
      .populate("userId", "name email")
      .populate("courseId", "title");

    const table = progressRecords.map((record) => ({
      userName: record.userId ? record.userId.name : "Unknown User",
      course: record.courseId ? record.courseId.title : "Unknown Course",
      progressPercent: record.progressPercent,
      status: record.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalParticipants: totalParticipants.length,
        yetToStart,
        inProgress,
        completed,
        table,
      },
    });
  } catch (error) {
    console.error("Reporting Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while generating report",
    });
  }
};

// ==============================================
// GET REPORT BY COURSE
// GET /api/reporting/course/:courseId
// ==============================================
const getReportByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progressRecords = await Progress.find({ courseId })
      .populate("userId", "name email")
      .populate("courseId", "title");

    const yetToStart = progressRecords.filter(
      (item) => item.status === "YetToStart"
    ).length;

    const inProgress = progressRecords.filter(
      (item) => item.status === "InProgress"
    ).length;

    const completed = progressRecords.filter(
      (item) => item.status === "Completed"
    ).length;

    const table = progressRecords.map((record) => ({
      userName: record.userId ? record.userId.name : "Unknown User",
      course: record.courseId ? record.courseId.title : "Unknown Course",
      progressPercent: record.progressPercent,
      status: record.status,
    }));

    res.status(200).json({
      success: true,
      data: {
        totalParticipants: progressRecords.length,
        yetToStart,
        inProgress,
        completed,
        table,
      },
    });
  } catch (error) {
    console.error("Course Reporting Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while generating course report",
    });
  }
};

module.exports = {
  getReport,
  getReportByCourse,
};