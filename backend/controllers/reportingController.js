// ==============================================
// REPORTING CONTROLLER (REDESIGNED)
// Uses Progress + QuizAttempt for rich reports
// ==============================================

const Progress = require("../models/Progress");

const STATUS_LABELS = {
  YetToStart: "Yet to Start",
  InProgress: "In Progress",
  Completed: "Completed",
};

const mapRow = (record, index) => ({
  id: record._id,
  srNo: index + 1,
  participantId: record.userId?._id || null,
  participantName: record.userId?.name || "Unknown User",
  participantEmail: record.userId?.email || "",
  courseId: record.courseId?._id || null,
  courseName: record.courseId?.title || "Unknown Course",
  enrolledDate: record.enrolledDate,
  startDate: record.startDate,
  timeSpent: record.timeSpent,
  completionPercentage: record.progressPercent,
  completedDate: record.completedDate,
  status: record.status,
  statusLabel: STATUS_LABELS[record.status] || record.status,
  lessonsCompleted: record.completedLessons?.length || 0,
  quizzesCompleted: record.completedQuizzes?.length || 0,
});

const buildReport = (records) => {
  const totalParticipants = new Set(
    records.map((r) => r.userId?._id?.toString()).filter(Boolean)
  ).size;

  return {
    totalParticipants,
    yetToStart: records.filter((r) => r.status === "YetToStart").length,
    inProgress: records.filter((r) => r.status === "InProgress").length,
    completed: records.filter((r) => r.status === "Completed").length,
    courses: Array.from(
      new Map(
        records
          .filter((record) => record.courseId?._id && record.courseId?.title)
          .map((record) => [
            record.courseId._id.toString(),
            {
              id: record.courseId._id,
              name: record.courseId.title,
            },
          ])
      ).values()
    ).sort((a, b) => a.name.localeCompare(b.name)),
    table: records.map(mapRow),
  };
};

const getReport = async (req, res) => {
  try {
    const progressRecords = await Progress.find()
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: buildReport(progressRecords) });
  } catch (error) {
    console.error("Reporting Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while generating report" });
  }
};

const getReportByCourse = async (req, res) => {
  try {
    const progressRecords = await Progress.find({ courseId: req.params.courseId })
      .populate("userId", "name email")
      .populate("courseId", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: buildReport(progressRecords) });
  } catch (error) {
    console.error("Course Reporting Error:", error.message);
    res.status(500).json({ success: false, message: "Server error while generating course report" });
  }
};

module.exports = { getReport, getReportByCourse };
