import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDispatch } from 'react-redux';
import { authApi } from '../../api/endpoints/authApi';
import { setCredentials } from '../../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { districtList } from '../../utils/districtList';
import { useLanguage } from '../../context/LanguageContext';

const schema = yup.object().shape({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone: yup.string().matches(/^[0-9]{10}$/, 'Must be 10 digits').required('Phone is required'),
  district: yup.string().required('District is required'),
  password: yup.string().min(8, 'Minimum 8 characters').required('Password is required'),
  confirmPassword: yup.string().oneOf([yup.ref('password'), null], 'Passwords must match').required('Confirm password is required'),
  businessName: yup.string().when('role', {
    is: 'buyer',
    then: () => yup.string().required('Business name is required')
  }),
  businessType: yup.string().when('role', {
    is: 'buyer',
    then: () => yup.string().required('Business type is required')
  }),
  deliveryAddress: yup.string().when('role', {
    is: 'buyer',
    then: () => yup.string().required('Delivery address is required')
  }),
  companyName: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('Company name is required')
  }),
  vehicleType: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('Vehicle type is required')
  }),
  vehicleNumber: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('Vehicle number is required')
  }),
  licenseNumber: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('License number is required')
  }),
  serviceAreas: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('Service areas is required')
  }),
  maxLoadCapacity: yup.string().when('role', {
    is: 'transporter',
    then: () => yup.string().required('Max load capacity is required')
  })
});

export const Register = () => {
  const { t } = useLanguage();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialRole = queryParams.get('role') || '';

  const validRoles = ['farmer', 'buyer', 'transporter'];
  const [step, setStep] = useState(initialRole && validRoles.includes(initialRole) ? 2 : 1);
  const [role, setRole] = useState(initialRole && validRoles.includes(initialRole) ? initialRole : '');

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: initialRole }
  });

  const onSubmit = async (data) => {
    try {
      const res = await authApi.register({ ...data, role });
      if (res.data && res.data.user) {
        dispatch(setCredentials({ user: res.data.user, token: res.data.token }));
        toast.success(`Account created! Logged in as ${role}`);
        navigate(`/${res.data.user.role}/dashboard`);
      }
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      toast.error(message);
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setValue('role', selectedRole);
  };

  return (
    <div className="min-h-screen bg-farm-cream flex items-center justify-center p-6 pb-24">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-2xl w-full">
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

        {step === 1 && (
          <div>
            <h2 className="font-display text-3xl text-farm-dark mb-2 text-center">{t('auth.joinKrishiMitra')}</h2>
            <p className="font-body text-gray-500 text-center mb-8">{t('auth.selectRole')}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div
                onClick={() => handleRoleSelect('farmer')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${role === 'farmer' ? 'border-farm-green bg-farm-pale ring-4 ring-farm-green/20' : 'border-gray-200 hover:border-farm-green/50'}`}
              >
                <div className="text-4xl mb-3">🌾</div>
                <h3 className="font-display text-xl font-bold mb-2">I am a Farmer</h3>
                <p className="font-body text-sm text-gray-600">List crops, receive orders, and get paid directly without middlemen.</p>
              </div>

              <div
                onClick={() => handleRoleSelect('buyer')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${role === 'buyer' ? 'border-farm-green bg-farm-pale ring-4 ring-farm-green/20' : 'border-gray-200 hover:border-farm-green/50'}`}
              >
                <div className="text-4xl mb-3">🛒</div>
                <h3 className="font-display text-xl font-bold mb-2">I am a Buyer</h3>
                <p className="font-body text-sm text-gray-600">Browse fresh crops, place bulk orders, and get direct deliveries.</p>
              </div>

              <div
                onClick={() => handleRoleSelect('transporter')}
                className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${role === 'transporter' ? 'border-farm-green bg-farm-pale ring-4 ring-farm-green/20' : 'border-gray-200 hover:border-farm-green/50'}`}
              >
                <div className="text-4xl mb-3">🚚</div>
                <h3 className="font-display text-xl font-bold mb-2">I am a Transporter</h3>
                <p className="font-body text-sm text-gray-600">Accept delivery jobs, move produce safely, and earn per completed trip.</p>
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!role}
              className="w-full bg-farm-green text-white rounded-lg py-3 font-body font-semibold hover:bg-farm-mid disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {t('auth.continue')}
            </button>
            <div className="mt-4 text-center font-body text-gray-600">
              {t('auth.alreadyAccount')} <Link to="/login" className="text-farm-green font-semibold hover:underline">{t('auth.loginHere')}</Link>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-display text-3xl text-farm-dark mb-6 text-center">{t('auth.completeProfile')}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.fullName')}</label>
                  <input {...register('fullName')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.fullName?.message}</p>
                </div>
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.email')}</label>
                  <input type="email" {...register('email')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.email?.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.phone')}</label>
                  <input type="tel" maxLength={10} {...register('phone')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.phone?.message}</p>
                </div>
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.district')}</label>
                  <select {...register('district')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none bg-white">
                    <option value="">Select District</option>
                    {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.district?.message}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.password')}</label>
                  <input type="password" {...register('password')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.password?.message}</p>
                </div>
                <div>
                  <label className="block font-display text-gray-700 mb-1">{t('auth.confirmPassword')}</label>
                  <input type="password" {...register('confirmPassword')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                  <p className="text-red-500 text-xs mt-1 font-body">{errors.confirmPassword?.message}</p>
                </div>
              </div>

              {role === 'buyer' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Business Name</label>
                      <input {...register('businessName')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.businessName?.message}</p>
                    </div>
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Business Type</label>
                      <select {...register('businessType')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none bg-white">
                        <option value="">Select Type</option>
                        <option value="restaurant">Restaurant</option>
                        <option value="retailer">Retailer</option>
                        <option value="wholesaler">Wholesaler</option>
                        <option value="exporter">Exporter</option>
                        <option value="other">Other</option>
                      </select>
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.businessType?.message}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block font-display text-gray-700 mb-1">Delivery Address</label>
                    <textarea {...register('deliveryAddress')} rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none resize-none" />
                    <p className="text-red-500 text-xs mt-1 font-body">{errors.deliveryAddress?.message}</p>
                  </div>
                </>
              )}

              {role === 'transporter' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Company Name</label>
                      <input {...register('companyName')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" placeholder="Your transport company name" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.companyName?.message}</p>
                    </div>
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Vehicle Type</label>
                      <select {...register('vehicleType')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none bg-white">
                        <option value="">Select Type</option>
                        <option value="two_wheeler">Two Wheeler</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="truck_small">Small Truck</option>
                        <option value="truck_medium">Medium Truck</option>
                        <option value="truck_large">Large Truck</option>
                        <option value="refrigerated">Refrigerated Truck</option>
                      </select>
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.vehicleType?.message}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Vehicle Number</label>
                      <input {...register('vehicleNumber')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" placeholder="e.g., MH02AB1234" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.vehicleNumber?.message}</p>
                    </div>
                    <div>
                      <label className="block font-display text-gray-700 mb-1">License Number</label>
                      <input {...register('licenseNumber')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" placeholder="Your commercial license" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.licenseNumber?.message}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Service Areas (Districts)</label>
                      <input {...register('serviceAreas')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" placeholder="e.g., Pune, Nashik, Aurangabad" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.serviceAreas?.message}</p>
                    </div>
                    <div>
                      <label className="block font-display text-gray-700 mb-1">Max Load Capacity (kg)</label>
                      <input type="number" {...register('maxLoadCapacity')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 font-body focus:ring-2 focus:ring-farm-gold outline-none" placeholder="e.g., 5000" />
                      <p className="text-red-500 text-xs mt-1 font-body">{errors.maxLoadCapacity?.message}</p>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-4 mt-6">
                <button type="button" onClick={() => setStep(1)} className="px-6 py-3 font-body font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  {t('auth.back')}
                </button>
                <button type="submit" className="flex-1 bg-farm-green text-white rounded-lg py-3 font-body font-semibold hover:bg-farm-mid transition-colors">
                  {t('auth.createAccountBtn')}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};