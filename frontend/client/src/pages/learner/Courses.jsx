import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import API from '../../api/axios';
import { resolveMediaUrl, truncateText } from '../../utils/helpers';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlinePlay,
  HiOutlineShoppingCart,
  HiOutlineCheckCircle,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlineFilter,
  HiOutlinePuzzle,
  HiOutlineUsers,
  HiOutlineLockClosed,
  HiOutlineMail,
} from 'react-icons/hi';

const Courses = () => {
  const { courses, fetchPublishedCourses, loading } = useCourseStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [progressMap, setProgressMap] = useState({});
  const [activeTag, setActiveTag] = useState('All');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchPublishedCourses();
  }, []);

  useEffect(() => {
    if (!isAuthenticated || courses.length === 0) return;
    const fetchAllProgress = async () => {
      const map = {};
      await Promise.all(
        courses.map(async (course) => {
          try {
            const res = await API.get(`/progress/${course._id}`);
            map[course._id] = res.data.data;
          } catch { /* Not enrolled */ }
        })
      );
      setProgressMap(map);
    };
    fetchAllProgress();
  }, [isAuthenticated, courses]);

  // Extract unique tags from all courses
  const allTags = useMemo(() => {
    const tagSet = new Set();
    courses.forEach((c) => c.tags?.forEach((t) => tagSet.add(t)));
    return ['All', ...Array.from(tagSet)];
  }, [courses]);

  // Filter and sort courses
  const filtered = useMemo(() => {
    let result = courses.filter((c) =>
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
    );
    if (activeTag !== 'All') {
      result = result.filter((c) => c.tags?.includes(activeTag));
    }
    if (sortBy === 'popular') {
      result = [...result].sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0));
    } else if (sortBy === 'rating') {
      result = [...result].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
    }
    return result;
  }, [courses, search, activeTag, sortBy]);

  const handleCourseAction = (course) => {
    if (!isAuthenticated) {
      navigate(`/courses/${course._id}`);
      return;
    }
    const progress = progressMap[course._id];
    if (progress && progress.progressPercent > 0 && progress.progressPercent < 100) {
      navigate(`/learn/${course._id}`);
    } else {
      navigate(`/courses/${course._id}`);
    }
  };

  const getButtonContent = (course) => {
    if (!isAuthenticated) {
      if (course.visibility === 'SignedIn') {
        return { label: 'Sign In to View', icon: <HiOutlineLockClosed className="w-4 h-4" />, variant: 'btn-secondary' };
      }
      return { label: 'View Course', icon: <HiOutlineArrowRight className="w-4 h-4" />, variant: 'btn-primary' };
    }
    const isInvited = (course.invitedUsers || []).some((u) => String(u?._id || u) === String(currentUser?._id || ''));
    if (course.accessRule === 'Invitation' && !progressMap[course._id] && !isInvited) {
      return { label: 'Invitation Only', icon: <HiOutlineMail className="w-4 h-4" />, variant: 'btn-secondary' };
    }
    if (course.accessRule === 'Paid' && !progressMap[course._id]) {
      return { label: `$${course.price}`, icon: <HiOutlineShoppingCart className="w-4 h-4" />, variant: 'btn-primary' };
    }
    const progress = progressMap[course._id];
    if (!progress) {
      return { label: 'Start', icon: <HiOutlinePlay className="w-4 h-4" />, variant: 'btn-primary' };
    }
    if (progress.progressPercent >= 100 || progress.status === 'Completed') {
      return { label: 'Completed', icon: <HiOutlineCheckCircle className="w-4 h-4" />, variant: 'btn-success', disabled: true };
    }
    if (progress.progressPercent > 0) {
      return { label: `${progress.progressPercent}%`, icon: <HiOutlinePlay className="w-4 h-4" />, variant: 'btn-primary' };
    }
    return { label: 'Start', icon: <HiOutlinePlay className="w-4 h-4" />, variant: 'btn-primary' };
  };

  const currentUser = isAuthenticated ? JSON.parse(localStorage.getItem('learnova_user') || 'null') : null;

  if (loading) return <LoadingSpinner size="lg" text="Loading courses..." />;

  return (
    <div>
      {/* Page Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Explore Courses</h1>
              <p className="text-gray-500 mt-1">{courses.length} courses available to start your learning journey</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-72">
                <SearchBar value={search} onChange={setSearch} placeholder="Search courses..." />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-container">
        {/* Toolbar: Tags + Sort + View Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          {/* Tag pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <HiOutlineFilter className="w-4 h-4 text-gray-400 flex-shrink-0" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  activeTag === tag
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Sort & View */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
            <div className="flex items-center bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <HiOutlineViewGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <HiOutlineViewList className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 mb-5">
          Showing <span className="font-semibold text-gray-800">{filtered.length}</span> {filtered.length === 1 ? 'course' : 'courses'}
          {activeTag !== 'All' && <> in <span className="font-semibold text-indigo-600">{activeTag}</span></>}
        </p>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course, i) => {
              const btn = getButtonContent(course);
              const progress = progressMap[course._id];
              return (
                <div
                  key={course._id}
                  className="card overflow-hidden group cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onClick={() => handleCourseAction(course)}
                >
                  <div className="relative h-44 bg-gradient-to-br from-indigo-100 to-purple-100 overflow-hidden">
                    {course.image ? (
                      <img src={resolveMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiOutlineAcademicCap className="w-16 h-16 text-indigo-200" />
                      </div>
                    )}
                    {course.accessRule === 'Paid' && course.price && (
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow">
                        <span className="font-bold text-indigo-600">${course.price}</span>
                      </div>
                    )}
                    {/* Progress overlay bar */}
                    {progress && progress.progressPercent > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
                        <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress.progressPercent}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {course.tags?.slice(0, 3).map((tag, j) => (
                        <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                      ))}
                      <Badge variant="gray" size="xs">{course.visibility === 'SignedIn' ? 'Signed In' : 'Everyone'}</Badge>
                      <Badge variant={course.accessRule === 'Invitation' ? 'warning' : 'info'} size="xs">
                        {course.accessRule === 'Invitation' ? 'Invitation' : course.accessRule}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                      {truncateText(course.description, 100)}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <HiOutlineBookOpen className="w-3.5 h-3.5" />
                        {course.lessons?.length || 0} lessons
                      </span>
                      <span className="flex items-center gap-1">
                        <HiOutlinePuzzle className="w-3.5 h-3.5" />
                        {course.quizzes?.length || 0} quizzes
                      </span>
                      {course.averageRating && (
                        <span className="flex items-center gap-1">
                          <HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />
                          {course.averageRating}
                        </span>
                      )}
                    </div>
                    <button
                      className={`w-full ${btn.variant} text-sm py-2.5 flex items-center justify-center gap-2`}
                      disabled={btn.disabled}
                    >
                      {btn.label} {btn.icon}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {filtered.map((course, i) => {
              const btn = getButtonContent(course);
              const progress = progressMap[course._id];
              return (
                <div
                  key={course._id}
                  className="card overflow-hidden group cursor-pointer animate-slide-up"
                  style={{ animationDelay: `${i * 0.03}s` }}
                  onClick={() => handleCourseAction(course)}
                >
                  <div className="flex flex-col sm:flex-row">
                    <div className="sm:w-56 h-36 sm:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 relative overflow-hidden">
                      {course.image ? (
                        <img src={resolveMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <HiOutlineAcademicCap className="w-12 h-12 text-indigo-200" />
                        </div>
                      )}
                      {progress && progress.progressPercent > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200/50">
                          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress.progressPercent}%` }} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {course.tags?.slice(0, 4).map((tag, j) => (
                            <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                          ))}
                          <Badge variant="gray" size="xs">{course.visibility === 'SignedIn' ? 'Signed In' : 'Everyone'}</Badge>
                          <Badge variant={course.accessRule === 'Invitation' ? 'warning' : 'info'} size="xs">
                            {course.accessRule === 'Invitation' ? 'Invitation' : course.accessRule}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-gray-800 mb-1 group-hover:text-indigo-600 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-1">
                          {truncateText(course.description, 200)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><HiOutlineBookOpen className="w-3.5 h-3.5" />{course.lessons?.length || 0} lessons</span>
                          <span className="flex items-center gap-1"><HiOutlinePuzzle className="w-3.5 h-3.5" />{course.quizzes?.length || 0} quizzes</span>
                          {course.averageRating && (
                            <span className="flex items-center gap-1"><HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />{course.averageRating}</span>
                          )}
                          {course.attendees?.length > 0 && (
                            <span className="flex items-center gap-1"><HiOutlineUsers className="w-3.5 h-3.5" />{course.attendees.length} enrolled</span>
                          )}
                        </div>
                        <button
                          className={`${btn.variant} text-sm py-2 px-5 flex items-center gap-2 flex-shrink-0`}
                          disabled={btn.disabled}
                        >
                          {btn.label} {btn.icon}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm mt-1">
              {activeTag !== 'All' ? (
                <>No courses match the filter "<span className="font-medium">{activeTag}</span>". <button onClick={() => setActiveTag('All')} className="text-indigo-500 hover:text-indigo-600 font-medium">Clear filter</button></>
              ) : (
                'Try a different search term'
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
