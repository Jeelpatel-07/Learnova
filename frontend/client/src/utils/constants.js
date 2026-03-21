export const ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  LEARNER: 'learner',
};

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const CONTENT_TYPES = {
  VIDEO: 'video',
  DOCUMENT: 'document',
  IMAGE: 'image',
  QUIZ: 'quiz',
};

export const VISIBILITY = {
  EVERYONE: 'everyone',
  SIGNED_IN: 'signed_in',
};

export const ACCESS_RULES = {
  OPEN: 'open',
  INVITATION: 'invitation',
  PAYMENT: 'payment',
};

export const LESSON_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const BADGE_LEVELS = [
  { name: 'Newbie', points: 0, icon: '??', color: 'bg-gray-100 text-gray-700' },
  { name: 'Explorer', points: 20, icon: '??', color: 'bg-blue-100 text-blue-700' },
  { name: 'Achiever', points: 40, icon: '??', color: 'bg-green-100 text-green-700' },
  { name: 'Specialist', points: 60, icon: '?', color: 'bg-purple-100 text-purple-700' },
  { name: 'Expert', points: 80, icon: '??', color: 'bg-orange-100 text-orange-700' },
  { name: 'Master', points: 100, icon: '??', color: 'bg-yellow-100 text-yellow-700' },
  { name: 'Legend', points: 120, icon: '??', color: 'bg-red-100 text-red-700' },
];

export const DEFAULT_REWARDS = {
  firstAttempt: 20,
  secondAttempt: 15,
  thirdAttempt: 10,
  fourthAndMore: 5,
};

export const KANBAN_COLUMNS = [
  { id: 'draft', title: 'Draft', color: 'border-gray-300' },
  { id: 'published', title: 'Published', color: 'border-green-400' },
];
