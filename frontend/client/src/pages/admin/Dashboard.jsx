import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
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
} from 'react-icons/hi';

const Dashboard = () => {
  const { courses, fetchCourses, createCourse, deleteCourse, loading } = useCourseStore();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'list'
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
    { label: 'Total Courses', value: courses.length, icon: HiOutlineBookOpen, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Published', value: publishedCourses.length, icon: HiOutlineEye, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Draft', value: draftCourses.length, icon: HiOutlineClock, color: 'bg-amber-50 text-amber-600' },
    { label: 'Total Learners', value: courses.reduce((sum, c) => sum + (c.attendees?.length || 0), 0), icon: HiOutlineUsers, color: 'bg-purple-50 text-purple-600' },
  ];

  const CourseCard = ({ course }) => (
    <div className="card p-4 hover:shadow-lg group animate-fade-in">
      {/* Image */}
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

      {/* Info */}
      <h3 className="font-bold text-gray-800 mb-1.5 line-clamp-1">{course.title}</h3>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {course.tags?.slice(0, 3).map((tag, i) => (
          <Badge key={i} variant="gray" size="xs">{tag}</Badge>
        ))}
      </div>

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
        <span className="flex items-center gap-1">
          <HiOutlineEye className="w-3.5 h-3.5" />
          {course.views || 0} views
        </span>
        <span className="flex items-center gap-1">
          <HiOutlineBookOpen className="w-3.5 h-3.5" />
          {course.lessons?.length || 0} lessons
        </span>
        <span className="flex items-center gap-1">
          <HiOutlineClock className="w-3.5 h-3.5" />
          {formatDuration(course.durationMinutes)}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <Link
          to={`/admin/courses/${course._id}`}
          className="flex-1 btn-primary text-xs py-2 text-center"
        >
          <HiOutlinePencil className="w-3.5 h-3.5 inline mr-1" />
          Edit
        </Link>
        <button onClick={() => handleShare(course)} className="btn-secondary text-xs py-2 px-3">
          <HiOutlineShare className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setDeleteId(course._id)} className="text-xs py-2 px-3 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
          <HiOutlineTrash className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  if (loading && courses.length === 0) return <LoadingSpinner size="lg" text="Loading courses..." />;

  return (
    <div className="page-container">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="card p-5 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Courses</h1>
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

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Draft Column */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-gray-300">
              <span className="font-bold text-gray-700">Draft</span>
              <Badge variant="gray">{draftCourses.length}</Badge>
            </div>
            <div className="space-y-4">
              {draftCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              {draftCourses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No draft courses</p>
              )}
            </div>
          </div>

          {/* Published Column */}
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-emerald-400">
              <span className="font-bold text-gray-700">Published</span>
              <Badge variant="success">{publishedCourses.length}</Badge>
            </div>
            <div className="space-y-4">
              {publishedCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
              {publishedCourses.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">No published courses</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">#</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Course</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Tags</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Lessons</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Duration</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Views</th>
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
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
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
                      {course.tags?.slice(0, 2).map((t, j) => (
                        <Badge key={j} variant="gray" size="xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.lessons?.length || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDuration(course.durationMinutes)}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.views || 0}</td>
                  <td className="px-6 py-4">
                    <Badge variant={course.published ? 'success' : 'gray'}>
                      {course.published ? 'Published' : 'Draft'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/courses/${course._id}`} className="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-indigo-600">
                        <HiOutlinePencil className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleShare(course)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500">
                        <HiOutlineShare className="w-4 h-4" />
                      </button>
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

      {/* Create Course Modal */}
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

      {/* Delete Confirm */}
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
