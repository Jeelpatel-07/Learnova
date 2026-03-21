import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import API from '../../api/axios';
import {
  HiOutlineAcademicCap,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineKey,
  HiOutlineShieldCheck,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const AdminSignup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    adminKey: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      toast.error('Use 8+ chars with upper, lower, and special character');
      return;
    }

    if (!form.adminKey.trim()) {
      toast.error('Admin secret key is required');
      return;
    }

    setLoading(true);
    try {
      const res = await API.post('/auth/admin-signup', {
        name: form.name,
        email: form.email,
        password: form.password,
        adminKey: form.adminKey,
      });

      const { token, user } = res.data.data;
      localStorage.setItem('learnova_token', token);
      localStorage.setItem('learnova_user', JSON.stringify(user));

      // Update zustand store
      useAuthStore.setState({
        user,
        token,
        isAuthenticated: true,
      });

      toast.success(`Welcome, Admin ${user.name}! 🛡️`);
      navigate('/admin/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Admin signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 to-indigo-900 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold">Learnova Admin</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Admin<br />Registration
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Create an administrator account with full access to the backoffice, course management, reporting, and platform settings.
          </p>

          <div className="mt-12 space-y-4">
            {[
              '🛡️ Full platform access',
              '📊 Reporting & analytics',
              '👥 User management',
              '⚙️ System settings',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-white/80">
                <span className="text-lg">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-indigo-700 rounded-xl flex items-center justify-center">
              <HiOutlineShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">Admin Signup</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create Admin Account</h2>
            <p className="text-gray-500 mt-1.5">You need the admin secret key to register</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Admin Secret Key</label>
              <div className="relative">
                <HiOutlineKey className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                <input
                  type="password"
                  name="adminKey"
                  value={form.adminKey}
                  onChange={handleChange}
                  placeholder="Enter the admin secret key"
                  className="input-field pl-11 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Admin Name"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="admin@learnova.com"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="8+ chars, upper, lower, special"
                  className="input-field pl-11 pr-11"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <HiOutlineEyeOff className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Confirm Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  className="input-field pl-11"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-base font-semibold rounded-xl text-white bg-gradient-to-r from-slate-700 to-indigo-700 hover:from-slate-800 hover:to-indigo-800 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? 'Creating Admin Account...' : 'Create Admin Account'}
            </button>
          </form>

          <div className="text-center mt-6 space-y-2">
            <p className="text-sm text-gray-500">
              Not an admin?{' '}
              <Link to="/signup" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Sign up as Learner/Instructor
              </Link>
            </p>
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
