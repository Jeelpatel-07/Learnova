export const ROLES = {
  ADMIN: 'Admin',
  INSTRUCTOR: 'Instructor',
  LEARNER: 'Learner',
};

export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

export const CONTENT_TYPES = {
  VIDEO: 'Video',
  DOCUMENT: 'Document',
  IMAGE: 'Image',
};

export const VISIBILITY = {
  EVERYONE: 'Everyone',
  SIGNED_IN: 'SignedIn',
};

export const ACCESS_RULES = {
  OPEN: 'Open',
  INVITATION: 'Invitation',
  PAID: 'Paid',
};

export const LESSON_STATUS = {
  NOT_STARTED: 'YetToStart',
  IN_PROGRESS: 'InProgress',
  COMPLETED: 'Completed',
};

export const BADGE_LEVELS = [
  { name: 'Newbie', points: 20, icon: '🌱', color: 'bg-gray-100 text-gray-700' },
  { name: 'Explorer', points: 40, icon: '🔭', color: 'bg-blue-100 text-blue-700' },
  { name: 'Achiever', points: 60, icon: '🏅', color: 'bg-green-100 text-green-700' },
  { name: 'Specialist', points: 80, icon: '⭐', color: 'bg-purple-100 text-purple-700' },
  { name: 'Expert', points: 100, icon: '💎', color: 'bg-orange-100 text-orange-700' },
  { name: 'Master', points: 120, icon: '👑', color: 'bg-yellow-100 text-yellow-700' },
];

export const DEFAULT_REWARDS = {
  firstAttempt: 100,
  secondAttempt: 75,
  thirdAttempt: 50,
  fourthAndMore: 25,
};

export const KANBAN_COLUMNS = [
  { id: 'draft', title: 'Draft', color: 'border-gray-300' },
  { id: 'published', title: 'Published', color: 'border-green-400' },
];
