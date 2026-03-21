import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Auth
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import CourseForm from './pages/admin/CourseForm';
import Reporting from './pages/admin/Reporting';

// Learner
import LearnerLayout from './components/learner/LearnerLayout';
import Home from './pages/learner/Home';
import MyCourses from './pages/learner/MyCourses';
import CourseDetail from './pages/learner/CourseDetail';
import LearningPage from './pages/learner/LearningPage';

// Common
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#1e293b',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin', 'instructor']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="courses" element={<AdminDashboard />} />
          <Route path="courses/:id" element={<CourseForm />} />
          <Route path="reporting" element={<Reporting />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* Learner Routes */}
        <Route path="/" element={<LearnerLayout />}>
          <Route index element={<Home />} />
          <Route path="courses" element={<Home />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route
            path="my-courses"
            element={
              <ProtectedRoute roles={['learner']}>
                <MyCourses />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Full-screen Learning Page */}
        <Route
          path="/learn/:id"
          element={
            <ProtectedRoute>
              <LearningPage />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;