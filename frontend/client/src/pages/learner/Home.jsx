import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resolveMediaUrl, truncateText, getBadgeForPoints } from '../../utils/helpers';
import { BADGE_LEVELS } from '../../utils/constants';
import {
  HiOutlineAcademicCap,
  HiOutlineBookOpen,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlinePlay,
  HiOutlinePuzzle,
  HiOutlineLightningBolt,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineGlobeAlt,
  HiOutlineShieldCheck,
  HiOutlineUsers,
} from 'react-icons/hi';

const Home = () => {
  const { courses, fetchPublishedCourses, loading } = useCourseStore();
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    fetchPublishedCourses();
  }, []);

  // Auto-rotate feature cards
  useEffect(() => {
    const interval = setInterval(() => setActiveFeature((p) => (p + 1) % 3), 4000);
    return () => clearInterval(interval);
  }, []);

  const featuredCourses = courses.slice(0, 6);
  const topRated = [...courses].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 3);

  const stats = [
    { value: courses.length || '20', suffix: '+', label: 'Active Courses', icon: HiOutlineBookOpen, color: 'from-indigo-500 to-blue-500' },
    { value: courses.reduce((sum, c) => sum + (c.attendees?.length || 0), 0) || '50', suffix: '+', label: 'Active Learners', icon: HiOutlineUsers, color: 'from-purple-500 to-pink-500' },
    { value: courses.reduce((sum, c) => sum + (c.quizzes?.length || 0), 0) || '30', suffix: '+', label: 'Quizzes', icon: HiOutlinePuzzle, color: 'from-amber-500 to-orange-500' },
    { value: BADGE_LEVELS.length, suffix: '', label: 'Badge Levels', icon: HiOutlineStar, color: 'from-emerald-500 to-teal-500' },
  ];

  const features = [
    {
      icon: HiOutlineLightningBolt,
      title: 'Interactive Learning',
      desc: 'Learn through videos, documents, images, and hands-on quizzes at your own pace.',
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
    },
    {
      icon: HiOutlineTrendingUp,
      title: 'Track Progress',
      desc: 'See your learning journey with real-time progress tracking across all courses.',
      gradient: 'from-blue-500 to-cyan-500',
      bg: 'bg-blue-50',
    },
    {
      icon: HiOutlineSparkles,
      title: 'Earn Rewards',
      desc: 'Collect points from quizzes and unlock badges as you level up your knowledge.',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-purple-50',
    },
  ];

  const howItWorks = [
    { step: '01', title: 'Browse & Enroll', desc: 'Find the perfect course from our catalog and enroll instantly.', icon: HiOutlineGlobeAlt },
    { step: '02', title: 'Learn at Your Pace', desc: 'Watch videos, read documents, and study images in a full-screen player.', icon: HiOutlinePlay },
    { step: '03', title: 'Take Quizzes', desc: 'Test your knowledge with quizzes — one question per page for focus.', icon: HiOutlinePuzzle },
    { step: '04', title: 'Earn & Level Up', desc: 'Earn points based on your attempt, collect badges, and complete courses.', icon: HiOutlineShieldCheck },
  ];

  if (loading && courses.length === 0) return <LoadingSpinner size="lg" text="Loading..." />;

  return (
    <div>
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 gradient-primary">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-indigo-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-float" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div className="text-white animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium mb-6">
                <HiOutlineSparkles className="w-4 h-4 text-yellow-300" />
                <span>Gamified Learning Platform</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
                Learn. Grow.{' '}
                <span className="relative">
                  <span className="text-yellow-300">Level Up.</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 2 150 2 198 8" stroke="#fde047" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </span>
              </h1>
              <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                Master new skills with interactive video lessons, earn points through quizzes, 
                collect badges, and track your progress — all in one platform.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold py-3.5 px-8 rounded-xl shadow-xl shadow-black/10 hover:shadow-2xl hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-300"
                >
                  Explore Courses <HiOutlineArrowRight className="w-5 h-5" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 text-white font-semibold py-3.5 px-8 rounded-xl border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
                  >
                    Get Started Free
                  </Link>
                )}
              </div>
            </div>

            {/* Right: Feature cards */}
            <div className="hidden lg:block animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {features.map((f, i) => (
                  <div
                    key={i}
                    onClick={() => setActiveFeature(i)}
                    className={`relative flex items-start gap-4 p-5 rounded-2xl cursor-pointer transition-all duration-500 mb-4 ${
                      activeFeature === i
                        ? 'bg-white/15 backdrop-blur-xl border border-white/20 shadow-2xl scale-[1.02]'
                        : 'bg-white/5 border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-base mb-1">{f.title}</h3>
                      <p className={`text-sm leading-relaxed transition-all duration-300 ${activeFeature === i ? 'text-white/80' : 'text-white/50'}`}>
                        {f.desc}
                      </p>
                    </div>
                    {activeFeature === i && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-yellow-300 rounded-full" />
                    )}
                  </div>
                ))}
                {/* Dots indicator */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  {features.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveFeature(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        activeFeature === i ? 'w-8 bg-yellow-300' : 'w-3 bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section className="relative -mt-8 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="card-elevated p-5 text-center animate-slide-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value}{stat.suffix}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURED COURSES ==================== */}
      <section className="page-container pt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <Badge variant="primary" size="sm">Featured</Badge>
            <h2 className="text-2xl font-bold text-gray-900 mt-2">Popular Courses</h2>
            <p className="text-gray-500 text-sm mt-1">Hand-picked courses to kickstart your learning</p>
          </div>
          <Link to="/courses" className="text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:gap-2 transition-all">
            View all <HiOutlineArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course, i) => (
            <div
              key={course._id}
              className="card overflow-hidden group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => navigate(`/courses/${course._id}`)}
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
                {course.accessRule !== 'Paid' && (
                  <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow">
                    <span className="font-bold text-white text-xs">FREE</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {course.tags?.slice(0, 3).map((tag, j) => (
                    <Badge key={j} variant="primary" size="xs">{tag}</Badge>
                  ))}
                </div>
                <h3 className="font-bold text-gray-800 mb-1.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {truncateText(course.description, 90)}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><HiOutlineBookOpen className="w-3.5 h-3.5" />{course.lessons?.length || 0}</span>
                    <span className="flex items-center gap-1"><HiOutlinePuzzle className="w-3.5 h-3.5" />{course.quizzes?.length || 0}</span>
                    {course.averageRating ? (
                      <span className="flex items-center gap-1"><HiOutlineStar className="w-3.5 h-3.5 text-amber-400" />{course.averageRating}</span>
                    ) : null}
                  </div>
                  <span className="text-indigo-500 group-hover:translate-x-1 transition-transform">
                    <HiOutlineArrowRight className="w-5 h-5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className="page-container pt-16">
        <div className="text-center mb-12">
          <Badge variant="primary" size="sm">How It Works</Badge>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">Start Learning in 4 Steps</h2>
          <p className="text-gray-500 text-sm mt-1 max-w-lg mx-auto">From enrollment to certification — here's your learning journey</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {howItWorks.map((item, i) => (
            <div key={i} className="relative text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              {/* Connector line */}
              {i < 3 && (
                <div className="hidden lg:block absolute top-8 left-[calc(50%+40px)] w-[calc(100%-80px)] h-px bg-gradient-to-r from-indigo-200 to-purple-200" />
              )}
              <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary mb-4 shadow-lg shadow-indigo-500/25">
                <item.icon className="w-7 h-7 text-white" />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400 text-[10px] font-bold text-gray-900 flex items-center justify-center shadow">
                  {item.step}
                </span>
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== GAMIFICATION SHOWCASE ==================== */}
      <section className="page-container pt-16 pb-8">
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 p-8 lg:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="animate-slide-up">
              <Badge variant="warning" size="sm">🏆 Gamification</Badge>
              <h2 className="text-2xl font-bold text-white mt-3 mb-3">Level Up as You Learn</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Every quiz you complete earns you points — more for your first attempt! Collect enough points
                to unlock badges and climb the ranks from Newbie to Master.
              </p>
              <div className="space-y-3">
                {[
                  { label: '1st Attempt', points: '100 pts', color: 'bg-emerald-500' },
                  { label: '2nd Attempt', points: '75 pts', color: 'bg-blue-500' },
                  { label: '3rd Attempt', points: '50 pts', color: 'bg-amber-500' },
                  { label: '4th+ Attempt', points: '25 pts', color: 'bg-gray-500' },
                ].map((r, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${r.color}`} />
                    <span className="text-sm text-gray-300 flex-1">{r.label}</span>
                    <span className="text-sm font-bold text-white">{r.points}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
              <div className="grid grid-cols-3 gap-3">
                {BADGE_LEVELS.map((badge, i) => (
                  <div
                    key={i}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 text-center hover:bg-white/10 transition-all duration-300 hover:scale-105"
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-white font-bold text-sm">{badge.name}</p>
                    <p className="text-gray-500 text-xs">{badge.points} pts</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      {!isAuthenticated && (
        <section className="page-container pb-16">
          <div className="text-center rounded-3xl gradient-primary py-16 px-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white mb-3 animate-slide-up">Ready to Start Learning?</h2>
              <p className="text-white/70 max-w-md mx-auto mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                Join our community of learners. Create your free account and start building new skills today.
              </p>
              <div className="flex items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 bg-white text-indigo-600 font-bold py-3.5 px-8 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                >
                  Create Free Account <HiOutlineArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== LOGGED-IN USER CTA ==================== */}
      {isAuthenticated && (
        <section className="page-container pb-16">
          <div className="text-center rounded-3xl bg-gradient-to-r from-indigo-50 to-purple-50 py-12 px-8 border border-indigo-100/50">
            <div className="text-4xl mb-3">{getBadgeForPoints(user?.points || 0).icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name?.split(' ')[0]}!
            </h2>
            <p className="text-gray-500 mb-6">You have <span className="font-bold text-indigo-600">{user?.points || 0} points</span>. Keep learning to level up!</p>
            <div className="flex items-center justify-center gap-4">
              <Link to="/my-courses" className="btn-primary flex items-center gap-2">
                My Courses <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/courses" className="btn-secondary flex items-center gap-2">
                Browse More
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
