import { useEffect, useMemo, useState } from 'react';
import API from '../../api/axios';
import SearchBar from '../../components/common/SearchBar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ReportingTable from '../../components/admin/ReportingTable';
import {
  HiOutlineAdjustments,
  HiOutlineChartBar,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineFilter,
  HiOutlinePlay,
  HiOutlineUsers,
  HiX,
} from 'react-icons/hi';

const columnLabels = {
  srNo: 'Sr No.',
  courseName: 'Course Name',
  participantName: 'Participant Name',
  enrolledDate: 'Enrolled Date',
  startDate: 'Start Date',
  timeSpent: 'Time Spent',
  completionPercentage: 'Completion Percentage',
  completedDate: 'Completed Date',
  status: 'Status',
};

const initialColumns = {
  srNo: true,
  courseName: true,
  participantName: true,
  enrolledDate: true,
  startDate: true,
  timeSpent: true,
  completionPercentage: true,
  completedDate: true,
  status: true,
};

const statusConfig = {
  all: {
    label: 'Total Participants',
    icon: HiOutlineUsers,
    accent: 'from-slate-900 via-slate-800 to-cyan-700',
    surface: 'bg-slate-900',
    hint: 'Unique learners across all tracked courses',
  },
  YetToStart: {
    label: 'Yet to Start',
    icon: HiOutlineClock,
    accent: 'from-amber-400 via-orange-400 to-amber-500',
    surface: 'bg-amber-500',
    hint: 'Enrolled, but not started yet',
  },
  InProgress: {
    label: 'In Progress',
    icon: HiOutlinePlay,
    accent: 'from-sky-500 via-cyan-500 to-indigo-500',
    surface: 'bg-sky-500',
    hint: 'Learners actively working through content',
  },
  Completed: {
    label: 'Completed',
    icon: HiOutlineCheckCircle,
    accent: 'from-emerald-500 via-green-500 to-teal-500',
    surface: 'bg-emerald-500',
    hint: 'Learners who finished their course journey',
  },
};

const Reporting = () => {
  const [stats, setStats] = useState({ total: 0, yetToStart: 0, inProgress: 0, completed: 0 });
  const [rows, setRows] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [showColumnsPanel, setShowColumnsPanel] = useState(false);
  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    const fetchReporting = async () => {
      try {
        const res = await API.get('/reporting');
        const data = res.data?.data || {};

        setStats({
          total: data.totalParticipants || 0,
          yetToStart: data.yetToStart || 0,
          inProgress: data.inProgress || 0,
          completed: data.completed || 0,
        });
        setRows(Array.isArray(data.table) ? data.table : []);
        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } catch (error) {
        setStats({ total: 0, yetToStart: 0, inProgress: 0, completed: 0 });
        setRows([]);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReporting();
  }, []);

  const overviewCards = useMemo(
    () => [
      { key: 'all', value: stats.total },
      { key: 'YetToStart', value: stats.yetToStart },
      { key: 'InProgress', value: stats.inProgress },
      { key: 'Completed', value: stats.completed },
    ],
    [stats]
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return rows.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) {
        return false;
      }

      if (courseFilter !== 'all' && row.courseId !== courseFilter) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [row.courseName, row.participantName, row.participantEmail, row.statusLabel]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [courseFilter, rows, search, statusFilter]);

  const visibleColumnCount = useMemo(
    () => Object.values(columns).filter(Boolean).length,
    [columns]
  );

  const activeCourseLabel = useMemo(() => {
    if (courseFilter === 'all') {
      return 'All courses';
    }

    return courses.find((course) => course.id === courseFilter)?.name || 'Selected course';
  }, [courseFilter, courses]);

  const handleColumnToggle = (key) => {
    setColumns((currentColumns) => ({
      ...currentColumns,
      [key]: !currentColumns[key],
    }));
  };

  const resetColumns = () => setColumns(initialColumns);

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading reporting dashboard..." />;
  }

  return (
    <div className="page-container">
      <section className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.20),_transparent_30%),linear-gradient(135deg,#0f172a_0%,#111827_50%,#164e63_100%)] px-6 py-8 text-white shadow-[0_32px_80px_-36px_rgba(15,23,42,0.85)] sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.08)_45%,transparent_100%)]" />
        <div className="relative flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-100">
              <HiOutlineChartBar className="h-4 w-4" />
              Reporting Dashboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Course-wise learner progress for instructors and admins
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-200 sm:text-base">
              Review participation, spot inactive learners, and monitor completion trends from a single workspace.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Visible Rows</p>
              <p className="mt-2 text-3xl font-semibold">{filteredRows.length}</p>
              <p className="mt-1 text-sm text-slate-300">{activeCourseLabel}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Columns On</p>
              <p className="mt-2 text-3xl font-semibold">{visibleColumnCount}</p>
              <p className="mt-1 text-sm text-slate-300">Customizable side panel</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">Current View</p>
              <p className="mt-2 text-xl font-semibold">{statusConfig[statusFilter].label}</p>
              <p className="mt-1 text-sm text-slate-300">{statusConfig[statusFilter].hint}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((card) => {
          const config = statusConfig[card.key];
          const Icon = config.icon;
          const isActive = statusFilter === card.key;

          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              className={`group relative overflow-hidden rounded-[28px] border p-5 text-left transition-all duration-300 ${
                isActive
                  ? 'border-slate-900 bg-slate-900 text-white shadow-[0_28px_60px_-40px_rgba(15,23,42,0.95)]'
                  : 'border-slate-200 bg-white text-slate-900 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_24px_50px_-36px_rgba(15,23,42,0.45)]'
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${config.accent}`} />
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{config.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-tight">{card.value}</p>
                  <p className={`mt-2 text-sm ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>{config.hint}</p>
                </div>
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                    isActive ? 'bg-white/10 text-white' : `${config.surface} text-white`
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </button>
          );
        })}
      </section>

      <section className="mt-8 rounded-[32px] border border-slate-200 bg-white p-4 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.55)] sm:p-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Learner Progress Details</h2>
            <p className="mt-2 text-sm text-slate-500">
              Each row represents one learner’s progress inside one course.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="min-w-[260px]">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by course, participant, email, or status"
              />
            </div>

            <label className="flex min-w-[220px] items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <HiOutlineFilter className="h-5 w-5 text-slate-400" />
              <div className="flex-1">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Course Filter
                </span>
                <select
                  value={courseFilter}
                  onChange={(event) => setCourseFilter(event.target.value)}
                  className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">All courses</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <button
              type="button"
              onClick={() => setShowColumnsPanel(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <HiOutlineAdjustments className="h-5 w-5" />
              Customize Columns
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
            Status: {statusConfig[statusFilter].label}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
            Course: {activeCourseLabel}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-medium text-slate-700">
            Rows shown: {filteredRows.length}
          </span>
        </div>

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
          <ReportingTable
            rows={filteredRows}
            visibleColumns={columns}
            columnLabels={columnLabels}
            emptyState={{
              title: 'No matching learner progress records',
              description: 'Adjust the selected status card, course filter, search query, or visible columns to broaden the results.',
            }}
          />
        </div>
      </section>

      {showColumnsPanel && (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
            onClick={() => setShowColumnsPanel(false)}
            aria-label="Close column panel"
          />

          <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-600">Table Controls</p>
                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Customize visible columns</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Show or hide columns to tailor the reporting view for instructors or admins.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowColumnsPanel(false)}
                className="rounded-2xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {Object.keys(columns).map((columnKey) => (
                <label
                  key={columnKey}
                  className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={columns[columnKey]}
                    onChange={() => handleColumnToggle(columnKey)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{columnLabels[columnKey]}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {columnKey === 'completionPercentage'
                        ? 'Display visual course completion progress.'
                        : columnKey === 'participantName'
                        ? 'Show participant identity and email.'
                        : 'Include this field in the learner progress table.'}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-3">
              <button
                type="button"
                onClick={resetColumns}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Reset Defaults
              </button>
              <button
                type="button"
                onClick={() => setShowColumnsPanel(false)}
                className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Apply View
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default Reporting;
