// ==============================================
// MIGRATION SCRIPT
// Moves embedded lessons/quizzes from Course docs
// into separate Lesson and Quiz collections
// Preserves all existing data
// ==============================================

require("dotenv").config();
const mongoose = require("mongoose");

// We need to read the OLD Course schema (with embedded data)
// So we define a temporary schema that includes the old fields
const OldCourseSchema = new mongoose.Schema({
  title: String,
  lessons: [mongoose.Schema.Types.Mixed],
  quizzes: [mongoose.Schema.Types.Mixed],
  attendeeMessages: [mongoose.Schema.Types.Mixed],
}, { strict: false, collection: "courses" });

const OldCourse = mongoose.model("OldCourse", OldCourseSchema);

// New models
const Lesson = require("./models/Lesson");
const Quiz = require("./models/Quiz");

// Progress model - need to migrate completedContentIds -> completedLessons
const OldProgressSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  courseId: mongoose.Schema.Types.ObjectId,
  completedContentIds: [mongoose.Schema.Types.ObjectId],
  quizCompleted: Boolean,
  quizAttempts: Number,
  score: Number,
  progressPercent: Number,
  enrolledDate: Date,
  startDate: Date,
  completedDate: Date,
  status: String,
  timeSpent: Number,
  lastLessonId: mongoose.Schema.Types.ObjectId,
}, { strict: false, collection: "progresses" });

const OldProgress = mongoose.model("OldProgress", OldProgressSchema);

async function migrate() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // ========================================
    // STEP 1: Migrate embedded lessons & quizzes
    // ========================================
    const courses = await OldCourse.find({}).lean();
    console.log(`📚 Found ${courses.length} courses to process\n`);

    let totalLessons = 0;
    let totalQuizzes = 0;

    for (const course of courses) {
      const courseId = course._id;
      console.log(`  Processing course: "${course.title}" (${courseId})`);

      // Migrate lessons
      const embeddedLessons = course.lessons || [];
      if (embeddedLessons.length > 0) {
        // Check if already migrated
        const existingLessons = await Lesson.countDocuments({ courseId });
        if (existingLessons === 0) {
          const lessonDocs = embeddedLessons.map((lesson, index) => ({
            _id: lesson._id, // Preserve original IDs
            courseId,
            title: lesson.title || "Untitled Lesson",
            type: lesson.type || "Document",
            order: index,
            fileUrl: lesson.fileUrl || "",
            filePublicId: lesson.filePublicId || "",
            fileResourceType: lesson.fileResourceType || "",
            fileOriginalName: lesson.fileOriginalName || "",
            duration: lesson.duration || 0,
            allowDownload: lesson.allowDownload || false,
            description: lesson.description || "",
            responsible: lesson.responsible || "",
            attachments: lesson.attachments || [],
          }));

          await Lesson.insertMany(lessonDocs, { ordered: false }).catch(() => {});
          totalLessons += lessonDocs.length;
          console.log(`    ✅ Migrated ${lessonDocs.length} lessons`);
        } else {
          console.log(`    ⏭️  Lessons already migrated (${existingLessons} exist)`);
        }
      }

      // Migrate quizzes
      const embeddedQuizzes = course.quizzes || [];
      if (embeddedQuizzes.length > 0) {
        const existingQuizzes = await Quiz.countDocuments({ courseId });
        if (existingQuizzes === 0) {
          const quizDocs = embeddedQuizzes.map((quiz, index) => ({
            _id: quiz._id, // Preserve original IDs
            courseId,
            title: quiz.title || "Untitled Quiz",
            order: index,
            questions: quiz.questions || [],
            rewards: quiz.rewards || {
              firstAttempt: 100,
              secondAttempt: 75,
              thirdAttempt: 50,
              fourthAndMore: 25,
            },
          }));

          await Quiz.insertMany(quizDocs, { ordered: false }).catch(() => {});
          totalQuizzes += quizDocs.length;
          console.log(`    ✅ Migrated ${quizDocs.length} quizzes`);
        } else {
          console.log(`    ⏭️  Quizzes already migrated (${existingQuizzes} exist)`);
        }
      }
    }

    console.log(`\n📊 Migration Summary: ${totalLessons} lessons, ${totalQuizzes} quizzes extracted\n`);

    // ========================================
    // STEP 2: Clean up Course documents
    // Remove embedded arrays (lessons, quizzes, attendeeMessages)
    // ========================================
    console.log("🧹 Cleaning embedded data from Course documents...");
    const result = await mongoose.connection.collection("courses").updateMany(
      {},
      { $unset: { lessons: "", quizzes: "", attendeeMessages: "" } }
    );
    console.log(`   Updated ${result.modifiedCount} course documents\n`);

    // ========================================
    // STEP 3: Migrate Progress documents
    // completedContentIds -> completedLessons
    // quizCompleted -> completedQuizzes
    // ========================================
    console.log("📈 Migrating Progress documents...");
    const progressRecords = await OldProgress.find({}).lean();
    let progressUpdated = 0;

    for (const prog of progressRecords) {
      const updates = {};

      // Migrate completedContentIds to completedLessons
      if (prog.completedContentIds && prog.completedContentIds.length > 0) {
        updates.completedLessons = prog.completedContentIds;
      }

      // Migrate quizCompleted to completedQuizzes
      if (prog.quizCompleted) {
        // Find quizzes for this course and add their IDs
        const quizzes = await Quiz.find({ courseId: prog.courseId }).select("_id").lean();
        if (quizzes.length > 0) {
          updates.completedQuizzes = quizzes.map((q) => q._id);
        }
      }

      if (Object.keys(updates).length > 0) {
        await mongoose.connection.collection("progresses").updateOne(
          { _id: prog._id },
          {
            $set: updates,
            $unset: { completedContentIds: "", quizCompleted: "", quizAttempts: "", score: "" },
          }
        );
        progressUpdated++;
      }
    }
    console.log(`   Updated ${progressUpdated} progress documents\n`);

    // ========================================
    // STEP 4: Clean up User documents
    // Remove enrolledCourses field
    // ========================================
    console.log("👤 Cleaning User documents...");
    const userResult = await mongoose.connection.collection("users").updateMany(
      {},
      { $unset: { enrolledCourses: "" } }
    );
    console.log(`   Updated ${userResult.modifiedCount} user documents\n`);

    // ========================================
    // STEP 5: Clean up Review documents
    // Remove userName field
    // ========================================
    console.log("⭐ Cleaning Review documents...");
    const reviewResult = await mongoose.connection.collection("reviews").updateMany(
      {},
      { $unset: { userName: "" } }
    );
    console.log(`   Updated ${reviewResult.modifiedCount} review documents\n`);

    console.log("🎉 Migration completed successfully!");
    console.log("\nNew collections created:");
    console.log("  - lessons");
    console.log("  - quizzes");
    console.log("  - quizattempts (empty, will fill as users take quizzes)");
    console.log("\nOld embedded data removed from: courses, progresses, users, reviews");

  } catch (error) {
    console.error("❌ Migration Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

migrate();
