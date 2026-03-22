import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import API from '../../api/axios';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  calculateProgress,
  calculateQuizPercentage,
  getBadgeForPoints,
  getNextBadge,
  hasCompletedLesson,
  resolveMediaUrl,
} from '../../utils/helpers';
import {
  HiOutlineCheckCircle,
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineLink,
  HiOutlineLockClosed,
  HiOutlineMenu,
  HiOutlinePhotograph,
  HiOutlinePuzzle,
  HiOutlineSparkles,
  HiOutlineVideoCamera,
  HiOutlineX,
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

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [quizAttemptResult, setQuizAttemptResult] = useState(null);

  const [showReward, setShowReward] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [showCompletion, setShowCompletion] = useState(false);

  const fetchProgress = async () => {
    try {
      const res = await API.get(`/progress/${id}`);
      setProgress(res.data.data);
      setCompletedIds(res.data.data.completedLessons || []);
    } catch {
      setProgress(null);
      setCompletedIds([]);
    }
  };

  useEffect(() => {
    fetchCourse(id);
    fetchProgress();
  }, [id]);

  useEffect(() => {
    const lessonId = searchParams.get('lesson');
    if (lessonId && currentCourse?.lessons) {
      const idx = currentCourse.lessons.findIndex((lesson) => lesson._id === lessonId);
      if (idx >= 0) setCurrentLessonIndex(idx);
    }
  }, [searchParams, currentCourse]);

  const course = currentCourse;
  const lessons = course?.lessons || [];
  const quizzes = course?.quizzes || [];
  const currentLesson = lessons[currentLessonIndex];
  const currentQuiz = quizzes[currentQuizIndex] || null;

  const totalItems = lessons.length + quizzes.length;
  const completedQuizCount = progress?.completedQuizzes?.length || 0;
  const completedCount = completedIds.length + completedQuizCount;
  const progressPercent = calculateProgress(completedCount, totalItems);
  const isEnrolled = Boolean(progress?._id);
  const isShowingQuiz = currentLessonIndex >= lessons.length;

  const invitedUserIds = (course?.invitedUsers || []).map((entry) => String(entry?._id || entry));
  const attendeeUserIds = (course?.attendees || []).map((entry) => String(entry?._id || entry));
  const isInvited = invitedUserIds.includes(String(user?._id || ''));
  const isAttendee = attendeeUserIds.includes(String(user?._id || ''));

  const learningLockedReason =
    course?.accessRule === 'Invitation' && !isEnrolled
      ? isInvited || isAttendee
        ? 'You are eligible for this invitation-only course, but you still need to enroll from the course page before lessons unlock.'
        : 'This course is invitation-only. Only invited or already enrolled learners can access lessons and quizzes.'
      : !isEnrolled
      ? 'You need to enroll in this course before lessons, quizzes, and progress tracking become available.'
      : '';

  const isCompleted = (lessonId) => hasCompletedLesson(completedIds, lessonId);
  const isQuizCompleted = (quizId) =>
    progress?.completedQuizzes?.some((completedQuizId) => String(completedQuizId) === String(quizId));

  const resetQuizState = () => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setSelectedOption(null);
    setQuizAnswers([]);
    setQuizCompleted(false);
    setQuizScore(0);
    setQuizAttemptResult(null);
  };

  const markLessonComplete = async (lessonId) => {
    if (isCompleted(lessonId)) return;

    try {
      const res = await API.post(`/progress/${id}/complete-lesson`, { lessonId });
      const nextCompletedIds = res.data.data.completedLessons || [...completedIds, lessonId];
      setCompletedIds(nextCompletedIds);
      setProgress((prev) => ({
        ...prev,
        ...res.data.data,
        completedLessons: nextCompletedIds,
      }));
      toast.success('Lesson completed.');

      const updatedQuizCount = res.data.data.completedQuizzes?.length || completedQuizCount;
      if (nextCompletedIds.length === lessons.length && (updatedQuizCount >= quizzes.length || quizzes.length === 0)) {
        setShowCompletion(true);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to mark lesson complete');
    }
  };

  const handleNext = () => {
    if (currentLesson && !isCompleted(currentLesson._id)) {
      markLessonComplete(currentLesson._id);
    }

    if (currentLessonIndex < lessons.length - 1) {
      setCurrentLessonIndex((prev) => prev + 1);
      return;
    }

    if (quizzes.length > 0) {
      setCurrentLessonIndex(lessons.length);
      setCurrentQuizIndex(0);
      resetQuizState();
    }
  };

  const handleStartQuiz = () => {
    if (!isEnrolled) {
      toast.error('Please enroll before starting the quiz.');
      navigate(`/courses/${id}`);
      return;
    }

    resetQuizState();
    setQuizStarted(true);
  };

  const handleQuizProceed = () => {
    const newAnswers = [...quizAnswers, selectedOption];
    setQuizAnswers(newAnswers);

    if (currentQuestion < currentQuiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    const correctAnswers = newAnswers.reduce(
      (sum, answer, index) => sum + (answer === currentQuiz.questions[index].correctAnswer ? 1 : 0),
      0
    );
    setQuizScore(correctAnswers);
    handleQuizComplete(correctAnswers, newAnswers);
  };

  const handleQuizComplete = async (correctAnswers, answers) => {
    setQuizCompleted(true);

    try {
      const score = calculateQuizPercentage(correctAnswers, currentQuiz.questions.length);
      const res = await API.post(`/progress/${id}/complete-quiz`, {
        quizId: currentQuiz._id,
        answers,
        score,
      });

      const points = res.data.data.pointsEarned || 0;
      const passed = Boolean(res.data.data.passed);
      const attemptNumber = res.data.data.attemptNumber || 1;

      setQuizAttemptResult({
        passed,
        pointsEarned: points,
        attemptNumber,
        score,
      });

      setEarnedPoints(points);
      if (points > 0) {
        setShowReward(true);
      }

      updateUser({ points: (user?.points || 0) + points });

      setProgress((prev) => ({
        ...prev,
        ...res.data.data,
        completedLessons: prev?.completedLessons || completedIds,
      }));

      const updatedQuizCount = res.data.data.completedQuizzes?.length || completedQuizCount;
      if (completedIds.length === lessons.length && updatedQuizCount >= quizzes.length) {
        setTimeout(() => setShowCompletion(true), 1200);
      }
    } catch (err) {
      setQuizCompleted(false);
      toast.error(err.response?.data?.message || err.message || 'Failed to submit quiz');
    }
  };

  const handleCompleteCourse = async () => {
    try {
      const res = await API.post(`/progress/${id}/complete-course`);
      setProgress((prev) => ({
        ...prev,
        ...res.data.data,
        completedLessons: prev?.completedLessons || completedIds,
      }));
      toast.success('Course completed successfully.');
      setShowCompletion(false);
      navigate(`/courses/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to complete course');
    }
  };

  if (!course) return <LoadingSpinner size="lg" text="Loading learning workspace..." />;

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef6ff_100%)] px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)]">
            <div className="border-b border-slate-200 px-6 py-5 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-600">Learning Access</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{course.title}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">{learningLockedReason}</p>
            </div>

            <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-900 text-white">
                  <HiOutlineLockClosed className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-slate-900">Lessons are locked for now</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Lesson completion, course progress, and quiz attempts only become active after enrollment.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => navigate(`/courses/${id}`)} className="btn-primary">
                    Go to Course Page
                  </button>
                  <button onClick={() => navigate('/courses')} className="btn-secondary">
                    Browse Courses
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                    <HiOutlineSparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">What unlocks after enrollment</p>
                    <p className="text-sm text-slate-500">Verified and enforced in the current flow.</p>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    'Lesson completed / incomplete tracking',
                    'Course completion percentage',
                    'Multiple quiz attempts',
                    'Points reduced on later attempts',
                    'Badge level based on total points',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex h-14 flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg p-2 hover:bg-gray-100">
            {sidebarOpen ? <HiOutlineX className="h-5 w-5" /> : <HiOutlineMenu className="h-5 w-5" />}
          </button>
          <h2 className="max-w-[300px] truncate text-sm font-bold text-gray-800">{course.title}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{progressPercent}% complete</span>
          <button onClick={() => navigate('/my-courses')} className="btn-ghost py-1.5 text-sm">
            <HiOutlineChevronLeft className="mr-1 inline h-4 w-4" /> Back
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && (
          <div className="flex w-80 flex-shrink-0 flex-col overflow-y-auto border-r border-gray-100 bg-white animate-fade-in">
            <div className="border-b border-gray-100 p-4">
              <ProgressBar progress={progressPercent} size="sm" />
              <p className="mt-2 text-xs text-gray-500">
                {completedCount}/{totalItems} completed
              </p>
            </div>

            <div className="flex-1 overflow-y-auto">
              {lessons.map((lesson, index) => (
                <div key={lesson._id || index}>
                  <button
                    onClick={() => {
                      setCurrentLessonIndex(index);
                      resetQuizState();
                    }}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                      currentLessonIndex === index && !isShowingQuiz
                        ? 'border-r-2 border-indigo-500 bg-indigo-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {isCompleted(lesson._id) ? (
                      <HiOutlineCheckCircle className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                    ) : currentLessonIndex === index ? (
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 border-indigo-400">
                        <div className="h-2 w-2 rounded-full bg-indigo-400" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-gray-200" />
                    )}

                    <div className="min-w-0 flex-1">
                      <p
                        className={`truncate text-sm font-medium ${
                          currentLessonIndex === index ? 'text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {lesson.title}
                      </p>
                      <p className="text-xs capitalize text-gray-400">{lesson.type}</p>
                    </div>
                  </button>

                  {lesson.attachments?.length > 0 && currentLessonIndex === index && (
                    <div className="space-y-1 px-12 pb-2">
                      {lesson.attachments.map((attachment, attachmentIndex) => (
                        <a
                          key={attachmentIndex}
                          href={resolveMediaUrl(attachment.url || attachment)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600"
                        >
                          <HiOutlineLink className="h-3 w-3" />
                          <span className="truncate">
                            {attachment.title || attachment.originalName || `Attachment ${attachmentIndex + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {quizzes.map((quiz, quizIndex) => (
                <button
                  key={quiz._id || quizIndex}
                  onClick={() => {
                    setCurrentLessonIndex(lessons.length);
                    setCurrentQuizIndex(quizIndex);
                    resetQuizState();
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                    isShowingQuiz && currentQuizIndex === quizIndex
                      ? 'border-r-2 border-purple-500 bg-purple-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {isQuizCompleted(quiz._id) ? (
                    <HiOutlineCheckCircle className="h-5 w-5 flex-shrink-0 text-indigo-500" />
                  ) : (
                    <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-purple-300" />
                  )}
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        isShowingQuiz && currentQuizIndex === quizIndex ? 'text-purple-600' : 'text-gray-700'
                      }`}
                    >
                      {quiz.title || `Quiz ${quizIndex + 1}`}
                    </p>
                    <p className="text-xs text-gray-400">{quiz.questions?.length || 0} questions</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {!isShowingQuiz && currentLesson && (
            <div className="mx-auto max-w-4xl animate-fade-in p-8">
              <h2 className="mb-2 text-xl font-bold text-gray-900">{currentLesson.title}</h2>
              {currentLesson.description && <p className="mb-6 text-gray-500">{currentLesson.description}</p>}

              {currentLesson.type === 'Video' && (
                <div className="mb-6 aspect-video overflow-hidden rounded-2xl bg-black">
                  {currentLesson.fileUrl?.includes('youtube') || currentLesson.fileUrl?.includes('youtu.be') ? (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYoutubeId(currentLesson.fileUrl)}`}
                      className="h-full w-full"
                      allowFullScreen
                      title={currentLesson.title}
                    />
                  ) : (
                    <video src={resolveMediaUrl(currentLesson.fileUrl)} controls className="h-full w-full" />
                  )}
                </div>
              )}

              {currentLesson.type === 'Document' && (
                <div className="mb-6 rounded-2xl bg-gray-100 p-8 text-center">
                  <HiOutlineDocumentText className="mx-auto mb-4 h-16 w-16 text-blue-400" />
                  <p className="mb-4 text-gray-600">Document: {currentLesson.title}</p>
                  {currentLesson.fileUrl && (
                    <div className="flex items-center justify-center gap-3">
                      <a
                        href={resolveMediaUrl(currentLesson.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-primary text-sm"
                      >
                        View Document
                      </a>
                      {currentLesson.allowDownload && (
                        <a
                          href={resolveMediaUrl(currentLesson.fileUrl)}
                          download
                          className="btn-secondary flex items-center gap-1.5 text-sm"
                        >
                          <HiOutlineDownload className="h-4 w-4" /> Download
                        </a>
                      )}
                    </div>
                  )}
                </div>
              )}

              {currentLesson.type === 'Image' && (
                <div className="mb-6 overflow-hidden rounded-2xl">
                  <img
                    src={resolveMediaUrl(currentLesson.fileUrl)}
                    alt={currentLesson.title}
                    className="max-h-[600px] w-full bg-gray-100 object-contain"
                  />
                  {currentLesson.allowDownload && (
                    <div className="mt-3 text-center">
                      <a
                        href={resolveMediaUrl(currentLesson.fileUrl)}
                        download
                        className="btn-secondary inline-flex items-center gap-1.5 text-sm"
                      >
                        <HiOutlineDownload className="h-4 w-4" /> Download Image
                      </a>
                    </div>
                  )}
                </div>
              )}

              {currentLesson.attachments?.length > 0 && (
                <div className="mb-6 rounded-xl bg-gray-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-gray-700">Additional Resources</p>
                  <div className="space-y-2">
                    {currentLesson.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={resolveMediaUrl(attachment.url || attachment)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        <HiOutlineLink className="h-4 w-4" />
                        {attachment.title || attachment.originalName || `Attachment ${index + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                <button
                  onClick={() => setCurrentLessonIndex(Math.max(0, currentLessonIndex - 1))}
                  disabled={currentLessonIndex === 0}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                >
                  <HiOutlineChevronLeft className="h-4 w-4" /> Previous
                </button>

                {!isCompleted(currentLesson._id) && (
                  <button onClick={() => markLessonComplete(currentLesson._id)} className="btn-success flex items-center gap-2">
                    <HiOutlineCheckCircle className="h-4 w-4" /> Mark Complete
                  </button>
                )}

                <button onClick={handleNext} className="btn-primary flex items-center gap-2">
                  Next Content <HiOutlineChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {isShowingQuiz && currentQuiz && (
            <div className="mx-auto max-w-2xl animate-fade-in p-8">
              {!quizStarted && !quizCompleted && (
                <div className="card-elevated p-12 text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-purple-100">
                    <HiOutlinePuzzle className="h-10 w-10 text-purple-500" />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">Quiz Time!</h2>
                  <p className="mb-2 text-gray-500">{currentQuiz.questions?.length} questions</p>
                  <p className="mb-8 text-sm text-gray-400">
                    Multiple attempts are allowed. Reward points reduce on later attempts.
                  </p>
                  <button onClick={handleStartQuiz} className="btn-primary px-10 py-3 text-lg">
                    Start Quiz
                  </button>
                </div>
              )}

              {quizStarted && !quizCompleted && currentQuiz.questions?.[currentQuestion] && (
                <div className="card-elevated animate-scale-in p-8">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <Badge variant="primary">
                      Question {currentQuestion + 1} of {currentQuiz.questions.length}
                    </Badge>
                    <div className="w-40">
                      <ProgressBar
                        progress={((currentQuestion + 1) / currentQuiz.questions.length) * 100}
                        size="sm"
                        showLabel={false}
                      />
                    </div>
                  </div>

                  <h3 className="mb-6 text-lg font-bold text-gray-800">
                    {currentQuiz.questions[currentQuestion].question}
                  </h3>

                  <div className="mb-8 space-y-3">
                    {currentQuiz.questions[currentQuestion].options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        onClick={() => setSelectedOption(optionIndex)}
                        className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                          selectedOption === optionIndex
                            ? 'border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-500/10'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                              selectedOption === optionIndex ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'
                            }`}
                          >
                            {selectedOption === optionIndex && <div className="h-2 w-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{option}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleQuizProceed}
                      disabled={selectedOption === null}
                      className="btn-primary px-8 py-3 disabled:opacity-50"
                    >
                      {currentQuestion < currentQuiz.questions.length - 1 ? 'Proceed' : 'Submit Quiz'}
                      <HiOutlineChevronRight className="ml-2 inline h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {quizCompleted && (
                <div className="card-elevated animate-scale-in p-12 text-center">
                  <div
                    className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
                      quizAttemptResult?.passed ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}
                  >
                    <HiOutlineCheckCircle
                      className={`h-10 w-10 ${quizAttemptResult?.passed ? 'text-emerald-500' : 'text-amber-500'}`}
                    />
                  </div>
                  <h2 className="mb-2 text-2xl font-bold text-gray-800">
                    {quizAttemptResult?.passed ? 'Quiz Passed!' : 'Quiz Attempt Submitted'}
                  </h2>
                  <p className="mb-4 text-gray-500">
                    You scored {quizScore}/{currentQuiz.questions.length}
                  </p>

                  <div className="mb-6 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Attempt</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">{quizAttemptResult?.attemptNumber || 1}</p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Points Earned</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">+{quizAttemptResult?.pointsEarned || 0}</p>
                    </div>
                  </div>

                  <p className="mb-6 text-xs text-gray-400">
                    Multiple attempts are allowed. Points decrease with more attempts based on the configured reward settings.
                  </p>

                  <div className="flex items-center justify-center gap-3">
                    <button onClick={resetQuizState} className="btn-secondary flex items-center gap-2">
                      Try Again
                    </button>
                    <button onClick={() => navigate(`/courses/${id}`)} className="btn-primary">
                      Back to Course
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showReward} onClose={() => setShowReward(false)} title="" size="sm" showClose={false}>
        <div className="animate-scale-in py-4 text-center">
          <div className="mb-4 text-6xl font-black text-indigo-500">+{earnedPoints}</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Points unlocked</h2>
          <div className="my-6 rounded-2xl bg-gradient-to-r from-indigo-50 to-purple-50 p-6">
            <p className="text-4xl font-bold text-indigo-600">+{earnedPoints}</p>
            <p className="text-sm text-gray-500">Added to your total</p>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-gray-500">
                {getBadgeForPoints(user?.points || 0).icon} {getBadgeForPoints(user?.points || 0).name}
              </span>
              {getNextBadge(user?.points || 0) && (
                <span className="text-gray-400">Next: {getNextBadge(user?.points || 0)?.name}</span>
              )}
            </div>
            <ProgressBar
              progress={getNextBadge(user?.points || 0) ? ((user?.points || 0) / getNextBadge(user?.points || 0).points) * 100 : 100}
              size="md"
              showLabel={false}
            />
          </div>

          <p className="mb-6 text-sm text-gray-400">Keep going to reach the next badge level.</p>
          <button onClick={() => setShowReward(false)} className="btn-primary w-full py-3">
            Continue Learning
          </button>
        </div>
      </Modal>

      <Modal isOpen={showCompletion} onClose={() => setShowCompletion(false)} title="" size="sm" showClose={false}>
        <div className="animate-scale-in py-4 text-center">
          <div className="mb-4 text-5xl font-black text-emerald-500">100%</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-800">Course Completed!</h2>
          <p className="mb-6 text-gray-500">You have completed all lessons and quizzes for this course.</p>
          <button onClick={handleCompleteCourse} className="btn-success w-full py-3 text-lg">
            Finish Course
          </button>
        </div>
      </Modal>
    </div>
  );
};

function extractYoutubeId(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/);
  return match ? match[1] : '';
}

export default LearningPage;
