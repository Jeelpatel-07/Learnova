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

  // Add lesson — backend returns the newly added lesson, not the full course
  // So we re-fetch the course to get updated data
  addLesson: async (courseId, lessonData) => {
    try {
      const res = await API.post(`/courses/${courseId}/lessons`, lessonData);
      // Re-fetch the course to get the updated lessons array
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Update lesson — backend returns the updated lesson, not the full course
  updateLesson: async (courseId, lessonId, lessonData) => {
    try {
      const res = await API.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
      // Re-fetch the course to get the updated lessons array
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  // Delete lesson — backend returns {success, message} with no data
  deleteLesson: async (courseId, lessonId) => {
    try {
      await API.delete(`/courses/${courseId}/lessons/${lessonId}`);
      // Re-fetch the course to get the updated lessons array
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
    } catch (err) {
      throw err;
    }
  },

  // Upload course image
  uploadCourseImage: async (courseId, file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await API.post(`/courses/${courseId}/upload-image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Re-fetch course to get updated image
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  clearCurrent: () => set({ currentCourse: null }),
}));

export default useCourseStore;