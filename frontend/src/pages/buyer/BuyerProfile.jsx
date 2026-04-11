import { useAuth } from '../../hooks/useAuth';
import { useState, createElement } from 'react';
import {
  User, LogOut, Phone, MapPin, Edit3, Save, X, ChevronRight,
  Star, ShoppingCart, FileText, Settings, ShieldCheck,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { authApi } from '../../api/endpoints/authApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

export const BuyerProfile = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || user?.fullName || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    businessType: user?.businessType || '',
    deliveryAddress: user?.deliveryAddress || '',
    district: user?.location?.district || '',
    state: user?.location?.state || 'Maharashtra',
  });

  const handleSave = async () => {
    try {
      const updated = await authApi.updateProfile({
        name: form.name,
        phone: form.phone,
        businessName: form.businessName,
        businessType: form.businessType,
        deliveryAddress: form.deliveryAddress,
        location: { district: form.district, state: form.state },
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
  const businessLabel = user?.businessType || t('buyer.profile.businessType');
  const locationLabel = [user?.location?.district, user?.location?.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef5ff] via-white to-[#f8fafc] pb-20 md:pb-8">

      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1d4ed8] via-[#2563eb] to-[#0f766e] px-6 py-10 md:px-10">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative flex items-center gap-5">
          <div className="flex h-22 w-22 items-center justify-center rounded-[1.5rem] border-2 border-white/25 bg-white/15 text-3xl font-display font-bold text-white shadow-lg backdrop-blur-sm">
            {displayName.charAt(0)}
          </div>
          <div className="min-w-0">
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-0.5">{t('buyer.profile.title')}</p>
            <h1 className="text-2xl font-display font-bold text-white">{displayName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              {user?.phone && (
                <span className="flex items-center gap-1 text-blue-50 text-xs">
                  <Phone size={11} /> {user.phone}
                </span>
              )}
              {locationLabel && (
                <span className="flex items-center gap-1 text-blue-50 text-xs">
                  <MapPin size={11} /> {locationLabel}
                </span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {businessLabel && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {businessLabel}
                </span>
              )}
              {user?.businessName && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {user.businessName}
                </span>
              )}
            </div>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="ml-auto flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              <Edit3 size={15} /> {t('buyer.profile.edit')}
            </button>
          )}
        </div>

        {user?.isVerified && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <ShieldCheck size={13} /> {t('farmer.dashboard.verified')}
          </div>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5 sm:px-6">

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { icon: ShoppingCart, label: 'Orders', value: user?.orderCount ?? '–' },
            { icon: Star, label: 'Rating', value: user?.rating > 0 ? `${user.rating}★` : '–' },
            { icon: FileText, label: 'Rank', value: user?.rank || 'Member' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl border border-blue-100 bg-white p-4 text-center shadow-sm">
              <s.icon size={20} className="mx-auto mb-1.5 text-blue-600" />
              <p className="text-lg font-bold text-farm-dark">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Info Card */}
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-farm-dark text-sm">{t('buyer.profile.personalInfo')}</h2>
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
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Save size={13} /> {t('common.save')}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {[
              { label: t('buyer.profile.fullName'), icon: User, field: 'name', type: 'text' },
              { label: t('buyer.profile.phone'), icon: Phone, field: 'phone', type: 'tel' },
              { label: t('buyer.profile.businessName'), icon: FileText, field: 'businessName', type: 'text' },
              { label: t('buyer.profile.businessType'), icon: FileText, field: 'businessType', type: 'text', placeholder: 'e.g., Restaurant, Retailer' },
              { label: t('buyer.profile.district'), icon: MapPin, field: 'district', type: 'text' },
              { label: t('buyer.profile.state'), icon: MapPin, field: 'state', type: 'text' },
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
                      className="w-full rounded-lg border border-gray-200 bg-blue-50/30 px-3 py-1.5 text-sm font-medium text-farm-dark transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  ) : (
                    <p className="text-sm font-medium text-farm-dark">
                      {form[field] || <span className="text-gray-400 italic">{t('buyer.profile.notProvided')}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Delivery Address */}
            <div className="flex items-start px-6 py-4 gap-4">
              <MapPin size={17} className="text-gray-400 shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">{t('buyer.profile.deliveryAddress')}</p>
                {editing ? (
                  <textarea
                    rows={3}
                    value={form.deliveryAddress}
                    placeholder="Your primary delivery address..."
                    onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-blue-50/30 px-3 py-1.5 text-sm font-medium text-farm-dark transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                ) : (
                  <p className="text-sm text-farm-dark">
                    {form.deliveryAddress || <span className="text-gray-400 italic">{t('buyer.profile.noDeliveryAddress')}</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings links */}
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
          {[
            { label: t('buyer.profile.accountSettings'), icon: Settings, to: null },
            { label: t('buyer.profile.paymentMethods'), icon: FileText, to: null },
          ].map(({ label, icon, to }) => (
            <button
              key={label}
              onClick={to ? () => navigate(to) : undefined}
              className="group flex w-full items-center justify-between border-b border-gray-50 px-6 py-4 transition-colors last:border-b-0 hover:bg-blue-50/50"
            >
              <div className="flex items-center gap-3 text-sm font-medium text-farm-dark">
                {createElement(icon, { size: 17, className: 'text-blue-500' })} {label}
              </div>
              <ChevronRight size={16} className="text-gray-300 transition-colors group-hover:text-blue-600" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
        >
          <LogOut size={17} /> {t('common.signOut')}
        </button>
      </div>
    </div>
  );
};
