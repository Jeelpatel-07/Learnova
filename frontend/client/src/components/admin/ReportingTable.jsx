import Badge from '../common/Badge';
import { formatDate, formatDuration, getInitials } from '../../utils/helpers';

const statusVariantMap = {
  Completed: 'success',
  InProgress: 'info',
  YetToStart: 'warning',
};

const defaultColumnLabels = {
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

const ProgressMeter = ({ value }) => {
  const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="min-w-[180px]">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-slate-500">
        <span>Progress</span>
        <span>{normalizedValue}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  );
};

const renderCell = (columnKey, row, displayIndex) => {
  switch (columnKey) {
    case 'srNo':
      return <span className="font-semibold text-slate-500">{displayIndex}</span>;
    case 'courseName':
      return (
        <div>
          <div className="font-semibold text-slate-900">{row.courseName || '-'}</div>
          <div className="mt-1 text-xs text-slate-400">{row.lessonsCompleted || 0} lessons completed</div>
        </div>
      );
    case 'participantName':
      return (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
            {getInitials(row.participantName)}
          </div>
          <div>
            <div className="font-semibold text-slate-900">{row.participantName || '-'}</div>
            <div className="mt-1 text-xs text-slate-500">{row.participantEmail || 'No email available'}</div>
          </div>
        </div>
      );
    case 'enrolledDate':
      return <span className="text-slate-600">{formatDate(row.enrolledDate)}</span>;
    case 'startDate':
      return <span className="text-slate-600">{formatDate(row.startDate)}</span>;
    case 'timeSpent':
      return <span className="font-medium text-slate-700">{formatDuration(row.timeSpent)}</span>;
    case 'completionPercentage':
      return <ProgressMeter value={row.completionPercentage} />;
    case 'completedDate':
      return <span className="text-slate-600">{formatDate(row.completedDate)}</span>;
    case 'status':
      return (
        <Badge variant={statusVariantMap[row.status] || 'gray'} size="md">
          {row.statusLabel || row.status || '-'}
        </Badge>
      );
    default:
      return <span className="text-slate-600">{row[columnKey] || '-'}</span>;
  }
};

const ReportingTable = ({
  rows,
  visibleColumns,
  columnLabels = defaultColumnLabels,
  emptyState,
}) => {
  const activeColumns = Object.entries(visibleColumns)
    .filter(([, isVisible]) => isVisible)
    .map(([key]) => key);

  if (!activeColumns.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">No columns selected</h3>
          <p className="mt-2 text-sm text-slate-500">Choose at least one column from the visibility panel to view reporting data.</p>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="flex min-h-[280px] items-center justify-center px-6 py-12 text-center">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{emptyState?.title || 'No reporting data found'}</h3>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            {emptyState?.description || 'Try changing the filters or search text to see learner progress records.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <tr className="bg-slate-50">
            {activeColumns.map((columnKey) => (
              <th
                key={columnKey}
                className="sticky top-0 whitespace-nowrap border-b border-slate-200 px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                {columnLabels[columnKey] || columnKey}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || `${row.courseId}-${row.participantId}-${index}`} className="group">
              {activeColumns.map((columnKey) => (
                <td
                  key={`${row.id || index}-${columnKey}`}
                  className="border-b border-slate-100 px-6 py-4 align-middle text-sm transition-colors group-hover:bg-slate-50/80"
                >
                  {renderCell(columnKey, row, index + 1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportingTable;
