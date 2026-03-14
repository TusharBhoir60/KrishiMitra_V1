import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authApi } from '../../api/endpoints/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { getRoleHomePath } from '../../utils/authRedirect';

export const Login = () => {
  const [mode, setMode] = useState('signin');
  const [showPwd, setShowPwd] = useState(false);
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const panelTitle = useMemo(() => {
    return mode === 'signin' ? 'Sign in to KrishiMitra' : 'Create your KrishiMitra account';
  }, [mode]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (!storedUser && !storedRole) return;

    try {
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const resolvedRole = parsedUser?.role || storedRole;
      if (resolvedRole) {
        navigate(getRoleHomePath(resolvedRole), { replace: true });
      }
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('role');
    }
  }, [navigate]);

  const validateForm = () => {
    const nextErrors = {};
    if (mode === 'signup' && !fullName.trim()) {
      nextErrors.fullName = 'Full Name is required';
    }
    if (!identifier.trim()) {
      nextErrors.identifier = 'Email or Phone is required';
    }
    if (!password.trim()) {
      nextErrors.password = 'Password is required';
    }
    if (!role) {
      nextErrors.role = 'Please select your role';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        role,
        password,
        identifier,
        email: identifier,
      };

      const res = mode === 'signin'
        ? await authApi.login(payload)
        : await authApi.register({ ...payload, name: fullName, fullName });

      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      localStorage.setItem('role', role);
      toast.success(mode === 'signin' ? 'Signed in successfully.' : 'Account created successfully.');
      navigate(getRoleHomePath(res.data.user.role || role), { replace: true });
    } catch {
      toast.error(mode === 'signin' ? 'Sign in failed.' : 'Sign up failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-farm-pale to-white flex items-center justify-center p-6 pb-20">
      <div className="bg-white/95 backdrop-blur-sm p-8 rounded-3xl shadow-2xl shadow-farm-green/10 border border-green-100 max-w-md w-full">
        <div className="flex justify-center mb-7">
          <Link to="/" className="font-display text-2xl font-bold text-farm-green flex items-center gap-2">
            <div className="w-8 h-8 bg-farm-green text-white rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.686 2 6 4.686 6 8C6 11.314 12 22 12 22C12 22 18 11.314 18 8C18 4.686 15.314 2 12 2Z" />
              </svg>
            </div>
            KrishiMitra
          </Link>
        </div>

        <div className="grid grid-cols-2 p-1 rounded-2xl bg-green-50 mb-6">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${mode === 'signin' ? 'bg-farm-green text-white shadow-md' : 'text-farm-green hover:bg-green-100'}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${mode === 'signup' ? 'bg-farm-green text-white shadow-md' : 'text-farm-green hover:bg-green-100'}`}
          >
            Create Account
          </button>
        </div>

        <h2 className="font-display text-3xl text-farm-dark mb-6 text-center">{panelTitle}</h2>

        <form onSubmit={handleAuthSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block font-display text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 font-body outline-none transition-all focus:ring-2 focus:ring-farm-green/30 ${errors.fullName ? 'border-red-400' : 'border-gray-300 hover:border-farm-green/50 focus:border-farm-green'}`}
                placeholder="Enter your full name"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
          )}

          <div>
            <label className="block font-display text-gray-700 mb-2">Email or Phone</label>
            <input 
              type="text"
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 font-body outline-none transition-all focus:ring-2 focus:ring-farm-green/30 ${errors.identifier ? 'border-red-400' : 'border-gray-300 hover:border-farm-green/50 focus:border-farm-green'}`}
              placeholder="name@email.com or 9876543210"
            />
            {errors.identifier && <p className="text-red-500 text-xs mt-1">{errors.identifier}</p>}
          </div>

          <div>
            <label className="block font-display text-gray-700 mb-2">Password</label>
            <div className="relative">
              <input 
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full border rounded-xl px-4 py-3 font-body outline-none transition-all focus:ring-2 focus:ring-farm-green/30 ${errors.password ? 'border-red-400' : 'border-gray-300 hover:border-farm-green/50 focus:border-farm-green'}`}
                placeholder="••••••••"
              />
              <button 
                type="button" 
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPwd ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block font-display text-gray-700 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={`w-full border rounded-xl px-4 py-3 font-body outline-none transition-all bg-white focus:ring-2 focus:ring-farm-green/30 ${errors.role ? 'border-red-400' : 'border-gray-300 hover:border-farm-green/50 focus:border-farm-green'}`}
            >
              <option value="buyer">Buyer</option>
              <option value="farmer">Farmer</option>
            </select>
            {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-farm-green text-white rounded-xl py-3 font-body font-semibold hover:bg-farm-mid transition-all hover:shadow-lg hover:shadow-farm-green/20 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {isSubmitting ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center font-body text-gray-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setMode('signin')}
            className="text-farm-green font-semibold hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
