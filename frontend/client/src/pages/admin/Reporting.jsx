import { useState, useEffect } from 'react';
import API from '../../api/axios';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/helpers';
import {
  HiOutlineUsers,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlinePlay,
  HiOutlineAdjustments,
} from 'react-icons/hi';

const Reporting = () => {
  const [stats, setStats] = useState({ total: 0, yetToStart: 0, inProgress: 0, completed: 0 });
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showColumns, setShowColumns] = useState(false);
  const [columns, setColumns] = useState({
    srNo: true, course: true, participant: true, enrolled: true, start: true,
    timeSpent: true, completion: true, completedDate: true, status: true,
  });

  useEffect(() => {
    fetchReporting();
  }, []);

  const fetchReporting = async () => {
    try {
      const res = await API.get('/reporting');
      setStats(res.data.data.stats);
      setProgress(res.data.data.progress);
    } catch (err) {
      // Mock data for demo
      setStats({ total: 24, yetToStart: 5, inProgress: 12, completed: 7 });
      setProgress([
        { id: 1, course: 'React Fundamentals', participant: 'John Doe', enrolledDate: '2024-01-10', startDate: '2024-01-11', timeSpent: '3h 20m', completion: 85, completedDate: null, status: 'in_progress' },
        { id: 2, course: 'Node.js Basics', participant: 'Jane Smith', enrolledDate: '2024-01-08', startDate: '2024-01-09', timeSpent: '5h 10m', completion: 100, completedDate: '2024-01-15', status: 'completed' },
        { id: 3, course: 'Python ML', participant: 'Bob Wilson', enrolledDate: '2024-01-12', startDate: null, timeSpent: '-', completion: 0, completedDate: null, status: 'yet_to_start' },
        { id: 4, course: 'React Fundamentals', participant: 'Alice Brown', enrolledDate: '2024-01-10', startDate: '2024-01-12', timeSpent: '1h 45m', completion: 42, completedDate: null, status: 'in_progress' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const overviewCards = [
    { key: 'all', label: 'Total Participants', value: stats.total, icon: HiOutlineUsers, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-200' },
    { key: 'yet_to_start', label: 'Yet to Start', value: stats.yetToStart, icon: HiOutlineClock, color: 'bg-amber-50 text-amber-600', border: 'border-amber-200' },
    { key: 'in_progress', label: 'In Progress', value: stats.inProgress, icon: HiOutlinePlay, color: 'bg-blue-50 text-blue-600', border: 'border-blue-200' },
    { key: 'completed', label: 'Completed', value: stats.completed, icon: HiOutlineCheckCircle, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-200' },
  ];

  const filteredProgress = progress.filter((p) => {
    if (filter !== 'all' && p.status !== filter) return false;
    if (search && !p.course.toLowerCase().includes(search.toLowerCase()) && !p.participant.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge variant="success">Completed</Badge>;
      case 'in_progress': return <Badge variant="info">In Progress</Badge>;
      case 'yet_to_start': return <Badge variant="warning">Yet to Start</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  if (loading) return <LoadingSpinner size="lg" text="Loading reporting..." />;

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reporting Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Track learner progress across courses</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {overviewCards.map((card, i) => (
          <button
            key={card.key}
            onClick={() => setFilter(card.key)}
            className={`card p-5 text-left transition-all animate-slide-up ${
              filter === card.key ? `ring-2 ring-offset-1 ${card.border}` : ''
            }`}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <SearchBar value={search} onChange={setSearch} placeholder="Search courses or participants..." />
        <div className="relative">
          <button onClick={() => setShowColumns(!showColumns)} className="btn-secondary text-sm flex items-center gap-2">
            <HiOutlineAdjustments className="w-4 h-4" /> Columns
          </button>
          {showColumns && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowColumns(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-20 animate-scale-in">
                <p className="text-xs font-semibold text-gray-500 mb-2">SHOW/HIDE COLUMNS</p>
                {Object.entries(columns).map(([key, val]) => (
                  <label key={key} className="flex items-center gap-2 py-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={val}
                      onChange={() => setColumns({ ...columns, [key]: !val })}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  </label>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {columns.srNo && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">#</th>}
                {columns.course && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Course</th>}
                {columns.participant && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Participant</th>}
                {columns.enrolled && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Enrolled</th>}
                {columns.start && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Started</th>}
                {columns.timeSpent && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Time Spent</th>}
                {columns.completion && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Progress</th>}
                {columns.completedDate && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Completed</th>}
                {columns.status && <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Status</th>}
              </tr>
            </thead>
            <tbody>
              {filteredProgress.map((row, i) => (
                <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  {columns.srNo && <td className="px-6 py-4 text-sm text-gray-500">{i + 1}</td>}
                  {columns.course && <td className="px-6 py-4 text-sm font-semibold text-gray-800">{row.course}</td>}
                  {columns.participant && <td className="px-6 py-4 text-sm text-gray-700">{row.participant}</td>}
                  {columns.enrolled && <td className="px-6 py-4 text-sm text-gray-500">{formatDate(row.enrolledDate)}</td>}
                  {columns.start && <td className="px-6 py-4 text-sm text-gray-500">{formatDate(row.startDate)}</td>}
                  {columns.timeSpent && <td className="px-6 py-4 text-sm text-gray-500">{row.timeSpent}</td>}
                  {columns.completion && (
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${row.completion}%` }} />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{row.completion}%</span>
                      </div>
                    </td>
                  )}
                  {columns.completedDate && <td className="px-6 py-4 text-sm text-gray-500">{formatDate(row.completedDate)}</td>}
                  {columns.status && <td className="px-6 py-4">{getStatusBadge(row.status)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredProgress.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <HiOutlineUsers className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No data found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reporting;

/*
============================================
BACKEND API REQUIRED:
============================================

GET /api/reporting
Response: {
  success: true,
  data: {
    stats: { total, yetToStart, inProgress, completed },
    progress: [{
      id, course, participant, enrolledDate,
      startDate, timeSpent, completion, completedDate, status
    }]
  }
}

Status values: "yet_to_start" | "in_progress" | "completed"
============================================
*/