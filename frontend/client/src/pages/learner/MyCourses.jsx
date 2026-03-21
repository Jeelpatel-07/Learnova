import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getBadgeForPoints, getNextBadge, truncateText } from '../../utils/helpers';
import { BADGE_LEVELS } from '../../utils/constants';
import {
  HiOutlineAcademicCap,
  HiOutlinePlay,
  HiOutlineBookOpen,
  HiOutlineTrendingUp,
} from 'react-icons/hi';

const MyCourses = () => {
  const { myCourses, fetchMyCourses, loading } = useCourseStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const filtered = myCourses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const currentBadge = getBadgeForPoints(user?.points || 0);
  const nextBadge = getNextBadge(user?.points || 0);
  const progressToNext = nextBadge
    ? ((user?.points || 0) / nextBadge.points) * 100
    : 100;

  const getButtonState = (course) => {
    if (course.progress?.progressPercent === 100) return { label: 'Completed ✓', variant: 'btn-success', disabled: true };
    if (course.progress?.progressPercent > 0) return { label: 'Continue', variant: 'btn-primary' };
    return { label: 'Start', variant: 'btn-primary' };
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading your courses..." />;

  return (
    <div className="page-container">
      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Main Content */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
              <p className="text-sm text-gray-500">{myCourses.length} enrolled courses</p>
            </div>
            <SearchBar value={search} onChange={setSearch} placeholder="Search my courses..." />
          </div>

          {filtered.length === 0 ? (
            <div className="card-elevated text-center py-16">
              <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-bold text-gray-700 mb-2">No courses yet</h3>
              <p className="text-sm text-gray-500 mb-4">Start learning by browsing our courses</p>
              <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
                Browse Courses <HiOutlinePlay className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((course, i) => {
                const btn = getButtonState(course);
                return (
                  <div
                    key={course._id}
                    className="card-elevated overflow-hidden animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex flex-col sm:flex-row">
                      {/* Image */}
                      <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0">
                        {course.image ? (
                          <img src={course.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <HiOutlineAcademicCap className="w-10 h-10 text-indigo-200" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 p-5">
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {course.tags?.slice(0, 3).map((tag, j) => (
                            <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                          ))}
                        </div>

                        <h3 className="font-bold text-gray-800 mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                          {truncateText(course.description, 120)}
                        </p>

                        <div className="mb-3">
                          <ProgressBar progress={course.progress?.progressPercent || 0} size="sm" />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {course.progress?.completedLessons || 0}/{course.lessons?.length || 0} lessons completed
                          </span>
                          <button
                            onClick={() => navigate(`/courses/${course._id}`)}
                            className={`${btn.variant} text-sm py-2`}
                            disabled={btn.disabled}
                          >
                            {btn.label}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Profile Panel */}
        <div className="space-y-4">
          <div className="card-elevated p-6 text-center animate-slide-up">
            <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg shadow-indigo-500/25">
              {currentBadge.icon}
            </div>
            <h3 className="font-bold text-gray-800 text-lg">{user?.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{user?.email}</p>

            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 mb-4">
              <p className="text-3xl font-bold text-indigo-600">{user?.points || 0}</p>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-sm font-bold ${currentBadge.color} px-2 py-0.5 rounded-full`}>
                  {currentBadge.icon} {currentBadge.name}
                </span>
                {nextBadge && (
                  <span className="text-xs text-gray-500">
                    Next: {nextBadge.icon} {nextBadge.name}
                  </span>
                )}
              </div>
              <ProgressBar progress={progressToNext} size="sm" color="indigo" showLabel={false} />
              {nextBadge && (
                <p className="text-xs text-gray-400 mt-1.5">
                  {nextBadge.points - (user?.points || 0)} points to next level
                </p>
              )}
            </div>
          </div>

          {/* Badge Levels */}
          <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <HiOutlineTrendingUp className="w-5 h-5 text-indigo-500" />
              Badge Levels
            </h4>
            <div className="space-y-3">
              {BADGE_LEVELS.map((badge) => (
                <div
                  key={badge.name}
                  className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
                    (user?.points || 0) >= badge.points ? 'bg-indigo-50' : 'opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-sm font-medium text-gray-700">{badge.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{badge.points} pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;