import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import {
  HiOutlineAcademicCap,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineUser,
  HiOutlineEye,
  HiOutlineEyeOff,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { getPostAuthRoute } from '../../utils/helpers';

const Signup = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Learner',
  });
  const [showPassword, setShowPassword] = useState(false);
  const { signup, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/.test(form.password)) {
      toast.error('Use 8+ chars with upper, lower, and special character');
      return;
    }

    try {
      const { confirmPassword, ...payload } = form;
      const user = await signup(payload);
      toast.success(`Welcome to Learnova, ${user.name}!`);
      navigate(getPostAuthRoute(user.role));
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Signup failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-indigo-700 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-32 left-16 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-16 right-16 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center">
              <HiOutlineAcademicCap className="w-7 h-7" />
            </div>
            <span className="text-3xl font-bold">Learnova</span>
          </div>
          <h1 className="text-4xl font-bold mb-4 leading-tight">
            Start your
            <br />
            learning journey.
          </h1>
          <p className="text-lg text-white/70 max-w-md">
            Join learners and instructors, build skills, and track progress in one place.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">Learnova</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
            <p className="text-gray-500 mt-1.5">Start learning in minutes</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
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
                  placeholder="you@example.com"
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
                  placeholder="Use 8+ chars with upper, lower, and special character"
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

            <div>
              <label className="input-label">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'Learner', label: 'Learn', desc: 'Browse and take courses' },
                  { value: 'Instructor', label: 'Teach', desc: 'Create and manage courses' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: option.value })}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      form.role === option.value
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <p className="font-semibold text-gray-800">{option.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
