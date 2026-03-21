import { create } from 'zustand';
import API from '../api/axios';

const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  myCourses: [],
  loading: false,
  error: null,

  // Admin: Fetch all courses
  fetchCourses: async () => {
    set({ loading: true });
    try {
      const res = await API.get('/courses');
      set({ courses: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  // Get single course
  fetchCourse: async (id) => {
    set({ loading: true });
    try {
      const res = await API.get(`/courses/${id}`);
      set({ currentCourse: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  // Create course
  createCourse: async (courseData) => {
    try {
      const res = await API.post('/courses', courseData);
      set({ courses: [...get().courses, res.data.data] });
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Update course
  updateCourse: async (id, courseData) => {
    try {
      const res = await API.put(`/courses/${id}`, courseData);
      const updated = res.data.data;
      set({
        courses: get().courses.map((c) => (c._id === id ? updated : c)),
        currentCourse: updated,
      });
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // Toggle publish
  togglePublish: async (id) => {
    try {
      const res = await API.patch(`/courses/${id}/toggle-publish`);
      const updated = res.data.data;
      set({
        courses: get().courses.map((c) => (c._id === id ? updated : c)),
      });
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // Delete course
  deleteCourse: async (id) => {
    try {
      await API.delete(`/courses/${id}`);
      set({ courses: get().courses.filter((c) => c._id !== id) });
    } catch (err) {
      throw err;
    }
  },

  // Learner: Fetch published courses
  fetchPublishedCourses: async () => {
    set({ loading: true });
    try {
      const res = await API.get('/courses/published');
      set({ courses: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  // Learner: Fetch my enrolled courses
  fetchMyCourses: async () => {
    set({ loading: true });
    try {
      const res = await API.get('/courses/my-courses');
      set({ myCourses: res.data.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  // Enroll in course
  enrollCourse: async (courseId) => {
    try {
      const res = await API.post(`/courses/${courseId}/enroll`);
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Add lesson
  addLesson: async (courseId, lessonData) => {
    try {
      const res = await API.post(`/courses/${courseId}/lessons`, lessonData);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: res.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Update lesson
  updateLesson: async (courseId, lessonId, lessonData) => {
    try {
      const res = await API.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: res.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete lesson
  deleteLesson: async (courseId, lessonId) => {
    try {
      const res = await API.delete(`/courses/${courseId}/lessons/${lessonId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: res.data.data });
      }
    } catch (err) {
      throw err;
    }
  },

  clearCurrent: () => set({ currentCourse: null }),
}));

export default useCourseStore;

/*
============================================
BACKEND API REQUIRED:
============================================

GET    /api/courses              → All courses (admin)
GET    /api/courses/published    → Published courses (public/learner)
GET    /api/courses/my-courses   → Enrolled courses (learner, needs auth)
GET    /api/courses/:id          → Single course with lessons, quizzes
POST   /api/courses              → Create course { title, tags, description, ... }
PUT    /api/courses/:id          → Update course
PATCH  /api/courses/:id/toggle-publish → Toggle published status
DELETE /api/courses/:id          → Delete course

POST   /api/courses/:id/enroll   → Enroll user in course
POST   /api/courses/:id/lessons  → Add lesson to course
PUT    /api/courses/:id/lessons/:lessonId → Update lesson
DELETE /api/courses/:id/lessons/:lessonId → Delete lesson

Course response shape:
{
  _id, title, description, tags: [], image, published,
  visibility: "everyone"|"signed_in",
  accessRule: "open"|"invitation"|"payment",
  price: number,
  responsible: { _id, name },
  lessons: [{ _id, title, type, fileUrl, duration, allowDownload, description, attachments }],
  quizzes: [{ _id, title, questions }],
  views: number,
  totalDuration: number,
  attendees: [userId],
  createdAt, updatedAt
}

============================================
*/