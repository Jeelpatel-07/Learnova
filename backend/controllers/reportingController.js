const Progress = require("../models/Progress");

const mapRow = (record, index) => ({
  id: record._id,
  srNo: index + 1,
  participantName: record.userId?.name || "Unknown User",
  participantEmail: record.userId?.email || "",
  courseName: record.courseId?.title || "Unknown Course",
  enrolledDate: record.enrolledDate,
  startDate: record.startDate,
  timeSpent: record.timeSpent,
  completionPercentage: record.progressPercent,
  completedDate: record.completedDate,
  status: record.status,
});

const buildReport = (records) => {
  const totalParticipants = new Set(
    records.map((record) => record.userId?._id?.toString()).filter(Boolean)
  ).size;

  return {
    totalParticipants,
    yetToStart: records.filter((record) => record.status === "YetToStart").length,
    inProgress: records.filter((record) => record.status === "InProgress").length,
    completed: records.filter((record) => record.status === "Completed").length,
    table: records.map(mapRow),
  };
};

const getReport = async (req, res) => {
  try {
    const progressRecords = await Progress.find()
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: buildReport(progressRecords),
    });
  } catch (error) {
    console.error("Reporting Error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error while generating report",
    });
  }
};

const getReportByCourse = async (req, res) => {
  try {
    const progressRecords = await Progress.find({ courseId: req.params.courseId })
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: buildReport(progressRecords),
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
