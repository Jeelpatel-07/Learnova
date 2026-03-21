import { create } from 'zustand';
import API from '../api/axios';

const getErrorMessage = (err, fallback) => err.response?.data?.message || err.message || fallback;

const hydrateProgress = async (course) => {
  try {
    const progressRes = await API.get(`/progress/${course._id}`);
    const progress = progressRes.data.data;

    return {
      ...course,
      progress: {
        ...progress,
        completedLessons: progress.completedLessons?.length || 0,
        completedQuizzes: progress.completedQuizzes?.length || 0,
      },
    };
  } catch {
    return {
      ...course,
      progress: {
        completedLessons: 0,
        completedQuizzes: 0,
        progressPercent: 0,
        status: 'YetToStart',
      },
    };
  }
};

const useCourseStore = create((set, get) => ({
  courses: [],
  currentCourse: null,
  myCourses: [],
  users: [],
  loading: false,
  error: null,

  fetchCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses');
      set({ courses: res.data.data || [], loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch courses'), loading: false });
    }
  },

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

  createCourse: async (courseData) => {
    const res = await API.post('/courses', courseData);
    set({ courses: [res.data.data, ...get().courses] });
    return res.data.data;
  },

  updateCourse: async (id, courseData) => {
    const res = await API.put(`/courses/${id}`, courseData);
    const updated = res.data.data;
    set({
      courses: get().courses.map((course) => (course._id === id ? updated : course)),
      currentCourse: updated,
    });
    return updated;
  },

  togglePublish: async (id) => {
    const res = await API.patch(`/courses/${id}/toggle-publish`);
    const updated = res.data.data;
    set({
      courses: get().courses.map((course) => (course._id === id ? updated : course)),
      currentCourse: get().currentCourse?._id === id ? updated : get().currentCourse,
    });
    return updated;
  },

  deleteCourse: async (id) => {
    await API.delete(`/courses/${id}`);
    set({
      courses: get().courses.filter((course) => course._id !== id),
      currentCourse: get().currentCourse?._id === id ? null : get().currentCourse,
    });
  },

  fetchPublishedCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses/published');
      set({ courses: res.data.data || [], loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch courses'), loading: false });
    }
  },

  fetchMyCourses: async () => {
    set({ loading: true, error: null });
    try {
      const res = await API.get('/courses/my-courses');
      const coursesWithProgress = await Promise.all((res.data.data || []).map(hydrateProgress));
      set({ myCourses: coursesWithProgress, loading: false });
    } catch (err) {
      set({ error: getErrorMessage(err, 'Failed to fetch your courses'), loading: false });
    }
  },

  enrollCourse: async (courseId) => {
    const res = await API.post(`/courses/${courseId}/enroll`);
    return res.data.data;
  },

  addLesson: async (courseId, lessonData) => {
    const res = await API.post(`/courses/${courseId}/lessons`, lessonData);
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  updateLesson: async (courseId, lessonId, lessonData) => {
    const res = await API.put(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  deleteLesson: async (courseId, lessonId) => {
    await API.delete(`/courses/${courseId}/lessons/${lessonId}`);
    await get().fetchCourse(courseId);
  },

  addQuiz: async (courseId, quizData) => {
    const res = await API.post(`/courses/${courseId}/quizzes`, quizData);
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  updateQuiz: async (courseId, quizId, quizData) => {
    const res = await API.put(`/courses/${courseId}/quizzes/${quizId}`, quizData);
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  deleteQuiz: async (courseId, quizId) => {
    await API.delete(`/courses/${courseId}/quizzes/${quizId}`);
    await get().fetchCourse(courseId);
  },

  uploadCourseImage: async (courseId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await API.post(`/courses/${courseId}/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  uploadCourseAsset: async (courseId, file, resourceType = 'auto') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('resourceType', resourceType);
    const res = await API.post(`/courses/${courseId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  fetchUsers: async () => {
    const res = await API.get('/auth/users');
    set({ users: res.data.data || [] });
    return res.data.data || [];
  },

  addAttendees: async (courseId, payload) => {
    const res = await API.post(`/courses/${courseId}/attendees`, payload);
    const updatedCourse = res.data.data?.course;
    if (updatedCourse) {
      set({
        courses: get().courses.map((course) => (course._id === courseId ? updatedCourse : course)),
        currentCourse: updatedCourse,
      });
    } else {
      await get().fetchCourse(courseId);
    }
    return res.data.data;
  },

  contactAttendees: async (courseId, payload) => {
    const res = await API.post(`/courses/${courseId}/contact-attendees`, payload);
    await get().fetchCourse(courseId);
    return res.data.data;
  },

  clearCurrent: () => set({ currentCourse: null }),
}));

export default useCourseStore;
