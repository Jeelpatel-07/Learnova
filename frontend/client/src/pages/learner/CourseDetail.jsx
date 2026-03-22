import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import ReviewSection from '../../components/learner/ReviewSection';
import API from '../../api/axios';
import { hasCompletedLesson, resolveMediaUrl } from '../../utils/helpers';
import {
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineLockClosed,
  HiOutlineMail,
  HiOutlinePhotograph,
  HiOutlinePlay,
  HiOutlinePuzzle,
  HiOutlineVideoCamera,
} from 'react-icons/hi';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentCourse, fetchCourse, enrollCourse, loading } = useCourseStore();
  const { isAuthenticated, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [search, setSearch] = useState('');
  const [progress, setProgress] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState({ averageRating: 0, count: 0 });
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchCourse(id);
    fetchProgress();
    fetchReviews();
  }, [id]);

  const fetchProgress = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await API.get(`/progress/${id}`);
      setProgress(res.data.data);
    } catch {
      setProgress(null);
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/courses/${id}/reviews`);
      setReviews(Array.isArray(res.data.data) ? res.data.data : []);
      setReviewMeta({
        averageRating: res.data.averageRating || 0,
        count: res.data.count || 0,
      });
    } catch {
      setReviews([]);
      setReviewMeta({ averageRating: 0, count: 0 });
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await enrollCourse(id);
      toast.success('Enrolled successfully!');
      fetchProgress();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleStartLearning = () => {
    navigate(`/learn/${id}`);
  };

  const handleOpenReview = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const currentUserReview = reviews.find((review) => review.userId?._id === user?._id);
    setReviewForm({
      rating: currentUserReview?.rating || 5,
      comment: currentUserReview?.comment || '',
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!reviewForm.rating) {
      toast.error('Please select a rating before submitting.');
      return;
    }

    try {
      setSubmittingReview(true);
      await API.post(`/courses/${id}/reviews`, {
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      });
      toast.success('Review saved successfully.');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video':
        return <HiOutlineVideoCamera className="w-4 h-4 text-red-500" />;
      case 'Document':
        return <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />;
      case 'Image':
        return <HiOutlinePhotograph className="w-4 h-4 text-green-500" />;
      default:
        return <HiOutlineBookOpen className="w-4 h-4 text-gray-400" />;
    }
  };

  const isLessonCompleted = (lessonId) => hasCompletedLesson(progress?.completedLessons, lessonId);

  const course = currentCourse;
  const filteredLessons =
    course?.lessons?.filter((lesson) => lesson.title?.toLowerCase().includes(search.toLowerCase())) || [];

  if (loading && !course) return <LoadingSpinner size="lg" text="Loading course..." />;
  if (!course) return <div className="page-container text-center text-gray-500">Course not found</div>;

  const completedCount = progress?.completedLessons?.length || 0;
  const totalCount = course.lessons?.length || 0;
  const progressPercent = progress?.progressPercent || 0;
  const invitedUserIds = (course.invitedUsers || []).map((entry) => String(entry?._id || entry));
  const attendeeIds = (course.attendees || []).map((entry) => String(entry?._id || entry));
  const isInvited = invitedUserIds.includes(String(user?._id || ''));
  const isEnrolled = attendeeIds.includes(String(user?._id || '')) || Boolean(progress);
  const isInvitationOnly = course.accessRule === 'Invitation';
  const canSelfEnroll = !isInvitationOnly || isInvited || isEnrolled;

  const accessMeta = (() => {
    if (course.accessRule === 'Invitation') {
      return {
        label: 'Invitation Only',
        detail: isInvited || isEnrolled ? 'You have access to enroll and continue.' : 'Only invited or enrolled learners can access lessons.',
      };
    }

    if (course.accessRule === 'Paid') {
      return {
        label: `Paid Access${course.price ? ` • $${course.price}` : ''}`,
        detail: 'Learners need to purchase or enroll before accessing lessons.',
      };
    }

    return {
      label: 'Open Access',
      detail: 'Learners can enroll and start normally.',
    };
  })();

  const visibilityMeta = {
    label: course.visibility === 'SignedIn' ? 'Signed In' : 'Everyone',
    detail:
      course.visibility === 'SignedIn'
        ? 'Visible only to logged-in users.'
        : 'Visible to all visitors on the platform.',
  };

  const actionConfig = (() => {
    if (!progress) {
      if (isInvitationOnly && !isAuthenticated) {
        return {
          label: 'Sign In for Invitation Access',
          onClick: () => navigate('/login'),
          className: 'btn-secondary flex items-center gap-2 px-8 py-3 text-base',
          icon: <HiOutlineLockClosed className="h-5 w-5" />,
        };
      }

      if (isInvitationOnly && !canSelfEnroll) {
        return {
          label: 'Invitation Required',
          onClick: () => navigate('/courses'),
          className: 'btn-secondary flex items-center gap-2 px-8 py-3 text-base',
          icon: <HiOutlineMail className="h-5 w-5" />,
          helper: 'You need to be invited by an admin or instructor before lessons unlock.',
        };
      }

      if (course.accessRule === 'Paid') {
        return {
          label: `Buy Course ($${course.price || 0})`,
          onClick: handleEnroll,
          className: 'btn-primary flex items-center gap-2 px-8 py-3 text-base',
        };
      }

      return {
        label: 'Start Learning',
        onClick: handleEnroll,
        className: 'btn-primary flex items-center gap-2 px-8 py-3 text-base',
        icon: <HiOutlineArrowRight className="h-5 w-5" />,
      };
    }

    if (progressPercent < 100) {
      return {
        label: 'Continue Learning',
        onClick: handleStartLearning,
        className: 'btn-primary flex items-center gap-2 px-8 py-3 text-base',
        icon: <HiOutlinePlay className="h-5 w-5" />,
      };
    }

    return {
      label: 'Course Completed',
      onClick: null,
      className: 'btn-success px-8 py-3 text-base',
      disabled: true,
    };
  })();

  return (
    <div className="page-container">
      <div className="card-elevated mb-8 overflow-hidden animate-slide-up">
        <div className="flex flex-col lg:flex-row">
          <div className="h-48 flex-shrink-0 bg-gradient-to-br from-indigo-100 to-purple-100 lg:h-auto lg:w-80">
            {course.image ? (
              <img src={resolveMediaUrl(course.image)} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <HiOutlineBookOpen className="h-16 w-16 text-indigo-200" />
              </div>
            )}
          </div>

          <div className="flex-1 p-8">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {course.tags?.map((tag, index) => (
                <Badge key={index} variant="primary" size="xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="mb-3 text-2xl font-bold text-gray-900">{course.title}</h1>
            <p className="mb-6 line-clamp-2 text-gray-500">{course.description}</p>

            <div className="mb-6 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Visibility</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{visibilityMeta.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{visibilityMeta.detail}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Access</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{accessMeta.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-500">{accessMeta.detail}</p>
              </div>
            </div>

            {progress && (
              <div className="mb-6 rounded-xl bg-gray-50 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{progressPercent}%</span>
                </div>
                <ProgressBar progress={progressPercent} size="md" showLabel={false} />
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                  <span>{totalCount} total lessons</span>
                  <span>{completedCount} completed</span>
                  <span>{totalCount - completedCount} remaining</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                onClick={actionConfig.onClick}
                className={actionConfig.className}
                disabled={actionConfig.disabled}
              >
                {actionConfig.label} {actionConfig.icon}
              </button>
              {actionConfig.helper && <p className="text-sm text-amber-600">{actionConfig.helper}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 flex w-fit gap-1 rounded-xl bg-gray-100 p-1">
        {['overview', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-lg px-5 py-2.5 text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
            }`}
          >
            {tab === 'reviews' ? `Ratings & Reviews (${reviewMeta.count})` : 'Course Overview'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="card-elevated animate-fade-in">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <h3 className="font-bold text-gray-800">Lessons</h3>
            <SearchBar value={search} onChange={setSearch} placeholder="Search lessons..." />
          </div>

          <div className="divide-y divide-gray-50">
            {filteredLessons.map((lesson, index) => {
              const completed = isLessonCompleted(lesson._id);

              return (
                <button
                  key={lesson._id || index}
                  onClick={() => progress && navigate(`/learn/${id}?lesson=${lesson._id}`)}
                  className={`w-full px-6 py-4 text-left transition-colors hover:bg-gray-50/50 ${
                    !progress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-sm text-gray-400">{index + 1}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                        {getTypeIcon(lesson.type)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
                        <p className="text-xs capitalize text-gray-500">{lesson.type}</p>
                      </div>
                    </div>

                    <div>
                      {completed ? (
                        <HiOutlineCheckCircle className="h-6 w-6 text-indigo-500" />
                      ) : progress?.completedLessons?.length > 0 && index <= progress.completedLessons.length ? (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-indigo-400">
                          <div className="h-2 w-2 rounded-full bg-indigo-400" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {course.quizzes?.map((quiz, index) => {
              const completedQuiz = progress?.completedQuizzes?.some((qid) => String(qid) === String(quiz._id));

              return (
                <button
                  key={quiz._id || `quiz-${index}`}
                  onClick={() => progress && navigate(`/learn/${id}`)}
                  className={`w-full px-6 py-4 text-left transition-colors hover:bg-gray-50/50 ${
                    !progress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="w-6 text-sm text-gray-400">{filteredLessons.length + index + 1}</span>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100">
                        <HiOutlinePuzzle className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{quiz.title || `Quiz ${index + 1}`}</p>
                        <p className="text-xs text-gray-500">{quiz.questions?.length || 0} questions</p>
                      </div>
                    </div>

                    <div>
                      {completedQuiz ? (
                        <HiOutlineCheckCircle className="h-6 w-6 text-indigo-500" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-gray-200" />
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="animate-fade-in">
          <ReviewSection
            averageRating={reviewMeta.averageRating}
            reviewCount={reviewMeta.count}
            reviews={reviews}
            isAuthenticated={isAuthenticated}
            user={user}
            onAddReview={handleOpenReview}
          />
        </div>
      )}

      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Rate This Course" size="sm">
        <div className="space-y-4">
          <div className="rounded-3xl bg-slate-50 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Your Rating</p>
            <p className="mt-2 text-sm text-slate-500">Choose a star rating, then add your written review.</p>
            <div className="mt-4 flex justify-center">
              <StarRating
                rating={reviewForm.rating}
                onRate={(rating) => setReviewForm((current) => ({ ...current, rating }))}
                size="lg"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Your Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={(event) =>
                setReviewForm((current) => ({ ...current, comment: event.target.value }))
              }
              className="input-field min-h-[120px]"
              placeholder="Share what you liked, what stood out, or what future learners should know."
              maxLength={1000}
            />
            <div className="mt-2 text-right text-xs text-slate-400">{reviewForm.comment.length}/1000</div>
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={() => setShowReviewModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button onClick={handleSubmitReview} className="btn-primary" disabled={submittingReview}>
              {submittingReview ? 'Saving...' : 'Save Review'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetail;
