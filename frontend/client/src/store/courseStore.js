import { create } from 'zustand';
import API from '../api/axios';

const getErrorMessage = (err, fallback) => err.response?.data?.message || err.message || fallback;

const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  myCourses: [],
  loading: false,
  error: null,

  // Admin: Fetch all courses
  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses');
      set({ courses: res.data.data, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch courses'), loading: false });
    }
  },

  // Get single course
  fetchCourse: async (id) => {
    set({ loading: true, error: null });
    try {
      const res = await API.get(`/courses/${id}`);
      set({ currentCourse: res.data.data, loading: false });
      return res.data.data;
    } catch (err) {
      set({ currentCourse: null, error: getErrorMessage(err, 'Failed to fetch course'), loading: false });
      return null;
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
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses/published');
      set({ courses: res.data.data, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch courses'), loading: false });
    }
  },

  // Learner: Fetch my enrolled courses
  fetchMyCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses/my-courses');
      const coursesWithProgress = await Promise.all(
        (res.data.data || []).map(async (course) => {
          try {
            const progressRes = await API.get(`/progress/${course._id}`);
            const progress = progressRes.data.data;

            return {
              ...course,
              progress: {
                ...progress,
                completedLessons: progress.completedContentIds?.length || 0,
              },
            };
          } catch {
            return {
              ...course,
              progress: {
                completedLessons: 0,
                progressPercent: 0,
                status: 'YetToStart',
              },
            };
          }
        })
      );

      set({ myCourses: coursesWithProgress, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch your courses'), loading: false });
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

  addQuiz: async (courseId, quizData) => {
    try {
      const res = await API.post(`/courses/${courseId}/quizzes`, quizData);
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  updateQuiz: async (courseId, quizId, quizData) => {
    try {
      const res = await API.put(`/courses/${courseId}/quizzes/${quizId}`, quizData);
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
      return res.data.data;
    } catch (err) {
      throw err;
    }
  },

  deleteQuiz: async (courseId, quizId) => {
    try {
      await API.delete(`/courses/${courseId}/quizzes/${quizId}`);
      const courseRes = await API.get(`/courses/${courseId}`);
      if (get().currentCourse?._id === courseId) {
        set({ currentCourse: courseRes.data.data });
      }
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
