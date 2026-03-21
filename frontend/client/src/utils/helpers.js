import { BADGE_LEVELS } from './constants';

export const getApiOrigin = () => {
  const configuredUrl = import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    try {
      return new URL(configuredUrl).origin;
    } catch {
      return `${window.location.protocol}//${window.location.hostname}:5000`;
    }
  }

  return `${window.location.protocol}//${window.location.hostname}:5000`;
};

export const resolveMediaUrl = (path) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiOrigin()}${normalizedPath}`;
};

export const getPostAuthRoute = (role) => {
  if (role === 'Admin' || role === 'Instructor') {
    return '/admin/dashboard';
  }

  return '/my-courses';
};

export const calculateQuizPercentage = (correctAnswers, totalQuestions) => {
  if (!totalQuestions) return 0;
  return Math.round((correctAnswers / totalQuestions) * 100);
};

export const hasCompletedLesson = (completedLessons = [], lessonId) =>
  completedLessons.some((id) => String(id) === String(lessonId));

export const getBadgeForPoints = (points) => {
  let badge = BADGE_LEVELS[0];
  for (let i = BADGE_LEVELS.length - 1; i >= 0; i--) {
    if (points >= BADGE_LEVELS[i].points) {
      badge = BADGE_LEVELS[i];
      break;
    }
  }
  return badge;
};

export const getNextBadge = (points) => {
  for (const badge of BADGE_LEVELS) {
    if (points < badge.points) return badge;
  }
  return null;
};

export const formatDuration = (minutes) => {
  if (!minutes) return '0m';
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hrs === 0) return `${mins}m`;
  if (mins === 0) return `${hrs}h`;
  return `${hrs}h ${mins}m`;
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const calculateProgress = (completed, total) => {
  if (!total || total === 0) return 0;
  return Math.round((completed / total) * 100);
};

export const getPointsForAttempt = (attemptNumber, rewards) => {
  if (!rewards) return 0;
  if (attemptNumber === 1) return rewards.firstAttempt || 20;
  if (attemptNumber === 2) return rewards.secondAttempt || 15;
  if (attemptNumber === 3) return rewards.thirdAttempt || 10;
  return rewards.fourthAndMore || 5;
};
