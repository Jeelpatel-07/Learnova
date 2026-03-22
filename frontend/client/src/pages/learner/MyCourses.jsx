import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import ProgressBar from '../../components/common/ProgressBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getBadgeForPoints, getNextBadge, resolveMediaUrl, truncateText, getInitials } from '../../utils/helpers';
import { BADGE_LEVELS } from '../../utils/constants';
import {
  HiOutlineAcademicCap,
  HiOutlinePlay,
  HiOutlineBookOpen,
  HiOutlineTrendingUp,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlinePuzzle,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlineSparkles,
  HiOutlineChartBar,
  HiOutlineLightningBolt,
} from 'react-icons/hi';

const MyCourses = () => {
  const { myCourses, fetchMyCourses, loading } = useCourseStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchMyCourses();
  }, []);

  const currentBadge = getBadgeForPoints(user?.points || 0);
  const nextBadge = getNextBadge(user?.points || 0);
  const progressToNext = nextBadge
    ? ((user?.points || 0) / nextBadge.points) * 100
    : 100;

  // Stats
  const stats = useMemo(() => {
    const inProgress = myCourses.filter((c) => c.progress?.progressPercent > 0 && c.progress?.progressPercent < 100).length;
    const completed = myCourses.filter((c) => c.progress?.progressPercent >= 100 || c.progress?.status === 'Completed').length;
    const notStarted = myCourses.filter((c) => !c.progress?.progressPercent || c.progress?.progressPercent === 0).length;
    return { total: myCourses.length, inProgress, completed, notStarted };
  }, [myCourses]);

  // Filter by tab + search
  const filtered = useMemo(() => {
    let result = myCourses;
    if (activeTab === 'progress') result = result.filter((c) => c.progress?.progressPercent > 0 && c.progress?.progressPercent < 100);
    else if (activeTab === 'completed') result = result.filter((c) => c.progress?.progressPercent >= 100 || c.progress?.status === 'Completed');
    else if (activeTab === 'notstarted') result = result.filter((c) => !c.progress?.progressPercent || c.progress?.progressPercent === 0);
    if (search) result = result.filter((c) => c.title?.toLowerCase().includes(search.toLowerCase()));
    return result;
  }, [myCourses, activeTab, search]);

  const getButtonState = (course) => {
    if (course.progress?.progressPercent >= 100 || course.progress?.status === 'Completed') return { label: 'Completed', variant: 'completed', icon: HiOutlineCheckCircle, path: `/courses/${course._id}` };
    if (course.progress?.progressPercent > 0) return { label: 'Continue Learning', variant: 'continue', icon: HiOutlinePlay, path: `/learn/${course._id}` };
    return { label: 'Start Learning', variant: 'start', icon: HiOutlinePlay, path: `/courses/${course._id}` };
  };

  const tabs = [
    { id: 'all', label: 'All Courses', count: stats.total, icon: HiOutlineBookOpen },
    { id: 'progress', label: 'In Progress', count: stats.inProgress, icon: HiOutlineLightningBolt },
    { id: 'completed', label: 'Completed', count: stats.completed, icon: HiOutlineCheckCircle },
    { id: 'notstarted', label: 'Not Started', count: stats.notStarted, icon: HiOutlineClock },
  ];

  if (loading) return <LoadingSpinner size="lg" text="Loading your courses..." />;

  return (
    <div>
      {/* ==================== PAGE HEADER ==================== */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Learning</h1>
              <p className="text-gray-500 mt-1">Track your progress and continue where you left off</p>
            </div>
            <Link to="/courses" className="btn-primary flex items-center gap-2 w-fit">
              Browse More Courses <HiOutlineArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* ==================== STATS CARDS ==================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Enrolled', value: stats.total, icon: HiOutlineBookOpen, color: 'from-indigo-500 to-blue-500', bg: 'bg-indigo-50', text: 'text-indigo-600' },
              { label: 'In Progress', value: stats.inProgress, icon: HiOutlineLightningBolt, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
              { label: 'Completed', value: stats.completed, icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-teal-500', bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Points Earned', value: user?.points || 0, icon: HiOutlineStar, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-600' },
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-100 p-4 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[1fr_320px] gap-8">
          {/* ==================== MAIN CONTENT ==================== */}
          <div>
            {/* Tabs + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-white text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
              <div className="w-64">
                <SearchBar value={search} onChange={setSearch} placeholder="Search..." />
              </div>
            </div>

            {/* Course List */}
            {filtered.length === 0 ? (
              <div className="card-elevated text-center py-16 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
                  <HiOutlineBookOpen className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">
                  {activeTab === 'all' ? 'No courses yet' : `No ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()} courses`}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {activeTab === 'all' ? 'Start your learning journey today!' : 'Keep learning to see courses here.'}
                </p>
                <Link to="/courses" className="btn-primary inline-flex items-center gap-2">
                  Explore Courses <HiOutlineArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((course, i) => {
                  const btn = getButtonState(course);
                  const percent = course.progress?.progressPercent || 0;
                  const isCompleted = percent >= 100 || course.progress?.status === 'Completed';
                  const completedLessons = course.progress?.completedLessons || 0;
                  const totalLessons = course.lessons?.length || 0;
                  const totalQuizzes = course.quizzes?.length || 0;

                  return (
                    <div
                      key={course._id}
                      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden animate-slide-up cursor-pointer"
                      style={{ animationDelay: `${i * 0.04}s` }}
                      onClick={() => navigate(btn.path)}
                    >
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-52 h-36 sm:h-auto bg-gradient-to-br from-indigo-100 to-purple-100 flex-shrink-0 relative overflow-hidden">
                          {course.image ? (
                            <img src={resolveMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <HiOutlineAcademicCap className="w-12 h-12 text-indigo-200" />
                            </div>
                          )}
                          {/* Status overlay badge */}
                          <div className="absolute top-3 left-3">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold shadow">
                                <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Done
                              </span>
                            ) : percent > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/90 backdrop-blur-sm text-white text-xs font-bold shadow">
                                <HiOutlineLightningBolt className="w-3.5 h-3.5" /> {percent}%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-800/70 backdrop-blur-sm text-white text-xs font-bold shadow">
                                <HiOutlineClock className="w-3.5 h-3.5" /> New
                              </span>
                            )}
                          </div>
                          {/* Progress bar at bottom of image */}
                          {percent > 0 && !isCompleted && (
                            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                              <div className="h-full bg-indigo-400 transition-all duration-500" style={{ width: `${percent}%` }} />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-5 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {course.tags?.slice(0, 3).map((tag, j) => (
                                <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                              ))}
                            </div>
                            <h3 className="font-bold text-gray-800 text-base mb-1 group-hover:text-indigo-600 transition-colors">
                              {course.title}
                            </h3>
                            <p className="text-sm text-gray-500 mb-4 line-clamp-1">
                              {truncateText(course.description, 150)}
                            </p>
                          </div>

                          {/* Bottom row: stats + action */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-5 text-xs text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <HiOutlineBookOpen className="w-4 h-4" />
                                <span><span className="font-semibold text-gray-700">{completedLessons}</span>/{totalLessons} lessons</span>
                              </span>
                              {totalQuizzes > 0 && (
                                <span className="flex items-center gap-1.5">
                                  <HiOutlinePuzzle className="w-4 h-4" />
                                  {totalQuizzes} {totalQuizzes === 1 ? 'quiz' : 'quizzes'}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(btn.path); }}
                              className={`flex items-center gap-2 text-sm font-semibold py-2.5 px-5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                                isCompleted
                                  ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  : 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 hover:shadow-indigo-500/40'
                              }`}
                            >
                              <btn.icon className="w-4 h-4" />
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

          {/* ==================== PROFILE SIDEBAR ==================== */}
          <div className="space-y-5">
            {/* Profile Card */}
            <div className="card-elevated overflow-hidden animate-slide-up">
              {/* Header gradient */}
              <div className="gradient-primary px-6 pt-6 pb-10 text-center relative">
                <div className="absolute inset-0">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                </div>
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-white border-2 border-white/30">
                    {getInitials(user?.name)}
                  </div>
                  <h3 className="font-bold text-white text-lg">{user?.name}</h3>
                  <p className="text-white/60 text-xs">{user?.email}</p>
                </div>
              </div>

              {/* Points card (overlapping) */}
              <div className="px-5 -mt-6 relative z-10">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{currentBadge.icon}</span>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{currentBadge.name}</p>
                        <p className="text-xs text-gray-500">Current Rank</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold text-indigo-600">{user?.points || 0}</p>
                      <p className="text-xs text-gray-400">points</p>
                    </div>
                  </div>
                  {nextBadge && (
                    <>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(progressToNext, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400">{nextBadge.points - (user?.points || 0)} pts to go</span>
                        <span className="text-gray-500 flex items-center gap-1">
                          Next: {nextBadge.icon} {nextBadge.name}
                        </span>
                      </div>
                    </>
                  )}
                  {!nextBadge && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-lg px-3 py-2 mt-1">
                      <HiOutlineSparkles className="w-4 h-4" />
                      <span className="font-medium">Max level reached! 🎉</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge grid */}
              <div className="p-5 pt-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Badge Journey</h4>
                <div className="grid grid-cols-3 gap-2">
                  {BADGE_LEVELS.map((badge, i) => {
                    const unlocked = (user?.points || 0) >= badge.points;
                    return (
                      <div
                        key={badge.name}
                        className={`relative flex flex-col items-center py-3 px-2 rounded-xl transition-all duration-300 ${
                          unlocked
                            ? 'bg-gradient-to-b from-indigo-50 to-purple-50 border border-indigo-100'
                            : 'bg-gray-50 border border-gray-100 opacity-40'
                        }`}
                      >
                        <span className={`text-2xl mb-1 ${unlocked ? '' : 'grayscale'}`}>{badge.icon}</span>
                        <span className="text-[10px] font-bold text-gray-700">{badge.name}</span>
                        <span className="text-[9px] text-gray-400">{badge.points}pts</span>
                        {unlocked && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow">
                            <HiOutlineCheckCircle className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card-elevated p-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <HiOutlineChartBar className="w-5 h-5 text-indigo-500" />
                Learning Stats
              </h4>
              <div className="space-y-3">
                {[
                  { label: 'Courses Enrolled', value: stats.total, bar: 100, color: 'bg-indigo-500' },
                  { label: 'Courses Completed', value: stats.completed, bar: stats.total ? (stats.completed / stats.total) * 100 : 0, color: 'bg-emerald-500' },
                  { label: 'Active Courses', value: stats.inProgress, bar: stats.total ? (stats.inProgress / stats.total) * 100 : 0, color: 'bg-amber-500' },
                ].map((s, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{s.label}</span>
                      <span className="text-xs font-bold text-gray-700">{s.value}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${s.color} rounded-full transition-all duration-500`} style={{ width: `${s.bar}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
