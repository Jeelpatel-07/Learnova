import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useCourseStore from '../../store/courseStore';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Badge from '../../components/common/Badge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { resolveMediaUrl } from '../../utils/helpers';
import {
  HiOutlineEye,
  HiOutlineMail,
  HiOutlinePhotograph,
  HiOutlineTrash,
  HiOutlinePencil,
  HiOutlineDotsVertical,
  HiOutlinePlus,
  HiOutlineVideoCamera,
  HiOutlineDocumentText,
  HiOutlinePhotograph as HiImage,
  HiOutlinePuzzle,
  HiOutlineUpload,
  HiOutlineLink,
  HiOutlineClock,
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiOutlineCreditCard,
  HiOutlineCurrencyDollar,
} from 'react-icons/hi';

const CourseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentCourse,
    fetchCourse,
    updateCourse,
    togglePublish,
    addLesson,
    updateLesson,
    deleteLesson,
    addQuiz,
    updateQuiz,
    deleteQuiz,
    uploadCourseImage,
    uploadCourseAsset,
    fetchUsers,
    addAttendees,
    contactAttendees,
    loading,
  } = useCourseStore();
  const [activeTab, setActiveTab] = useState('content');
  const [course, setCourse] = useState(null);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteType, setDeleteType] = useState('lesson');
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showAttendeeModal, setShowAttendeeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [contactForm, setContactForm] = useState({ subject: '', message: '' });
  const [uploadingLessonFile, setUploadingLessonFile] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // Lesson form state
  const [lessonForm, setLessonForm] = useState({
    title: '', type: 'Video', description: '', fileUrl: '', duration: '',
    allowDownload: false, attachments: [], responsible: '', filePublicId: '', fileResourceType: '', fileOriginalName: '',
  });
  const [lessonTab, setLessonTab] = useState('content');

  // Quiz form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
    rewards: { firstAttempt: 100, secondAttempt: 75, thirdAttempt: 50, fourthAndMore: 25 },
  });
  const [activeQuestion, setActiveQuestion] = useState(0);

  useEffect(() => {
    if (id) fetchCourse(id);
  }, [id]);

  useEffect(() => {
    if (currentCourse) setCourse(currentCourse);
  }, [currentCourse]);

  useEffect(() => {
    if (showAttendeeModal) {
      fetchUsers()
        .then((users) => setAvailableUsers(users))
        .catch(() => toast.error('Failed to load users'));
    }
  }, [showAttendeeModal, fetchUsers]);

  const handleUpdateCourse = async (field, value) => {
    const updated = { ...course, [field]: value };
    setCourse(updated);
    try {
      await updateCourse(id, { [field]: value });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update');
    }
  };

  const handleTogglePublish = async () => {
    try {
      const updated = await togglePublish(id);
      setCourse(updated);
      toast.success(updated.published ? 'Course published! 🎉' : 'Course unpublished');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to toggle publish');
    }
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error('Lesson title is required');
      return;
    }
    if ((lessonForm.type === 'Document' || lessonForm.type === 'Image') && !lessonForm.fileUrl.trim()) {
      toast.error(`Please upload or paste a ${lessonForm.type.toLowerCase()} file first`);
      return;
    }
    try {
      if (editingLesson) {
        await updateLesson(id, editingLesson._id, lessonForm);
        toast.success('Lesson updated!');
      } else {
        await addLesson(id, lessonForm);
        toast.success('Lesson added! 📚');
      }
      setShowLessonModal(false);
      resetLessonForm();
      fetchCourse(id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save lesson');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await deleteLesson(id, lessonId);
      toast.success('Lesson deleted');
      fetchCourse(id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete');
    }
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quizForm.title.trim()) {
        toast.error('Quiz title is required');
        return;
      }

      if (editingQuiz) {
        await updateQuiz(id, editingQuiz._id, quizForm);
        toast.success('Quiz updated!');
      } else {
        await addQuiz(id, quizForm);
        toast.success('Quiz saved! 🧠');
      }

      setShowQuizBuilder(false);
      resetQuizForm();
      fetchCourse(id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save quiz');
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await deleteQuiz(id, quizId);
      toast.success('Quiz deleted');
      fetchCourse(id);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete quiz');
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      type: 'Video',
      description: '',
      fileUrl: '',
      duration: '',
      allowDownload: false,
      attachments: [],
      responsible: '',
      filePublicId: '',
      fileResourceType: '',
      fileOriginalName: '',
    });
    setEditingLesson(null);
    setLessonTab('content');
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: '',
      questions: [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
      rewards: { firstAttempt: 100, secondAttempt: 75, thirdAttempt: 50, fourthAndMore: 25 },
    });
    setEditingQuiz(null);
    setActiveQuestion(0);
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      type: lesson.type,
      description: lesson.description || '',
      fileUrl: lesson.fileUrl || '',
      duration: lesson.duration || '',
      allowDownload: lesson.allowDownload || false,
      attachments: lesson.attachments || [],
      responsible: lesson.responsible || '',
      filePublicId: lesson.filePublicId || '',
      fileResourceType: lesson.fileResourceType || '',
      fileOriginalName: lesson.fileOriginalName || '',
    });
    setShowLessonModal(true);
  };

  const handleUploadLessonFile = async (file, resourceType) => {
    setUploadingLessonFile(true);
    try {
      const uploaded = await uploadCourseAsset(id, file, resourceType);
      setLessonForm((prev) => ({
        ...prev,
        fileUrl: uploaded.url,
        filePublicId: uploaded.publicId,
        fileResourceType: uploaded.resourceType,
        fileOriginalName: uploaded.originalName,
      }));
      toast.success('File uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload file');
    } finally {
      setUploadingLessonFile(false);
    }
  };

  const handleUploadAttachment = async (file) => {
    setUploadingAttachment(true);
    try {
      const uploaded = await uploadCourseAsset(id, file, 'raw');
    setLessonForm((prev) => ({
      ...prev,
      attachments: [
        ...prev.attachments,
        {
          title: uploaded.originalName,
          url: uploaded.url,
          publicId: uploaded.publicId,
          resourceType: uploaded.resourceType,
          originalName: uploaded.originalName,
        },
      ],
      }));
      toast.success('Attachment uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to upload attachment');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAddAttendees = async () => {
    if (!selectedUserIds.length) {
      toast.error('Select at least one attendee');
      return;
    }

    try {
      await addAttendees(id, { userIds: selectedUserIds });
      toast.success('Attendees updated');
      setSelectedUserIds([]);
      setShowAttendeeModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add attendees');
    }
  };

  const handleContactAttendees = async () => {
    if (!contactForm.message.trim()) {
      toast.error('Message is required');
      return;
    }

    try {
      await contactAttendees(id, contactForm);
      toast.success('Message saved for attendees');
      setContactForm({ subject: '', message: '' });
      setShowContactModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to contact attendees');
    }
  };

  const openEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title || '',
      questions: quiz.questions?.length ? quiz.questions : [{ question: '', options: ['', '', '', ''], correctAnswer: 0 }],
      rewards: {
        firstAttempt: quiz.rewards?.firstAttempt ?? 100,
        secondAttempt: quiz.rewards?.secondAttempt ?? 75,
        thirdAttempt: quiz.rewards?.thirdAttempt ?? 50,
        fourthAndMore: quiz.rewards?.fourthAndMore ?? 25,
      },
    });
    setActiveQuestion(0);
    setShowQuizBuilder(true);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Video': return <HiOutlineVideoCamera className="w-4 h-4 text-red-500" />;
      case 'Document': return <HiOutlineDocumentText className="w-4 h-4 text-blue-500" />;
      case 'Image': return <HiImage className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (loading && !course) return <LoadingSpinner size="lg" text="Loading course..." />;
  if (!course) return <div className="page-container text-center text-gray-500">Course not found</div>;

  const tabs = [
    { id: 'content', label: 'Content' },
    { id: 'description', label: 'Description' },
    { id: 'options', label: 'Options' },
    { id: 'quiz', label: 'Quiz' },
  ];

  return (
    <div className="page-container">
      {/* Back button */}
      <button onClick={() => navigate('/admin/dashboard')} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        <HiOutlineChevronLeft className="w-4 h-4" />
        Back to courses
      </button>

      {/* Header */}
      <div className="card-elevated p-6 mb-6 animate-slide-up">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Course Image */}
          <div className="relative group">
            <div className="w-full lg:w-48 h-32 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-100 to-purple-100">
              {course.image ? (
                <img src={resolveMediaUrl(course.image)} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <HiOutlinePhotograph className="w-10 h-10 text-indigo-300" />
                </div>
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-xl cursor-pointer transition-opacity">
              <HiOutlineUpload className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                const file = e.target.files[0];
                if (file) {
                  try {
                    await uploadCourseImage(id, file);
                    toast.success('Image uploaded!');
                  } catch (err) {
                    toast.error('Failed to upload image');
                  }
                }
              }} />
            </label>
          </div>

          {/* Course Info */}
          <div className="flex-1 space-y-4">
            <input
              type="text"
              value={course.title || ''}
              onChange={(e) => handleUpdateCourse('title', e.target.value)}
              className="text-2xl font-bold text-gray-900 border-none outline-none bg-transparent w-full placeholder-gray-300"
              placeholder="Course title..."
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                placeholder="Add tags (comma separated)"
                className="text-sm border-none outline-none bg-transparent text-gray-500 placeholder-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const newTags = [...(course.tags || []), e.target.value.trim()];
                    handleUpdateCourse('tags', newTags);
                    e.target.value = '';
                  }
                }}
              />
              {course.tags?.map((tag, i) => (
                <span key={i} className="badge-primary cursor-pointer" onClick={() => {
                  handleUpdateCourse('tags', course.tags.filter((_, j) => j !== i));
                }}>
                  {tag} ×
                </span>
              ))}
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Publish Toggle */}
            <button
              onClick={handleTogglePublish}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                course.published ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${course.published ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {course.published ? 'Published' : 'Draft'}
            </button>

            <button onClick={() => window.open(`/courses/${id}`, '_blank')} className="btn-secondary text-sm py-2">
              <HiOutlineEye className="w-4 h-4 mr-1.5 inline" /> Preview
            </button>

            <button onClick={() => setShowAttendeeModal(true)} className="btn-secondary text-sm py-2">
              <HiOutlinePlus className="w-4 h-4 mr-1.5 inline" /> Attendees
            </button>

            <button onClick={() => setShowContactModal(true)} className="btn-secondary text-sm py-2">
              <HiOutlineMail className="w-4 h-4 mr-1.5 inline" /> Contact
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="card-elevated animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Course Content</h3>
            <button
              onClick={() => { resetLessonForm(); setShowLessonModal(true); }}
              className="btn-primary text-sm flex items-center gap-1.5"
            >
              <HiOutlinePlus className="w-4 h-4" /> Add Content
            </button>
          </div>

          {course.lessons?.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <HiOutlineDocumentText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No lessons yet</p>
              <p className="text-sm mt-1">Add your first lesson to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {course.lessons?.map((lesson, index) => (
                <div key={lesson._id || index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors group">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 font-medium w-6">{index + 1}</span>
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      {getTypeIcon(lesson.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{lesson.title}</p>
                      <p className="text-xs text-gray-500 capitalize flex items-center gap-2">
                        {lesson.type}
                        {lesson.duration && (
                          <>
                            <span className="text-gray-300">·</span>
                            <span className="flex items-center gap-0.5">
                              <HiOutlineClock className="w-3 h-3" />
                              {lesson.duration} min
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === index ? null : index)}
                      className="p-2 hover:bg-gray-200 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <HiOutlineDotsVertical className="w-4 h-4 text-gray-500" />
                    </button>
                    {menuOpen === index && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                        <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20 animate-scale-in">
                          <button
                            onClick={() => { openEditLesson(lesson); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <HiOutlinePencil className="w-4 h-4" /> Edit
                          </button>
                          <button
                            onClick={() => { setDeleteType('lesson'); setDeleteTarget(lesson); setMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            <HiOutlineTrash className="w-4 h-4" /> Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description Tab */}
      {activeTab === 'description' && (
        <div className="card-elevated p-6 space-y-6 animate-fade-in">
          <div>
            <h3 className="font-bold text-gray-800 mb-4">Course Description</h3>
            <textarea
              value={course.description || ''}
              onChange={(e) => handleUpdateCourse('description', e.target.value)}
              className="input-field min-h-[250px] resize-y"
              placeholder="Describe what learners will learn in this course..."
            />
          </div>
          <div>
            <label className="input-label">Website URL</label>
            <input
              type="url"
              value={course.website || ''}
              onChange={(e) => handleUpdateCourse('website', e.target.value)}
              placeholder="https://example.com/course-page"
              className="input-field max-w-lg"
            />
            <p className="text-xs text-gray-400 mt-1">Provide a website URL for this course (visible when published)</p>
          </div>
        </div>
      )}

      {/* Options Tab */}
      {activeTab === 'options' && (
        <div className="card-elevated p-6 space-y-6 animate-fade-in">
          <h3 className="font-bold text-gray-800">Access & Visibility</h3>

          {/* Visibility */}
          <div>
            <label className="input-label">Show course to</label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {[
                { value: 'Everyone', label: 'Everyone', icon: HiOutlineGlobeAlt, desc: 'Visible to all visitors' },
                { value: 'SignedIn', label: 'Signed In', icon: HiOutlineLockClosed, desc: 'Only logged-in users' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdateCourse('visibility', opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    course.visibility === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className={`w-5 h-5 mb-2 ${course.visibility === opt.value ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Access Rule */}
          <div>
            <label className="input-label">Access Rule</label>
            <div className="grid grid-cols-3 gap-3 mt-2">
              {[
                { value: 'Open', label: 'Open', icon: HiOutlineGlobeAlt, desc: 'Anyone can start' },
                { value: 'Invitation', label: 'On Invitation', icon: HiOutlineMail, desc: 'Invited users only' },
                { value: 'Paid', label: 'On Payment', icon: HiOutlineCreditCard, desc: 'Paid access' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleUpdateCourse('accessRule', opt.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    course.accessRule === opt.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <opt.icon className={`w-5 h-5 mb-2 ${course.accessRule === opt.value ? 'text-indigo-500' : 'text-gray-400'}`} />
                  <p className="font-semibold text-sm text-gray-800">{opt.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Price field (conditional) */}
          {course.accessRule === 'Paid' && (
            <div>
              <label className="input-label">Price</label>
              <div className="relative max-w-xs">
                <HiOutlineCurrencyDollar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="number"
                  value={course.price || ''}
                  onChange={(e) => handleUpdateCourse('price', Number(e.target.value))}
                  placeholder="29.99"
                  className="input-field pl-11"
                />
              </div>
            </div>
          )}

          {/* Course Admin */}
          <div>
            <label className="input-label">Course Admin / Responsible</label>
            <input
              type="text"
              value={course.responsible || ''}
              onChange={(e) => handleUpdateCourse('responsible', e.target.value)}
              placeholder="Responsible person name"
              className="input-field max-w-md"
            />
          </div>

          <div className="rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-700">Attendees</p>
            <p className="text-sm text-gray-500 mt-1">
              {course.attendees?.length || 0} enrolled, {course.invitedUsers?.length || 0} invited
            </p>
          </div>
        </div>
      )}

      {/* Quiz Tab */}
      {activeTab === 'quiz' && (
        <div className="card-elevated animate-fade-in">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Quizzes</h3>
            <button onClick={() => { resetQuizForm(); setShowQuizBuilder(true); }} className="btn-primary text-sm flex items-center gap-1.5">
              <HiOutlinePlus className="w-4 h-4" /> Add Quiz
            </button>
          </div>

          {course.quizzes?.length === 0 || !course.quizzes ? (
            <div className="text-center py-16 text-gray-400">
              <HiOutlinePuzzle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No quizzes yet</p>
              <p className="text-sm mt-1">Add a quiz to test learner knowledge</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {course.quizzes.map((quiz, i) => (
                <div key={quiz._id || i} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                      <HiOutlinePuzzle className="w-4 h-4 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{quiz.title || `Quiz ${i + 1}`}</p>
                      <p className="text-xs text-gray-500">{quiz.questions?.length || 0} questions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditQuiz(quiz)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                      <HiOutlinePencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setDeleteType('quiz'); setDeleteTarget(quiz); }} className="p-2 hover:bg-red-50 rounded-lg text-red-500">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lesson Editor Modal */}
      <Modal
        isOpen={showLessonModal}
        onClose={() => { setShowLessonModal(false); resetLessonForm(); }}
        title={editingLesson ? 'Edit Lesson' : 'Add New Lesson'}
        size="lg"
      >
        {/* Lesson Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: 'content', label: 'Content' },
            { id: 'description', label: 'Description' },
            { id: 'attachments', label: 'Attachments' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setLessonTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                lessonTab === t.id ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {lessonTab === 'content' && (
          <div className="space-y-4">
            <div>
              <label className="input-label">Lesson Title *</label>
              <input
                type="text"
                value={lessonForm.title}
                onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                className="input-field"
                placeholder="Enter lesson title"
              />
            </div>

            <div>
              <label className="input-label">Type</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'Video', label: 'Video', icon: HiOutlineVideoCamera, color: 'text-red-500' },
                  { value: 'Document', label: 'Document', icon: HiOutlineDocumentText, color: 'text-blue-500' },
                  { value: 'Image', label: 'Image', icon: HiImage, color: 'text-green-500' },
                ].map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setLessonForm({ ...lessonForm, type: t.value })}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                      lessonForm.type === t.value ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                    }`}
                  >
                    <t.icon className={`w-5 h-5 ${t.color}`} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Type-specific fields */}
            {lessonForm.type === 'Video' && (
              <>
                <div>
                  <label className="input-label">Video URL (YouTube/Drive)</label>
                  <input
                    type="url"
                    value={lessonForm.fileUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
                <div>
                  <label className="input-label">Duration (minutes)</label>
                  <input
                    type="number"
                    value={lessonForm.duration}
                    onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                    className="input-field max-w-[200px]"
                    placeholder="15"
                  />
                </div>
                <div>
                  <label className="input-label">Responsible</label>
                  <input
                    type="text"
                    value={lessonForm.responsible}
                    onChange={(e) => setLessonForm({ ...lessonForm, responsible: e.target.value })}
                    className="input-field"
                    placeholder="Instructor or content owner"
                  />
                </div>
              </>
            )}

            {(lessonForm.type === 'Document' || lessonForm.type === 'Image') && (
              <>
                <div>
                  <label className="input-label">Upload {lessonForm.type === 'Document' ? 'Document' : 'Image'}</label>
                  <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer block">
                    <HiOutlineUpload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                    <input
                      type="file"
                      className="hidden"
                      accept={lessonForm.type === 'Image' ? 'image/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleUploadLessonFile(file, lessonForm.type === 'Image' ? 'image' : 'raw');
                        }
                        e.target.value = '';
                      }}
                    />
                  </label>
                  {uploadingLessonFile && (
                    <p className="text-sm text-indigo-600 mt-2">Uploading file...</p>
                  )}
                  {lessonForm.fileUrl && (
                    <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
                      <p className="text-sm font-medium text-emerald-700">Uploaded and attached</p>
                      <p className="text-xs text-emerald-600 mt-1 break-all">
                        {lessonForm.fileOriginalName || lessonForm.fileUrl}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-400 mt-2">Or paste a URL:</p>
                  <input
                    type="url"
                    value={lessonForm.fileUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                    className="input-field mt-1"
                    placeholder="https://example.com/file.pdf"
                  />
                </div>
                <div>
                  <label className="input-label">Responsible</label>
                  <input
                    type="text"
                    value={lessonForm.responsible}
                    onChange={(e) => setLessonForm({ ...lessonForm, responsible: e.target.value })}
                    className="input-field"
                    placeholder="Instructor or content owner"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLessonForm({ ...lessonForm, allowDownload: !lessonForm.allowDownload })}
                    className={`relative w-11 h-6 rounded-full transition-all ${lessonForm.allowDownload ? 'bg-indigo-500' : 'bg-gray-300'}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${lessonForm.allowDownload ? 'left-5.5' : 'left-0.5'}`} style={{ left: lessonForm.allowDownload ? '22px' : '2px' }} />
                  </button>
                  <label className="text-sm font-medium text-gray-700">Allow Download</label>
                </div>
              </>
            )}
          </div>
        )}

        {lessonTab === 'description' && (
          <div>
            <label className="input-label">Lesson Description</label>
            <textarea
              value={lessonForm.description}
              onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
              className="input-field min-h-[200px] resize-y"
              placeholder="Describe what this lesson covers..."
            />
          </div>
        )}

        {lessonTab === 'attachments' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Add extra resources for this lesson</p>
            {lessonForm.attachments.map((att, i) => (
              <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                <HiOutlineLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={typeof att === 'string' ? att : att.url}
                  onChange={(e) => {
                    const newAtt = [...lessonForm.attachments];
                    const currentValue = typeof newAtt[i] === 'string' ? { title: '', url: newAtt[i] } : newAtt[i];
                    newAtt[i] = { ...currentValue, url: e.target.value };
                    setLessonForm({ ...lessonForm, attachments: newAtt });
                  }}
                  className="flex-1 bg-transparent outline-none text-sm"
                  placeholder="URL or file name"
                />
                {typeof att !== 'string' && att.originalName && (
                  <span className="text-xs text-emerald-600 whitespace-nowrap">
                    {att.originalName}
                  </span>
                )}
                <button
                  onClick={() => setLessonForm({ ...lessonForm, attachments: lessonForm.attachments.filter((_, j) => j !== i) })}
                  className="text-red-400 hover:text-red-600"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setLessonForm({
                ...lessonForm,
                attachments: [...lessonForm.attachments, { title: '', url: '', publicId: '', resourceType: 'raw', originalName: '' }],
              })}
              className="btn-secondary text-sm"
            >
              <HiOutlinePlus className="w-4 h-4 mr-1 inline" /> Add Attachment
            </button>
            <label className="btn-secondary text-sm inline-flex items-center cursor-pointer">
              <HiOutlineUpload className="w-4 h-4 mr-1 inline" /> {uploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleUploadAttachment(file);
                  }
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        )}

        {/* Save */}
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => { setShowLessonModal(false); resetLessonForm(); }} className="btn-secondary">Cancel</button>
          <button onClick={handleSaveLesson} className="btn-primary">
            {editingLesson ? 'Update Lesson' : 'Add Lesson'}
          </button>
        </div>
      </Modal>

      {/* Quiz Builder Modal */}
      <Modal
        isOpen={showQuizBuilder}
        onClose={() => { setShowQuizBuilder(false); resetQuizForm(); }}
        title={editingQuiz ? 'Edit Quiz' : 'Quiz Builder'}
        size="xl"
      >
        <div className="mb-5">
          <label className="input-label">Quiz Title *</label>
          <input
            type="text"
            value={quizForm.title}
            onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
            className="input-field"
            placeholder="Enter quiz title"
          />
        </div>
        <div className="flex gap-6 min-h-[500px]">
          {/* Left Panel - Question List */}
          <div className="w-56 border-r border-gray-100 pr-4 space-y-2 flex-shrink-0">
            <p className="text-xs font-semibold text-gray-500 mb-3">QUESTIONS</p>
            {quizForm.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveQuestion(i)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeQuestion === i ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                Question {i + 1}
              </button>
            ))}
            <button
              onClick={() => {
                setQuizForm({
                  ...quizForm,
                  questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0 }],
                });
                setActiveQuestion(quizForm.questions.length);
              }}
              className="w-full btn-secondary text-sm py-2"
            >
              <HiOutlinePlus className="w-4 h-4 mr-1 inline" /> Add Question
            </button>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-3">REWARDS</p>
              {[
                { key: 'firstAttempt', label: '1st try' },
                { key: 'secondAttempt', label: '2nd try' },
                { key: 'thirdAttempt', label: '3rd try' },
                { key: 'fourthAndMore', label: '4th+ try' },
              ].map((r) => (
                <div key={r.key} className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500">{r.label}</span>
                  <input
                    type="number"
                    value={quizForm.rewards[r.key]}
                    onChange={(e) => setQuizForm({
                      ...quizForm,
                      rewards: { ...quizForm.rewards, [r.key]: Number(e.target.value) },
                    })}
                    className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Question Editor */}
          <div className="flex-1 space-y-4">
            <div>
              <label className="input-label">Question {activeQuestion + 1}</label>
              <textarea
                value={quizForm.questions[activeQuestion]?.question || ''}
                onChange={(e) => {
                  const q = [...quizForm.questions];
                  q[activeQuestion] = { ...q[activeQuestion], question: e.target.value };
                  setQuizForm({ ...quizForm, questions: q });
                }}
                className="input-field min-h-[80px]"
                placeholder="Type your question here..."
              />
            </div>

            <div>
              <label className="input-label">Options</label>
              <div className="space-y-3">
                {quizForm.questions[activeQuestion]?.options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        const q = [...quizForm.questions];
                        q[activeQuestion] = { ...q[activeQuestion], correctAnswer: i };
                        setQuizForm({ ...quizForm, questions: q });
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                        quizForm.questions[activeQuestion]?.correctAnswer === i
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {quizForm.questions[activeQuestion]?.correctAnswer === i && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => {
                        const q = [...quizForm.questions];
                        q[activeQuestion].options[i] = e.target.value;
                        setQuizForm({ ...quizForm, questions: q });
                      }}
                      className="input-field flex-1"
                      placeholder={`Option ${i + 1}`}
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => {
                  const q = [...quizForm.questions];
                  q[activeQuestion].options.push('');
                  setQuizForm({ ...quizForm, questions: q });
                }}
                className="btn-ghost text-sm mt-3"
              >
                <HiOutlinePlus className="w-4 h-4 mr-1 inline" /> Add Option
              </button>
            </div>

            {quizForm.questions.length > 1 && (
              <button
                onClick={() => {
                  const q = quizForm.questions.filter((_, i) => i !== activeQuestion);
                  setQuizForm({ ...quizForm, questions: q });
                  setActiveQuestion(Math.max(0, activeQuestion - 1));
                }}
                className="text-sm text-red-500 hover:text-red-600"
              >
                <HiOutlineTrash className="w-4 h-4 mr-1 inline" /> Remove this question
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button onClick={() => { setShowQuizBuilder(false); resetQuizForm(); }} className="btn-secondary">Cancel</button>
          <button onClick={handleSaveQuiz} className="btn-primary">{editingQuiz ? 'Update Quiz' : 'Save Quiz'}</button>
        </div>
      </Modal>

      <Modal
        isOpen={showAttendeeModal}
        onClose={() => setShowAttendeeModal(false)}
        title="Add Attendees"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Select learners or instructors to invite to this course.</p>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {availableUsers.map((userOption) => (
              <label key={userOption._id} className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(userOption._id)}
                  onChange={() => {
                    setSelectedUserIds((prev) =>
                      prev.includes(userOption._id)
                        ? prev.filter((idValue) => idValue !== userOption._id)
                        : [...prev, userOption._id]
                    );
                  }}
                />
                <div>
                  <p className="text-sm font-semibold text-gray-800">{userOption.name}</p>
                  <p className="text-xs text-gray-500">{userOption.email} • {userOption.role}</p>
                </div>
              </label>
            ))}
            {availableUsers.length === 0 && (
              <p className="text-sm text-gray-400">No users available</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowAttendeeModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleAddAttendees} className="btn-primary">Save Attendees</button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        title="Contact Attendees"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">Subject</label>
            <input
              type="text"
              value={contactForm.subject}
              onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
              className="input-field"
              placeholder="Course update"
            />
          </div>
          <div>
            <label className="input-label">Message</label>
            <textarea
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              className="input-field min-h-[180px]"
              placeholder="Write your message to attendees"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowContactModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleContactAttendees} className="btn-primary">Save Message</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteType === 'quiz') {
            handleDeleteQuiz(deleteTarget._id);
          } else {
            handleDeleteLesson(deleteTarget._id);
          }
          setDeleteTarget(null);
        }}
        title={deleteType === 'quiz' ? 'Delete Quiz' : 'Delete Lesson'}
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default CourseForm;

/*
============================================
BACKEND API REQUIRED:
============================================

POST   /api/courses/:id/quizzes
Body: { title, questions: [{ question, options: [], correctAnswer }], rewards: { firstAttempt, secondAttempt, thirdAttempt, fourthAndMore } }

PUT    /api/courses/:id/quizzes/:quizId
DELETE /api/courses/:id/quizzes/:quizId

PATCH  /api/courses/:id
Body: { addAttendee: "email@example.com" }
→ Backend should send invitation email and add user to attendees array

POST   /api/courses/:id/contact-attendees
Body: { message: "..." }
→ Backend should email all attendees

POST   /api/courses/:id/upload-image
Body: FormData with 'image' field
→ Returns: { imageUrl: "https://..." }

============================================
*/
