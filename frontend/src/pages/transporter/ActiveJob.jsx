import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { useAuth } from '../../hooks/useAuth';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { MapPin, Truck, CheckCircle, Navigation, Phone, ShieldCheck, Play, KeyRound, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export const ActiveJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState(['', '', '', '']);

  const fetchJob = async () => {
    try {
      const res = await deliveryApi.getJobById(id);
      setJob(res.data?.data);
    } catch (e) {
      toast.error('Job details not found');
      navigate('/transporter/jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
    const interval = setInterval(fetchJob, 15000); // Poll fast for status changes
    return () => clearInterval(interval);
  }, [id]);

  const handleAction = async (actionStr) => {
    try {
      if (actionStr === 'accept') {
        await deliveryApi.acceptJob(id);
        toast.success('Job accepted! Added to your active trips.');
      } else if (actionStr === 'start-pickup') {
        await deliveryApi.updateJobStatus(id, { status: 'at_farm' });
        toast.success('Status updated. Proceed to farm.');
      } else if (actionStr === 'verify-pickup') {
        const fullOtp = otp.join('');
        if (fullOtp.length !== 4) return toast.error('Enter 4 digit OTP');
        await deliveryApi.verifyPickup(id, fullOtp);
        toast.success('✅ Item loaded successfully');
        setOtp(['', '', '', '']);
      } else if (actionStr === 'start-delivery') {
        await deliveryApi.updateJobStatus(id, { status: 'in_transit' });
        toast.success('Status updated. Drive safe!');
      } else if (actionStr === 'verify-delivery') {
        const fullOtp = otp.join('');
        if (fullOtp.length !== 4) return toast.error('Enter 4 digit OTP');
        await deliveryApi.verifyDelivery(id, fullOtp);
        toast.success('🎉 Delivery completed successfully!');
        setOtp(['', '', '', '']);
      }
      fetchJob();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to update job status');
    }
  };

  const handleOtpChange = (e, index) => {
    const value = e.target.value;
    if (isNaN(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    if (value && index < 3) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  if (loading || !job) return <div className="max-w-3xl mx-auto p-6"><SkeletonCard/></div>;

  const currentStep = job.status === 'scheduled' ? 1 : job.status === 'at_farm' ? 2 : job.status === 'in_transit' ? 3 : job.status === 'at_buyer' || job.status === 'delivered' || job.status === 'completed' ? 4 : 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 pt-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Header & Map Pin */}
        <div className="bg-purple-600 text-white rounded-t-3xl p-6 shadow-md relative overflow-hidden">
          <Truck className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10" />
          <h1 className="text-2xl font-display font-bold relative z-10">Trip #{job._id.slice(-6).toUpperCase()}</h1>
          <p className="text-purple-200 mt-1 relative z-10">Earnings: <span className="font-bold text-white">{formatINR(job.deliveryFee)}</span></p>
        </div>

        {/* Action Panel Based on Status */}
        <div className="bg-white p-6 md:p-8 rounded-b-3xl shadow-sm border border-x-gray-200 border-b-gray-200 text-center mb-8">
          
          {job.status === 'pending' && (
            <div>
              <div className="w-20 h-20 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-purple-100"><ShieldCheck className="w-10 h-10"/></div>
              <h2 className="text-2xl font-bold text-farm-dark mb-2">New Delivery Job</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Review the route below and act quickly if you want to claim this trip.</p>
              <button onClick={() => handleAction('accept')} className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-purple-600/30 transition-transform hover:-translate-y-1 overflow-hidden">
                Accept Job
              </button>
            </div>
          )}

          {job.status === 'scheduled' && (
            <div>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Navigation className="w-8 h-8"/></div>
              <h2 className="text-xl font-bold text-farm-dark mb-2">Step 1: Go to Farmer</h2>
              <p className="text-gray-600 mb-6">Start your journey to the pickup location in {job.farmer?.location?.district}.</p>
              <button onClick={() => handleAction('start-pickup')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 group">
                <Play className="w-5 h-5 fill-current" /> Tap when you reach farm location
              </button>
            </div>
          )}

          {job.status === 'at_farm' && (
            <div className="bg-amber-50 border border-amber-200 p-6 md:p-8 rounded-2xl animate-fadeUp">
              <h2 className="text-xl font-bold text-amber-900 mb-2 flex items-center justify-center gap-2"><KeyRound className="w-6 h-6"/> Farmer OTP Required</h2>
              <p className="text-amber-700 mb-6 text-sm">Ask {job.farmer?.name} for their 4-digit pickup OTP to confirm loading.</p>
              
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" value={digit} onChange={(e) => handleOtpChange(e, i)} className="w-14 h-16 text-center text-3xl font-bold bg-white border-2 border-amber-300 rounded-xl focus:border-amber-600 focus:ring-2 focus:ring-amber-600/20 outline-none shadow-inner" maxLength={1} />
                ))}
              </div>

              <button onClick={() => handleAction('verify-pickup')} className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-bold text-lg rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                Verify Item Loaded
              </button>
            </div>
          )}

          {job.status === 'in_transit' && (
            <div>
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><Truck className="w-8 h-8"/></div>
              <h2 className="text-xl font-bold text-farm-dark mb-2">Step 2: Deliver to Buyer</h2>
              <p className="text-gray-600 mb-6">Navigate to the delivery address in {job.buyer?.location?.district}. Drive safely.</p>
              
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-bold uppercase text-gray-500 mb-1">Delivery Address</p>
                <p className="text-farm-dark font-medium">{job.deliveryAddress || `${job.buyer?.location?.village}, ${job.buyer?.location?.district}`}</p>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.deliveryAddress || job.buyer?.location?.village)}`} target="_blank" rel="noreferrer" className="mt-3 w-full border-2 border-blue-100 text-blue-600 hover:bg-blue-50 py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors">
                  <Navigation className="w-4 h-4"/> Open in Maps
                </a>
              </div>

              <button onClick={() => handleAction('at_buyer')} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-transform hover:-translate-y-1 group">
                <MapPin className="w-5 h-5 inline mr-2 text-white fill-blue-800" /> Tap when you reach buyer
              </button>
            </div>
          )}

          {job.status === 'at_buyer' && (
            <div className="bg-green-50 border border-green-200 p-6 md:p-8 rounded-2xl animate-fadeUp">
              <h2 className="text-xl font-bold text-green-900 mb-2 flex items-center justify-center gap-2"><CheckCircle className="w-6 h-6"/> Buyer OTP Required</h2>
              <p className="text-green-700 mb-6 text-sm">Ask {job.buyer?.name} for their 4-digit delivery OTP to confirm receipt and release your payment.</p>
              
              <div className="flex justify-center gap-3 mb-6">
                {otp.map((digit, i) => (
                  <input key={i} id={`otp-${i}`} type="text" value={digit} onChange={(e) => handleOtpChange(e, i)} className="w-14 h-16 text-center text-3xl font-bold bg-white border-2 border-green-400 rounded-xl focus:border-green-600 focus:ring-2 focus:ring-green-600/20 outline-none shadow-inner" maxLength={1} />
                ))}
              </div>

              <button onClick={() => handleAction('verify-delivery')} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-transform hover:-translate-y-1">
                Verify Delivery & Get Paid
              </button>
            </div>
          )}

          {(job.status === 'delivered' || job.status === 'completed') && (
            <div className="py-8">
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle className="w-12 h-12"/></div>
              <h2 className="text-3xl font-bold text-green-900 mb-2">Trip Completed! 🎉</h2>
              <p className="text-green-700 font-medium text-lg bg-green-50 p-3 rounded-lg inline-block border border-green-200">Payment of {formatINR(job.deliveryFee)} released into your wallet.</p>
            </div>
          )}

        </div>

        {/* Route Details Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <h3 className="font-bold text-lg text-farm-dark mb-4 pb-3 border-b border-gray-100 flex items-center gap-2"><Truck className="w-5 h-5 text-gray-400"/> Route Details</h3>
          
          <div className="space-y-6 relative">
            <div className="absolute top-2 bottom-6 left-2.5 w-0.5 bg-gray-200"></div>

            {/* Farm Pivot */}
            <div className={`relative pl-8 transition-opacity ${currentStep > 1 ? 'opacity-50' : 'opacity-100'}`}>
              <div className={`absolute -left-[5px] top-1 w-5 h-5 rounded-full ring-4 ${currentStep > 1 ? 'bg-gray-400 ring-gray-100' : 'bg-green-500 ring-green-100'}`}></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">1. Pickup from Farmer</p>
                  <p className="font-bold text-farm-dark text-lg">{job.farmer?.name}</p>
                  <p className="text-sm text-gray-600 mt-1">{job.farmer?.location?.address || `${job.farmer?.location?.village}, ${job.farmer?.location?.district}`}</p>
                </div>
                {job.status !== 'pending' && <a href={`tel:${job.farmer?.phone}`} className="p-3 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100"><Phone className="w-4 h-4 text-green-600"/></a>}
              </div>
            </div>

            {/* Transit */}
            <div className={`relative pl-8 transition-opacity ${currentStep < 2 ? 'opacity-40' : currentStep > 3 ? 'opacity-50' : 'opacity-100'}`}>
              <div className={`absolute -left-[3px] top-1/2 -mt-2 w-4 h-4 rounded-full border-4 bg-white ${currentStep === 2 || currentStep === 3 ? 'border-purple-500' : 'border-gray-300'}`}></div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 my-2">
                <p className="text-sm font-bold text-farm-dark mb-1 flex items-center gap-2"><Package className="w-4 h-4 text-gray-400"/> {job.cropName}</p>
                <p className="text-sm text-gray-600 font-medium">Load weight: {job.quantity}kg</p>
              </div>
            </div>

            {/* Buyer Pivot */}
            <div className={`relative pl-8 transition-opacity ${currentStep < 3 ? 'opacity-40 text-gray-500' : 'opacity-100'}`}>
              <div className={`absolute -left-[5px] top-1 w-5 h-5 rounded-full ring-4 ${currentStep === 4 ? 'bg-green-500 ring-green-100' : currentStep >= 3 ? 'bg-blue-500 ring-blue-100' : 'bg-gray-300 ring-gray-100'}`}></div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-gray-400 tracking-wider uppercase mb-1">2. Deliver to Buyer</p>
                  <p className="font-bold text-farm-dark text-lg">{job.buyer?.name || 'Buyer hidden until accepted'}</p>
                  {job.status !== 'pending' && <p className="text-sm text-gray-600 mt-1">{job.deliveryAddress || `${job.buyer?.location?.village}, ${job.buyer?.location?.district}`}</p>}
                </div>
                {job.status !== 'pending' && currentStep >= 2 && <a href={`tel:${job.buyer?.phone}`} className="p-3 bg-gray-50 border border-gray-200 rounded-full hover:bg-gray-100"><Phone className="w-4 h-4 text-blue-600"/></a>}
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
};
