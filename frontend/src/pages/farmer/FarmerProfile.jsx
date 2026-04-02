import { useAuth } from '../../hooks/useAuth';
import { useState, createElement } from 'react';
import {
  User, LogOut, FileText, Settings, ShieldCheck,
  Phone, MapPin, Tractor, Edit3, Save, X, ChevronRight,
  Star, Package, ShoppingCart,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { authApi } from '../../api/endpoints/authApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { FarmerProfileReviews } from '../../components/sections/FarmerProfileReviews';

export const FarmerProfile = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:      user?.name     || user?.fullName || '',
    phone:     user?.phone    || '',
    district:  user?.location?.district || '',
    state:     user?.location?.state    || 'Maharashtra',
    farmType:  user?.farmType || '',
    farmSize:  user?.farmSize || '',
    bio:       user?.bio      || '',
  });

  const handleSave = async () => {
    try {
      const updated = await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        location: { district: form.district, state: form.state },
        farmSize: form.farmSize ? Number(form.farmSize) : undefined,
        farmingType: form.farmType || undefined,
      });
      dispatch(updateUser(updated.data));
      toast.success('Profile updated!');
      setEditing(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const displayName = user?.name || user?.fullName || '?';

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-farm-green to-farm-mid px-6 py-10 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-display font-bold border-2 border-white/30 shadow-lg">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="text-farm-pale/70 text-xs font-semibold uppercase tracking-widest mb-0.5">{t('farmer.profile.title')}</p>
            <h1 className="text-2xl font-display font-bold text-white">{displayName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              {user?.phone && (
                <span className="flex items-center gap-1 text-farm-pale/90 text-xs">
                  <Phone size={11} /> {user.phone}
                </span>
              )}
              {user?.location?.district && (
                <span className="flex items-center gap-1 text-farm-pale/90 text-xs">
                  <MapPin size={11} /> {user.location.district}
                </span>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/20"
            >
              <Edit3 size={15} /> {t('farmer.profile.edit')}
            </button>
          )}
        </div>

        {user?.isVerified && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-white text-xs font-semibold">
            <ShieldCheck size={13} /> {t('farmer.dashboard.verified')}
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package,      label: 'Listings',  value: user?.listingCount ?? '–' },
            { icon: ShoppingCart, label: 'Orders',    value: user?.orderCount   ?? '–' },
            { icon: Star,         label: 'Rating',    value: user?.rating > 0 ? `${user.rating}★` : '–' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <s.icon size={20} className="text-farm-green mx-auto mb-1.5" />
              <p className="text-lg font-bold text-farm-dark">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-farm-dark text-sm">{t('farmer.profile.personalInfo')}</h2>
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <X size={13} /> {t('common.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 bg-farm-green hover:bg-farm-dark text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Save size={13} /> {t('common.save')}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {[
              { label: t('farmer.profile.fullName'), icon: User, field: 'name', type: 'text' },
              { label: t('farmer.profile.phone'), icon: Phone, field: 'phone', type: 'tel'  },
              { label: t('farmer.profile.district'), icon: MapPin, field: 'district', type: 'text' },
              { label: t('farmer.profile.state'), icon: MapPin, field: 'state', type: 'text' },
              { label: t('farmer.profile.farmType'), icon: Tractor, field: 'farmType', type: 'text', placeholder: 'e.g. Mixed, Organic, Cash Crops' },
              { label: t('farmer.profile.farmSize'), icon: Tractor, field: 'farmSize', type: 'text', placeholder: 'e.g. 5 acres' },
            ].map(({ label, icon, field, type, placeholder }) => (
              <div key={field} className="flex items-center px-6 py-4 gap-4">
                {createElement(icon, { size: 17, className: 'text-gray-400 shrink-0' })}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  {editing ? (
                    <input
                      type={type}
                      value={form[field]}
                      placeholder={placeholder || label}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full text-sm font-medium text-farm-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-farm-green/30 focus:border-farm-green transition"
                    />
                  ) : (
                    <p className="text-sm font-medium text-farm-dark">
                      {form[field] || <span className="text-gray-400 italic">{t('farmer.profile.notProvided')}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Bio */}
            <div className="flex items-start px-6 py-4 gap-4">
              <FileText size={17} className="text-gray-400 shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{t('farmer.profile.bio')}</p>
                {editing ? (
                  <textarea
                    rows={3}
                    value={form.bio}
                    placeholder="Tell buyers about your farm..."
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    className="w-full text-sm font-medium text-farm-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-farm-green/30 focus:border-farm-green transition resize-none"
                  />
                ) : (
                  <p className="text-sm text-farm-dark">
                    {form.bio || <span className="text-gray-400 italic">{t('farmer.profile.noBio')}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <FarmerProfileReviews
          farmerId={user?._id}
          farmerName={displayName}
          farmerLocation={user?.location?.district ? `${user.location.district}, ${user.location.state || 'Maharashtra'}` : ''}
        />

        {/* Settings links */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {[
            { label: t('farmer.profile.accountSettings'), icon: Settings, to: null },
            { label: t('farmer.profile.paymentBank'), icon: FileText, to: null },
          ].map(({ label, icon, to }) => (
            <button
              key={label}
              onClick={to ? () => navigate(to) : undefined}
              className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-farm-dark font-medium text-sm">
                {createElement(icon, { size: 17, className: 'text-gray-400' })} {label}
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-farm-green transition-colors" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border border-red-100 transition-colors flex justify-center items-center gap-2 text-sm"
        >
          <LogOut size={17} /> {t('common.signOut')}
        </button>
      </div>
    </div>
  );
};