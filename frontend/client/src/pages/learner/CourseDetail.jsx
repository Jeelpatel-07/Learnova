import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import ProgressBar from '../../components/common/ProgressBar';
import Badge from '../../components/common/Badge';
import StarRating from '../../components/common/StarRating';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import SearchBar from '../../components/common/SearchBar';
import API from '../../api/axios';
import toast from 'react-hot-toast';
import { getInitials, hasCompletedLesson, resolveMediaUrl } from '../../utils/helpers';
import {
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineBookOpen,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlinePhotograph,
  HiOutlinePuzzle,
  HiOutlineStar,
  HiOutlineArrowRight,
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
  const [showReviewModal, setShowReviewModal] = useState(false);
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
    } catch (err) {
      setProgress(null);
      // Not enrolled yet
    }
  };

  const fetchReviews = async () => {
    try {
      const res = await API.get(`/courses/${id}/reviews`);
      setReviews(res.data.data || []);
    } catch (err) {
      setReviews([]);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await enrollCourse(id);
      toast.success('Enrolled successfully! 🎉');
      fetchProgress();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    }
  };

  const handleStartLearning = () => {
    navigate(`/learn/${id}`);
  };

  const handleSubmitReview = async () => {
    try {
      await API.post(`/courses/${id}/reviews`, reviewForm);
      toast.success('Review submitted! ⭐');
      setShowReviewModal(false);
      setReviewForm({ rating: 5, comment: '' });
      fetchReviews();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit review');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <HiOutlineVideoCamera className="w-4 h-4 text-red-500" />;
      case 'Document': return <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />;
      case 'Image': return <HiOutlinePhotograph className="w-4 h-4 text-green-500" />;
      default: return <HiOutlineBookOpen className="w-4 h-4 text-gray-400" />;
    }
  };

  const isLessonCompleted = (lessonId) => {
    return hasCompletedLesson(progress?.completedLessons, lessonId);
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const course = currentCourse;
  const filteredLessons = course?.lessons?.filter((l) =>
    l.title?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (loading && !course) return <LoadingSpinner size="lg" text="Loading course..." />;
  if (!course) return <div className="page-container text-center text-gray-500">Course not found</div>;

  const completedCount = progress?.completedLessons?.length || 0;
  const totalCount = course.lessons?.length || 0;
  const progressPercent = progress?.progressPercent || 0;

  return (
    <div className="page-container">
      {/* Course Header */}
      <div className="card-elevated overflow-hidden mb-8 animate-slide-up">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-80 h-48 lg:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0">
            {course.image ? (
              <img src={resolveMediaUrl(course.image)} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <HiOutlineBookOpen className="w-16 h-16 text-indigo-200" />
              </div>
            )}
          </div>
          <div className="flex-1 p-8">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {course.tags?.map((tag, i) => (
                <Badge key={i} variant="primary" size="xs">{tag}</Badge>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{course.title}</h1>
            <p className="text-gray-500 mb-6 line-clamp-2">{course.description}</p>

            {/* Progress Box */}
            {progress && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">Your Progress</span>
                  <span className="text-sm font-bold text-indigo-600">{progressPercent}%</span>
                </div>
                <ProgressBar progress={progressPercent} size="md" showLabel={false} />
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>📚 {totalCount} total lessons</span>
                  <span>✅ {completedCount} completed</span>
                  <span>📝 {totalCount - completedCount} remaining</span>
                </div>
              </div>
            )}

            {/* Action Button */}
            {!progress ? (
              <button onClick={handleEnroll} className="btn-primary text-base py-3 px-8 flex items-center gap-2">
                {course.accessRule === 'Paid' ? (
                  <>Buy Course (${course.price})</>
                ) : (
                  <>Start Learning <HiOutlineArrowRight className="w-5 h-5" /></>
                )}
              </button>
            ) : progressPercent < 100 ? (
              <button onClick={handleStartLearning} className="btn-primary text-base py-3 px-8 flex items-center gap-2">
                Continue Learning <HiOutlinePlay className="w-5 h-5" />
              </button>
            ) : (
              <button className="btn-success text-base py-3 px-8" disabled>
                ✅ Course Completed
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
        {['overview', 'reviews'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
              activeTab === tab ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'
            }`}
          >
            {tab === 'reviews' ? `Reviews (${reviews.length})` : 'Course Overview'}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="card-elevated animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Lessons</h3>
            <SearchBar value={search} onChange={setSearch} placeholder="Search lessons..." />
          </div>
          <div className="divide-y divide-gray-50">
            {filteredLessons.map((lesson, i) => {
              const completed = isLessonCompleted(lesson._id);
              return (
                <button
                  key={lesson._id || i}
                  onClick={() => progress && navigate(`/learn/${id}?lesson=${lesson._id}`)}
                  className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors text-left ${
                    !progress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-6">{i + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getTypeIcon(lesson.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{lesson.title}</p>
                      <p className="text-xs text-gray-500 capitalize">{lesson.type}</p>
                    </div>
                  </div>
                  <div>
                    {completed ? (
                      <HiOutlineCheckCircle className="w-6 h-6 text-indigo-500" />
                    ) : progress?.completedLessons?.length > 0 && i <= (progress.completedLessons.length) ? (
                      <div className="w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                        <div className="w-2 h-2 bg-indigo-400 rounded-full" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Quizzes in content list */}
            {course.quizzes?.map((quiz, qi) => {
              const qCompleted = progress?.completedQuizzes?.some((qid) => String(qid) === String(quiz._id));
              return (
                <button
                  key={quiz._id || `quiz-${qi}`}
                  onClick={() => progress && navigate(`/learn/${id}`)}
                  className={`w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors text-left ${
                    !progress ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 w-6">{filteredLessons.length + qi + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <HiOutlinePuzzle className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{quiz.title || `Quiz ${qi + 1}`}</p>
                      <p className="text-xs text-gray-500">{quiz.questions?.length || 0} questions</p>
                    </div>
                  </div>
                  <div>
                    {qCompleted ? (
                      <HiOutlineCheckCircle className="w-6 h-6 text-indigo-500" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-200" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="card-elevated p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-800">{avgRating}</p>
                <StarRating rating={Number(avgRating)} readonly size="md" />
                <p className="text-xs text-gray-500 mt-1">{reviews.length} reviews</p>
              </div>
            </div>
            {isAuthenticated && progress && (
              <button onClick={() => setShowReviewModal(true)} className="btn-primary text-sm">
                Add Review
              </button>
            )}
          </div>

          <div className="space-y-4">
            {reviews.map((review, i) => (
              <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {getInitials(review.userId?.name || 'U')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-gray-800">{review.userId?.name || 'Anonymous'}</span>
                    <StarRating rating={review.rating} readonly size="sm" />
                  </div>
                  <p className="text-sm text-gray-600">{review.comment}</p>
                </div>
              </div>
            ))}
            {reviews.length === 0 && (
              <p className="text-center text-gray-400 py-8">No reviews yet. Be the first! ⭐</p>
            )}
          </div>
        </div>
      )}

      {/* Review Modal */}
      <Modal isOpen={showReviewModal} onClose={() => setShowReviewModal(false)} title="Write a Review" size="sm">
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">How would you rate this course?</p>
            <StarRating rating={reviewForm.rating} onRate={(r) => setReviewForm({ ...reviewForm, rating: r })} size="lg" />
          </div>
          <div>
            <label className="input-label">Your Review</label>
            <textarea
              value={reviewForm.comment}
              onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
              className="input-field min-h-[120px]"
              placeholder="Share your experience..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowReviewModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmitReview} className="btn-primary">Submit Review</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CourseDetail;

/*
============================================
BACKEND API REQUIRED:
============================================

GET    /api/progress/:courseId → Get user's progress for a course
Response: { success: true, data: { userId, courseId, completedContentIds: [], quizCompleted, score, progressPercent } }

POST   /api/courses/:id/enroll → Enroll logged-in user
Response: { success: true, data: { progress object } }

GET    /api/courses/:id/reviews → Get all reviews for a course
Response: { success: true, data: [{ userId, userName, rating, comment, createdAt }] }

POST   /api/courses/:id/reviews → Add a review
Body: { rating: 1-5, comment: "..." }

============================================
*/
