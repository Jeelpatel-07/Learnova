import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resolveMediaUrl, truncateText } from '../../utils/helpers';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineClock,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlinePlay,
  HiOutlineShoppingCart,
} from 'react-icons/hi';

const Home = () => {
  const { courses, fetchPublishedCourses, loading } = useCourseStore();
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPublishedCourses();
  }, []);

  const filtered = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCourseAction = (course) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/courses/${course._id}`);
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading courses..." />;

  return (
    <div>
      {/* Hero Section */}
      <div className="gradient-primary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 animate-slide-up">
            Learn. Grow. <span className="text-yellow-300">Level Up.</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Explore courses, earn points, collect badges, and master new skills with Learnova's gamified learning platform.
          </p>
          <div className="max-w-md mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search for courses..." />
          </div>

          <div className="flex items-center justify-center gap-8 mt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {[
              { icon: '📚', label: `${courses.length}+ Courses` },
              { icon: '🏆', label: 'Earn Badges' },
              { icon: '🎯', label: 'Track Progress' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-2 text-white/80">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-sm font-medium">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">All Courses</h2>
            <p className="text-sm text-gray-500">{filtered.length} courses available</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((course, i) => (
            <div
              key={course._id}
              className="card overflow-hidden group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => handleCourseAction(course)}
            >
              {/* Image */}
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
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {course.tags?.slice(0, 3).map((tag, j) => (
                    <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                  ))}
                </div>

                <h3 className="font-bold text-gray-800 mb-1.5 group-hover:text-indigo-600 transition-colors">
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
                    <HiOutlineClock className="w-3.5 h-3.5" />
                    {course.quizzes?.length || 0} quizzes
                  </span>
                  {course.averageRating && (
                    <span className="flex items-center gap-1">
                      <HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />
                      {course.averageRating}
                    </span>
                  )}
                </div>

                <button className="w-full btn-primary text-sm py-2.5 flex items-center justify-center gap-2">
                  {!isAuthenticated ? (
                    <>Join Course <HiOutlineArrowRight className="w-4 h-4" /></>
                  ) : course.accessRule === 'Paid' ? (
                    <>Buy Course <HiOutlineShoppingCart className="w-4 h-4" /></>
                  ) : (
                    <>Start Learning <HiOutlinePlay className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <HiOutlineBookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No courses found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
