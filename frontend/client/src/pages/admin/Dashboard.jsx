import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import useAuthStore from '../../store/authStore';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDuration, resolveMediaUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  HiOutlinePlus,
  HiOutlineViewGrid,
  HiOutlineViewList,
  HiOutlinePencil,
  HiOutlineShare,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineAcademicCap,
  HiOutlineUsers,
  HiOutlineChartBar,
  HiOutlineTrash,
  HiOutlinePuzzle,
  HiOutlinePhotograph,
  HiOutlineDocumentText,
  HiOutlineVideoCamera,
  HiOutlineTrendingUp,
  HiOutlineArrowRight,
  HiOutlineStar,
  HiOutlineLightningBolt,
} from 'react-icons/hi';

/* ─────────────── SVG Donut Chart Component ─────────────── */
const DonutChart = ({ data, size = 160 }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
        {data.map((segment, i) => {
          const segmentLength = total ? (segment.value / total) * circumference : 0;
          const gap = data.filter((d) => d.value > 0).length > 1 ? 4 : 0;
          const dashArray = `${Math.max(segmentLength - gap, 0)} ${circumference}`;
          const currentOffset = offset;
          offset += segmentLength;
          return (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth="18"
              strokeDasharray={dashArray}
              strokeDashoffset={-currentOffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-gray-800">{total}</span>
        <span className="text-xs text-gray-400">Total</span>
      </div>
    </div>
  );
};

/* ─────────────── Horizontal Bar Component ─────────────── */
const HorizontalBar = ({ label, value, max, color, icon: Icon }) => {
  const percent = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      {Icon && (
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color.replace('bg-', 'bg-').replace('500', '50')}`}>
          <Icon className={`w-4 h-4 ${color.replace('bg-', 'text-')}`} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-700 font-medium truncate">{label}</span>
          <span className="text-sm font-bold text-gray-800 ml-2">{value}</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
};

/* ─────────────── Mini Sparkline Chart (CSS) ─────────────── */
const SparklineBar = ({ values, color = 'bg-indigo-400' }) => {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-12">
      {values.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t ${color} transition-all duration-500 opacity-60 hover:opacity-100`}
          style={{ height: `${(v / max) * 100}%`, animationDelay: `${i * 0.05}s` }}
          title={`${v}`}
        />
      ))}
    </div>
  );
};

/* ─────────────── Main Dashboard ─────────────── */
const Dashboard = () => {
  const { courses, fetchCourses, createCourse, deleteCourse, loading } = useCourseStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban');
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const filteredCourses = courses.filter((c) =>
    c.title?.toLowerCase().includes(search.toLowerCase())
  );
  const publishedCourses = filteredCourses.filter((c) => c.published);
  const draftCourses = filteredCourses.filter((c) => !c.published);

  // ─── Analytics Data ───
  const analytics = useMemo(() => {
    const totalLearners = courses.reduce((sum, c) => sum + (c.attendees?.length || 0), 0);
    const totalLessons = courses.reduce((sum, c) => sum + (c.lessons?.length || 0), 0);
    const totalQuizzes = courses.reduce((sum, c) => sum + (c.quizzes?.length || 0), 0);

    // Content type breakdown
    let videoCount = 0, docCount = 0, imageCount = 0;
    courses.forEach((c) => {
      c.lessons?.forEach((l) => {
        if (l.type === 'Video') videoCount++;
        else if (l.type === 'Document') docCount++;
        else if (l.type === 'Image') imageCount++;
      });
    });

    // Enrollment counts per course (top 5)
    const topCourses = [...courses]
      .sort((a, b) => (b.attendees?.length || 0) - (a.attendees?.length || 0))
      .slice(0, 5);

    // Lessons per course for sparkline
    const lessonsPerCourse = courses.slice(0, 12).map((c) => c.lessons?.length || 0);

    // Recent courses (last 5 created)
    const recentCourses = [...courses].slice(-5).reverse();

    return {
      totalLearners, totalLessons, totalQuizzes,
      videoCount, docCount, imageCount,
      topCourses, lessonsPerCourse, recentCourses,
    };
  }, [courses]);

  const publishedCount = courses.filter((c) => c.published).length;
  const draftCount = courses.filter((c) => !c.published).length;

  const handleCreate = async () => {
    if (!newCourseName.trim()) return;
    try {
      const course = await createCourse({ title: newCourseName });
      setNewCourseName('');
      setShowCreateModal(false);
      toast.success('Course created! 🎉');
      navigate(`/admin/courses/${course._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to create course');
    }
  };

  const handleShare = (course) => {
    const url = `${window.location.origin}/courses/${course._id}`;
    navigator.clipboard.writeText(url);
    toast.success('Course link copied! 📋');
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCourse(deleteId);
      toast.success('Course deleted');
      setDeleteId(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete course');
    }
  };

  const stats = [
    { label: 'Total Courses', value: courses.length, icon: HiOutlineBookOpen, gradient: 'from-indigo-500 to-blue-500', change: `${publishedCount} published` },
    { label: 'Published', value: publishedCount, icon: HiOutlineEye, gradient: 'from-emerald-500 to-teal-500', change: `${draftCount} in draft` },
    { label: 'Total Learners', value: analytics.totalLearners, icon: HiOutlineUsers, gradient: 'from-purple-500 to-pink-500', change: `across ${courses.length} courses` },
    { label: 'Total Content', value: analytics.totalLessons + analytics.totalQuizzes, icon: HiOutlineLightningBolt, gradient: 'from-amber-500 to-orange-500', change: `${analytics.totalLessons} lessons, ${analytics.totalQuizzes} quizzes` },
  ];

  const CourseCard = ({ course }) => (
    <div className="card p-4 hover:shadow-lg group animate-fade-in">
      <div className="relative mb-3 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100 h-36">
        {course.image ? (
          <img src={resolveMediaUrl(course.image)} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <HiOutlineAcademicCap className="w-12 h-12 text-indigo-300" />
          </div>
        )}
        {course.published && (
          <div className="absolute top-2 right-2">
            <Badge variant="success">Published</Badge>
          </div>
        )}
      </div>
      <h3 className="font-bold text-gray-800 mb-1.5 line-clamp-1">{course.title}</h3>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {course.tags?.slice(0, 3).map((tag, i) => (
          <Badge key={i} variant="gray" size="xs">{tag}</Badge>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1"><HiOutlineBookOpen className="w-3.5 h-3.5" />{course.lessons?.length || 0} lessons</span>
        <span className="flex items-center gap-1"><HiOutlineUsers className="w-3.5 h-3.5" />{course.attendees?.length || 0} learners</span>
      </div>
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link to={`/admin/courses/${course._id}`} className="flex-1 btn-primary text-xs py-2 text-center">
          <HiOutlinePencil className="w-3.5 h-3.5 inline mr-1" />Edit
        </Link>
        <button onClick={() => handleShare(course)} className="btn-secondary text-xs py-2 px-3"><HiOutlineShare className="w-3.5 h-3.5" /></button>
        <button onClick={() => setDeleteId(course._id)} className="text-xs py-2 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
          <HiOutlineTrash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (loading && courses.length === 0) return <LoadingSpinner size="lg" text="Loading courses..." />;

  return (
    <div className="page-container">
      {/* ==================== WELCOME HEADER ==================== */}
      <div className="mb-8 animate-slide-up">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, <span className="text-gradient">{user?.name?.split(' ')[0] || 'Admin'}</span> 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's what's happening with your courses today.</p>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="card-elevated p-5 animate-slide-up group hover:scale-[1.02] transition-transform" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-800">{stat.value}</p>
            <p className="text-xs font-medium text-gray-500 mt-0.5">{stat.label}</p>
            <p className="text-[11px] text-gray-400 mt-1">{stat.change}</p>
          </div>
        ))}
      </div>

      {/* ==================== ANALYTICS ROW ==================== */}
      <div className="grid lg:grid-cols-3 gap-6 mb-8">

        {/* ── Chart 1: Course Status Donut ── */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineChartBar className="w-5 h-5 text-indigo-500" />
              Course Status
            </h3>
          </div>
          <div className="flex items-center justify-center mb-5">
            <DonutChart
              data={[
                { value: publishedCount, color: '#10b981' },
                { value: draftCount, color: '#e2e8f0' },
              ]}
            />
          </div>
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-sm text-gray-600">Published ({publishedCount})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-sm text-gray-600">Draft ({draftCount})</span>
            </div>
          </div>
        </div>

        {/* ── Chart 2: Content Breakdown ── */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineTrendingUp className="w-5 h-5 text-indigo-500" />
              Content Breakdown
            </h3>
          </div>
          <div className="space-y-4">
            <HorizontalBar label="Video Lessons" value={analytics.videoCount} max={analytics.totalLessons || 1} color="bg-indigo-500" icon={HiOutlineVideoCamera} />
            <HorizontalBar label="Documents" value={analytics.docCount} max={analytics.totalLessons || 1} color="bg-emerald-500" icon={HiOutlineDocumentText} />
            <HorizontalBar label="Images" value={analytics.imageCount} max={analytics.totalLessons || 1} color="bg-amber-500" icon={HiOutlinePhotograph} />
            <HorizontalBar label="Quizzes" value={analytics.totalQuizzes} max={analytics.totalLessons || 1} color="bg-purple-500" icon={HiOutlinePuzzle} />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-400">Total content items</span>
            <span className="font-bold text-gray-700">{analytics.totalLessons + analytics.totalQuizzes}</span>
          </div>
        </div>

        {/* ── Chart 3: Top Courses by Enrollment ── */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineStar className="w-5 h-5 text-indigo-500" />
              Top Courses
            </h3>
            <Link to="/admin/reporting" className="text-xs text-indigo-500 font-medium flex items-center gap-1 hover:text-indigo-600">
              Report <HiOutlineArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {analytics.topCourses.length > 0 ? (
            <div className="space-y-3">
              {analytics.topCourses.map((course, i) => (
                <div key={course._id} className="flex items-center gap-3 group/item cursor-pointer" onClick={() => navigate(`/admin/courses/${course._id}`)}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-600' :
                    i === 1 ? 'bg-gray-100 text-gray-600' :
                    i === 2 ? 'bg-orange-100 text-orange-600' :
                    'bg-gray-50 text-gray-400'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate group-hover/item:text-indigo-600 transition-colors">{course.title}</p>
                    <p className="text-xs text-gray-400">{course.lessons?.length || 0} lessons</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{course.attendees?.length || 0}</p>
                    <p className="text-[10px] text-gray-400">learners</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">No enrolled learners yet</div>
          )}
        </div>
      </div>

      {/* ==================== SECONDARY ANALYTICS ROW ==================== */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* ── Lessons per Course Sparkline ── */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineBookOpen className="w-5 h-5 text-indigo-500" />
              Lessons per Course
            </h3>
            <span className="text-xs text-gray-400">{courses.length > 12 ? 'Last 12 courses' : 'All courses'}</span>
          </div>
          {analytics.lessonsPerCourse.length > 0 ? (
            <>
              <SparklineBar values={analytics.lessonsPerCourse} color="bg-indigo-400" />
              <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                <span>Avg: {analytics.totalLessons ? Math.round(analytics.totalLessons / courses.length) : 0} lessons/course</span>
                <span>Max: {Math.max(...analytics.lessonsPerCourse)} lessons</span>
              </div>
            </>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">No course data</div>
          )}
        </div>

        {/* ── Recent Courses Activity ── */}
        <div className="card-elevated p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <HiOutlineClock className="w-5 h-5 text-indigo-500" />
              Recent Courses
            </h3>
          </div>
          {analytics.recentCourses.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentCourses.map((course) => (
                <div
                  key={course._id}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/courses/${course._id}`)}
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {course.image ? (
                      <img src={resolveMediaUrl(course.image)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <HiOutlineAcademicCap className="w-5 h-5 text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-700 truncate">{course.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span>{course.lessons?.length || 0} lessons</span>
                      <span>{course.attendees?.length || 0} learners</span>
                    </div>
                  </div>
                  <Badge variant={course.published ? 'success' : 'gray'} size="xs">
                    {course.published ? 'Live' : 'Draft'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400 text-sm">No courses yet</div>
          )}
        </div>
      </div>

      {/* ==================== COURSES HEADER ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">All Courses</h2>
          <p className="text-sm text-gray-500">{courses.length} courses total</p>
        </div>
        <div className="flex items-center gap-3">
          <SearchBar value={search} onChange={setSearch} placeholder="Search courses..." />
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              <HiOutlineViewGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              <HiOutlineViewList className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <HiOutlinePlus className="w-4 h-4" />
            <span className="hidden sm:inline">New Course</span>
          </button>
        </div>
      </div>

      {/* ==================== KANBAN VIEW ==================== */}
      {viewMode === 'kanban' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-300">
              <span className="font-bold text-gray-700">Draft</span>
              <Badge variant="gray">{draftCourses.length}</Badge>
            </div>
            <div className="space-y-4">
              {draftCourses.map((course) => (<CourseCard key={course._id} course={course} />))}
              {draftCourses.length === 0 && (<p className="text-sm text-gray-400 text-center py-8">No draft courses</p>)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-emerald-400">
              <span className="font-bold text-gray-700">Published</span>
              <Badge variant="success">{publishedCourses.length}</Badge>
            </div>
            <div className="space-y-4">
              {publishedCourses.map((course) => (<CourseCard key={course._id} course={course} />))}
              {publishedCourses.length === 0 && (<p className="text-sm text-gray-400 text-center py-8">No published courses</p>)}
            </div>
          </div>
        </div>
      )}

      {/* ==================== LIST VIEW ==================== */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">#</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Tags</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Lessons</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Learners</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course, i) => (
                <tr key={course._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {course.image ? (
                          <img src={resolveMediaUrl(course.image)} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <HiOutlineAcademicCap className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{course.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      {course.tags?.slice(0, 2).map((t, j) => (<Badge key={j} variant="gray" size="xs">{t}</Badge>))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.lessons?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.attendees?.length || 0}</td>
                  <td className="px-6 py-4">
                    <Badge variant={course.published ? 'success' : 'gray'}>{course.published ? 'Published' : 'Draft'}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/courses/${course._id}`} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600"><HiOutlinePencil className="w-4 h-4" /></Link>
                      <button onClick={() => handleShare(course)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"><HiOutlineShare className="w-4 h-4" /></button>
                      <button onClick={() => setDeleteId(course._id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"><HiOutlineTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <HiOutlineBookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No courses found</p>
            </div>
          )}
        </div>
      )}

      {/* ==================== MODALS ==================== */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Course" size="sm">
        <div className="space-y-4">
          <div>
            <label className="input-label">Course Name</label>
            <input
              type="text"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              placeholder="Enter course name"
              className="input-field"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleCreate} className="btn-primary" disabled={!newCourseName.trim()}>
              Create Course
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Course"
        message="Are you sure you want to delete this course? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
};

export default Dashboard;
