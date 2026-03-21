import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import ProgressBar from '../../components/common/ProgressBar';
import Modal from '../../components/common/Modal';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { calculateProgress, getBadgeForPoints, getNextBadge, getPointsForAttempt } from '../../utils/helpers';
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineCheckCircle,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlinePuzzle,
  HiOutlineDownload,
  HiOutlineLink,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

const LearningPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentCourse, fetchCourse } = useCourseStore();
  const { user, updateUser } = useAuthStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [completedIds, setCompletedIds] = useState([]);

  // Quiz states
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Reward popup
  const [showReward, setShowReward] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  // Course completion
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    fetchCourse(id);
    fetchProgress();
  }, [id]);

  useEffect(() => {
    const lessonId = searchParams.get('lesson');
    if (lessonId && currentCourse?.lessons) {
      const idx = currentCourse.lessons.findIndex((l) => l._id === lessonId);
      if (idx >= 0) setCurrentLessonIndex(idx);
    }
  }, [searchParams, currentCourse]);

  const fetchProgress = async () => {
    try {
      const res = await API.get(`/progress/${id}`);
      setProgress(res.data.data);
      setCompletedIds(res.data.data.completedContentIds || []);
    } catch (err) { }
  };

  const course = currentCourse;
  const lessons = course?.lessons || [];
  const currentLesson = lessons[currentLessonIndex];
  const quizzes = course?.quizzes || [];
  const currentQuiz = quizzes[0]; // First quiz for now

  const totalItems = lessons.length + (currentQuiz ? 1 : 0);
  const completedCount = completedIds.length + (progress?.quizCompleted ? 1 : 0);
  const progressPercent = calculateProgress(completedCount, totalItems);

  const isCompleted = (lessonId) => completedIds.includes(lessonId);

  const markLessonComplete = async (lessonId) => {
    if (isCompleted(lessonId)) return;
    try {
      await API.post(`/progress/${id}/complete-lesson`, { lessonId });
      setCompletedIds([...completedIds, lessonId]);
      toast.success('Lesson completed! ✅');

      // Check if all done
      const newCompleted = [...completedIds, lessonId];
      if (newCompleted.length === lessons.length && (progress?.quizCompleted || !currentQuiz)) {
        setShowCompletion(true);
      }
    } catch (err) {
      toast.error('Failed to mark complete');
    }
  };

  const handleNext = () => {
    if (currentLesson && !isCompleted(currentLesson._id)) {
      markLessonComplete(currentLesson._id);
    }
    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  // Quiz handlers
  const handleStartQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setQuizAnswers([]);
    setQuizCompleted(false);
  };

  const handleQuizProceed = () => {
    const newAnswers = [...quizAnswers, selectedOption];
    setQuizAnswers(newAnswers);

    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
    } else {
      // Quiz complete
      const score = newAnswers.reduce((sum, ans, i) => {
        return sum + (ans === currentQuiz.questions[i].correctAnswer ? 1 : 0);
      }, 0);
      setQuizScore(score);
      handleQuizComplete(score, newAnswers);
    }
  };

  const handleQuizComplete = async (score, answers) => {
    setQuizCompleted(true);
    try {
      const res = await API.post(`/progress/${id}/complete-quiz`, {
        quizId: currentQuiz._id,
        answers,
        score,
      });
      const points = res.data.data.pointsEarned || 0;
      setEarnedPoints(points);
      setShowReward(true);

      // Update user points
      updateUser({ points: (user?.points || 0) + points });

      // Update progress
      setProgress({ ...progress, quizCompleted: true });

      // Check course completion
      if (completedIds.length === lessons.length) {
        setTimeout(() => setShowCompletion(true), 2000);
      }
    } catch (err) {
      toast.error('Failed to submit quiz');
    }
  };

  const handleCompleteCourse = async () => {
    try {
      await API.post(`/progress/${id}/complete-course`);
      toast.success('🎉 Course Completed! Congratulations!');
      setShowCompletion(false);
      navigate(`/courses/${id}`);
    } catch (err) {
      toast.error('Failed to complete course');
    }
  };

  if (!course) return <LoadingSpinner size="lg" text="Loading..." />;

  // Determine what to show in the main area
  const isShowingQuiz = currentLessonIndex >= lessons.length; // After all lessons = quiz

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 rounded-lg">
            {sidebarOpen ? <HiOutlineX className="w-5 h-5" /> : <HiOutlineMenu className="w-5 h-5" />}
          </button>
          <h2 className="font-bold text-gray-800 text-sm truncate max-w-[300px]">{course.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{progressPercent}% complete</span>
          <button onClick={() => navigate('/my-courses')} className="btn-ghost text-sm py-1.5">
            <HiOutlineChevronLeft className="w-4 h-4 mr-1 inline" /> Back
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-white border-r border-gray-100 flex flex-col overflow-y-auto flex-shrink-0 animate-fade-in">
            {/* Progress */}
            <div className="p-4 border-b border-gray-100">
              <ProgressBar progress={progressPercent} size="sm" />
              <p className="text-xs text-gray-500 mt-2">{completedCount}/{totalItems} completed</p>
            </div>

            {/* Lessons */}
            <div className="flex-1 overflow-y-auto">
              {lessons.map((lesson, i) => (
                <div key={lesson._id || i}>
                  <button
                    onClick={() => { setCurrentLessonIndex(i); setQuizStarted(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      currentLessonIndex === i && !isShowingQuiz
                        ? 'bg-indigo-50 border-r-2 border-indigo-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {isCompleted(lesson._id) ? (
                      <HiOutlineCheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                    ) : currentLessonIndex === i ? (
                      <div className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center flex-shrink-0">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-gray-200 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${currentLessonIndex === i ? 'text-indigo-600' : 'text-gray-700'}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">{lesson.type}</p>
                    </div>
                  </button>

                  {/* Attachments */}
                  {lesson.attachments?.length > 0 && currentLessonIndex === i && (
                    <div className="px-12 pb-2 space-y-1">
                      {lesson.attachments.map((att, j) => (
                        <a key={j} href={att} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600">
                          <HiOutlineLink className="w-3 h-3" />
                          <span className="truncate">Attachment {j + 1}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Quiz item in sidebar */}
              {currentQuiz && (
                <button
                  onClick={() => { setCurrentLessonIndex(lessons.length); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isShowingQuiz ? 'bg-purple-50 border-r-2 border-purple-500' : 'hover:bg-gray-50'
                  }`}
                >
                  {progress?.quizCompleted ? (
                    <HiOutlineCheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-purple-300 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${isShowingQuiz ? 'text-purple-600' : 'text-gray-700'}`}>
                      Quiz
                    </p>
                    <p className="text-xs text-gray-400">{currentQuiz.questions?.length || 0} questions</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Lesson Content */}
          {!isShowingQuiz && currentLesson && (
            <div className="p-8 max-w-4xl mx-auto animate-fade-in">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{currentLesson.title}</h2>
              {currentLesson.description && (
                <p className="text-gray-500 mb-6">{currentLesson.description}</p>
              )}

              {/* Video */}
              {currentLesson.type === 'video' && (
                <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-6">
                  {currentLesson.fileUrl?.includes('youtube') || currentLesson.fileUrl?.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(currentLesson.fileUrl)}`}
                      className="w-full h-full"
                      allowFullScreen
                      title={currentLesson.title}
                    />
                  ) : (
                    <video src={currentLesson.fileUrl} controls className="w-full h-full" />
                  )}
                </div>
              )}

              {/* Document */}
              {currentLesson.type === 'document' && (
                <div className="bg-gray-100 rounded-2xl p-8 mb-6 text-center">
                  <HiOutlineDocumentText className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Document: {currentLesson.title}</p>
                  {currentLesson.fileUrl && (
                    <div className="flex items-center justify-center gap-3">
                      <a href={currentLesson.fileUrl} target="_blank" rel="noreferrer" className="btn-primary text-sm">
                        View Document
                      </a>
                      {currentLesson.allowDownload && (
                        <a href={currentLesson.fileUrl} download className="btn-secondary text-sm flex items-center gap-1.5">
                          <HiOutlineDownload className="w-4 h-4" /> Download
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Image */}
              {currentLesson.type === 'image' && (
                <div className="rounded-2xl overflow-hidden mb-6">
                  <img src={currentLesson.fileUrl} alt={currentLesson.title} className="w-full max-h-[600px] object-contain bg-gray-100" />
                  {currentLesson.allowDownload && (
                    <div className="mt-3 text-center">
                      <a href={currentLesson.fileUrl} download className="btn-secondary text-sm inline-flex items-center gap-1.5">
                        <HiOutlineDownload className="w-4 h-4" /> Download Image
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Attachments */}
              {currentLesson.attachments?.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="text-sm font-semibold text-gray-700 mb-2">📎 Additional Resources</p>
                  <div className="space-y-2">
                    {currentLesson.attachments.map((att, i) => (
                      <a key={i} href={att} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700">
                        <HiOutlineLink className="w-4 h-4" />
                        {att}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-100">
                <button
                  onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                  disabled={currentLessonIndex === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                >
                  <HiOutlineChevronLeft className="w-4 h-4" /> Previous
                </button>

                {!isCompleted(currentLesson._id) && (
                  <button
                    onClick={() => markLessonComplete(currentLesson._id)}
                    className="btn-success flex items-center gap-2"
                  >
                    <HiOutlineCheckCircle className="w-4 h-4" /> Mark Complete
                  </button>
                )}

                <button
                  onClick={handleNext}
                  className="btn-primary flex items-center gap-2"
                >
                  Next Content <HiOutlineChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quiz Content */}
          {isShowingQuiz && currentQuiz && (
            <div className="p-8 max-w-2xl mx-auto animate-fade-in">
              {/* Quiz Intro */}
              {!quizStarted && !quizCompleted && (
                <div className="card-elevated p-12 text-center">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlinePuzzle className="w-10 h-10 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Time! 🧠</h2>
                  <p className="text-gray-500 mb-2">
                    {currentQuiz.questions?.length} questions
                  </p>
                  <p className="text-sm text-gray-400 mb-8">Multiple attempts allowed</p>
                  <button onClick={handleStartQuiz} className="btn-primary text-lg py-3 px-10">
                    Start Quiz
                  </button>
                </div>
              )}

              {/* Quiz Questions */}
              {quizStarted && !quizCompleted && currentQuiz.questions?.[currentQuestion] && (
                <div className="card-elevated p-8 animate-scale-in">
                  {/* Question header */}
                  <div className="flex items-center justify-between mb-6">
                    <Badge variant="primary">
                      Question {currentQuestion + 1} of {currentQuiz.questions.length}
                    </Badge>
                    <ProgressBar
                      progress={((currentQuestion + 1) / currentQuiz.questions.length) * 100}
                      size="sm"
                      showLabel={false}
                    />
                  </div>

                  {/* Question */}
                  <h3 className="text-lg font-bold text-gray-800 mb-6">
                    {currentQuiz.questions[currentQuestion].question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-3 mb-8">
                    {currentQuiz.questions[currentQuestion].options.map((option, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedOption(i)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                          selectedOption === i
                            ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            selectedOption === i ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                          }`}>
                            {selectedOption === i && (
                              <div className="w-2 h-2 bg-white rounded-full" />
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Action */}
                  <div className="flex justify-end">
                    <button
                      onClick={handleQuizProceed}
                      disabled={selectedOption === null}
                      className="btn-primary py-3 px-8 disabled:opacity-50"
                    >
                      {currentQuestion < currentQuiz.questions.length - 1 ? 'Proceed' : 'Proceed & Complete Quiz'}
                      <HiOutlineChevronRight className="w-4 h-4 ml-2 inline" />
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz Completed */}
              {quizCompleted && (
                <div className="card-elevated p-12 text-center animate-scale-in">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <HiOutlineCheckCircle className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Quiz Completed! 🎉</h2>
                  <p className="text-gray-500 mb-4">
                    You scored {quizScore}/{currentQuiz.questions.length}
                  </p>
                  <button onClick={() => navigate(`/courses/${id}`)} className="btn-primary">
                    Back to Course
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reward Popup */}
      <Modal isOpen={showReward} onClose={() => setShowReward(false)} title="" size="sm" showClose={false}>
        <div className="text-center py-4 animate-scale-in">
          <div className="text-6xl mb-4 animate-float">🎉</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bingo! You earned!</h2>
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 my-6">
            <p className="text-4xl font-bold text-indigo-600">+{earnedPoints}</p>
            <p className="text-sm text-gray-500">Points</p>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500">
                {getBadgeForPoints((user?.points || 0) + earnedPoints).icon}{' '}
                {getBadgeForPoints((user?.points || 0) + earnedPoints).name}
              </span>
              {getNextBadge((user?.points || 0) + earnedPoints) && (
                <span className="text-gray-400">
                  Next: {getNextBadge((user?.points || 0) + earnedPoints)?.name}
                </span>
              )}
            </div>
            <ProgressBar
              progress={
                getNextBadge((user?.points || 0) + earnedPoints)
                  ? (((user?.points || 0) + earnedPoints) / getNextBadge((user?.points || 0) + earnedPoints).points) * 100
                  : 100
              }
              size="md"
              showLabel={false}
            />
          </div>

          <p className="text-sm text-gray-400 mb-6">Keep going to reach the next rank!</p>
          <button onClick={() => setShowReward(false)} className="btn-primary w-full py-3">
            Awesome! 🚀
          </button>
        </div>
      </Modal>

      {/* Course Completion Modal */}
      <Modal isOpen={showCompletion} onClose={() => setShowCompletion(false)} title="" size="sm" showClose={false}>
        <div className="text-center py-4 animate-scale-in">
          <div className="text-6xl mb-4 animate-float">🏆</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Course Completed!</h2>
          <p className="text-gray-500 mb-6">Congratulations! You've completed all lessons and quizzes.</p>
          <button onClick={handleCompleteCourse} className="btn-success w-full py-3 text-lg">
            Complete this course ✓
          </button>
        </div>
      </Modal>
    </div>
  );
};

// Helper to extract YouTube ID
function extractYoutubeId(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/);
  return match ? match[1] : '';
}

export default LearningPage;

/*
============================================
BACKEND API REQUIRED:
============================================

POST   /api/progress/:courseId/complete-lesson
Body: { lessonId: "..." }
→ Add lessonId to completedContentIds array
→ Recalculate progressPercent

POST   /api/progress/:courseId/complete-quiz
Body: { quizId, answers: [selectedOptionIndex...], score }
→ Calculate points based on attempt number and quiz rewards
→ Add points to user's total
→ Return: { pointsEarned, attemptNumber, totalPoints }

POST   /api/progress/:courseId/complete-course
→ Mark course as fully completed
→ Set completedDate, status = "completed"

============================================
*/