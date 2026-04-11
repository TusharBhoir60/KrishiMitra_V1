import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authApi } from '../../api/endpoints/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export const Login = () => {
  const { t } = useLanguage();
  const [showPwd, setShowPwd] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await authApi.login({ email, password });
      dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
      toast.success(`Welcome back, ${res.data.user.name || res.data.user.role}!`);
      navigate(`/${res.data.user.role}/dashboard`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-farm-cream flex items-center justify-center p-6 pb-24">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
        <div className="flex justify-center mb-8">
          <Link to="/" className="font-display text-2xl font-bold text-farm-green flex items-center gap-2">
            <div className="w-8 h-8 bg-farm-green text-white rounded-full flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C8.686 2 6 4.686 6 8C6 11.314 12 22 12 22C12 22 18 11.314 18 8C18 4.686 15.314 2 12 2Z" />
              </svg>
            </div>
            KrishiMitra
          </Link>
        </div>
        
        <h2 className="font-display text-3xl text-farm-dark mb-6 text-center">{t('auth.welcomeBack')}</h2>
        
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block font-display text-gray-700 mb-2">{t('auth.email')}</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-farm-gold" 
              placeholder="farmer@demo.com"
            />
            <p className="text-xs text-gray-400 mt-1">Hint: Type 'admin', 'buyer', or 'transporter' in email to login to specific roles.</p>
          </div>
          
          <div>
            <label className="block font-display text-gray-700 mb-2">{t('auth.password')}</label>
            <div className="relative">
              <input 
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 font-body focus:outline-none focus:ring-2 focus:ring-farm-gold" 
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
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-farm-green text-white rounded-lg py-3 font-body font-semibold hover:bg-farm-mid transition-colors mt-2"
          >
            {t('auth.login')}
          </button>
        </form>
        
        <div className="mt-6 text-center font-body text-gray-600">
          {t('auth.noAccount')} <Link to="/register" className="text-farm-green font-semibold hover:underline">{t('auth.createAccount')} →</Link>
        </div>
      </div>
    </div>
  );
};
