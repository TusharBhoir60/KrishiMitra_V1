import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';
import {
  User, LogOut, Phone, MapPin, Edit3, Save, X, ChevronRight,
  Star, ShoppingCart, FileText, Settings, ShieldCheck,
} from 'lucide-react';
import { useDispatch } from 'react-redux';
import { logout, updateUser } from '../../store/slices/authSlice';
import { authApi } from '../../api/endpoints/authApi';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const BuyerProfile = () => {
  const { user } = useAuth();
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

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-10 md:px-10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative flex items-center gap-5">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-white text-3xl font-display font-bold border-2 border-white/30 shadow-lg">
            {displayName.charAt(0)}
          </div>
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-widest mb-0.5">Buyer Profile</p>
            <h1 className="text-2xl font-display font-bold text-white">{displayName}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              {user?.phone && (
                <span className="flex items-center gap-1 text-blue-100 text-xs">
                  <Phone size={11} /> {user.phone}
                </span>
              )}
              {user?.location?.district && (
                <span className="flex items-center gap-1 text-blue-100 text-xs">
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
              <Edit3 size={15} /> Edit
            </button>
          )}
        </div>

        {user?.isVerified && (
          <div className="relative mt-4 inline-flex items-center gap-1.5 bg-white/20 px-3 py-1 rounded-full text-white text-xs font-semibold">
            <ShieldCheck size={13} /> Verified
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: ShoppingCart, label: 'Orders', value: user?.orderCount ?? '–' },
            { icon: Star, label: 'Rating', value: user?.rating > 0 ? `${user.rating}★` : '–' },
            { icon: FileText, label: 'Rank', value: user?.rank || 'Member' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 text-center">
              <s.icon size={20} className="text-blue-600 mx-auto mb-1.5" />
              <p className="text-lg font-bold text-farm-dark">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Profile Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-farm-dark text-sm">Personal Information</h2>
            {editing && (
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors"
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Save size={13} /> Save
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-gray-50">
            {[
              { label: 'Full Name', icon: User, field: 'name', type: 'text' },
              { label: 'Phone', icon: Phone, field: 'phone', type: 'tel' },
              { label: 'Business Name', icon: FileText, field: 'businessName', type: 'text' },
              { label: 'Business Type', icon: FileText, field: 'businessType', type: 'text', placeholder: 'e.g., Restaurant, Retailer' },
              { label: 'District', icon: MapPin, field: 'district', type: 'text' },
              { label: 'State', icon: MapPin, field: 'state', type: 'text' },
            ].map(({ label, icon: Icon, field, type, placeholder }) => (
              <div key={field} className="flex items-center px-6 py-4 gap-4">
                <Icon size={17} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  {editing ? (
                    <input
                      type={type}
                      value={form[field]}
                      placeholder={placeholder || label}
                      onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                      className="w-full text-sm font-medium text-farm-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition"
                    />
                  ) : (
                    <p className="text-sm font-medium text-farm-dark">
                      {form[field] || <span className="text-gray-400 italic">Not provided</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {/* Delivery Address */}
            <div className="flex items-start px-6 py-4 gap-4">
              <MapPin size={17} className="text-gray-400 shrink-0 mt-1" />
              <div className="flex-1">
                <p className="text-xs text-gray-400 mb-0.5">Delivery Address</p>
                {editing ? (
                  <textarea
                    rows={3}
                    value={form.deliveryAddress}
                    placeholder="Your primary delivery address..."
                    onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))}
                    className="w-full text-sm font-medium text-farm-dark bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition resize-none"
                  />
                ) : (
                  <p className="text-sm text-farm-dark">
                    {form.deliveryAddress || <span className="text-gray-400 italic">Not provided</span>}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Settings links */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {[
            { label: 'Account Settings', icon: Settings, to: null },
            { label: 'Payment Methods', icon: FileText, to: null },
          ].map(({ label, icon: Icon, to }) => (
            <button
              key={label}
              onClick={to ? () => navigate(to) : undefined}
              className="w-full flex items-center justify-between px-6 py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-center gap-3 text-farm-dark font-medium text-sm">
                <Icon size={17} className="text-gray-400" /> {label}
              </div>
              <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl border border-red-100 transition-colors flex justify-center items-center gap-2 text-sm"
        >
          <LogOut size={17} /> Sign Out
        </button>
      </div>
    </div>
  );
};
