import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Navigation, Wallet, PackageOpen, Award, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const TransporterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({ jobs: [], activeCount: 0, completedCount: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        setLoading(true);
        const [availableRes, activeRes, completedRes] = await Promise.allSettled([
          deliveryApi.getAvailableJobs(),
          deliveryApi.getAssignedJobs(),
          deliveryApi.getDeliveryHistory()
        ]);

        const completed = completedRes.status === 'fulfilled' ? completedRes.value.data.data : [];
        const earnings = completed.reduce((sum, job) => sum + (job.deliveryFee || 0), 0);

        setData({
          jobs: availableRes.status === 'fulfilled' ? availableRes.value.data.data.slice(0, 3) : [],
          activeCount: activeRes.status === 'fulfilled' ? activeRes.value.data.data.length : 0,
          completedCount: completed.length,
          totalEarnings: earnings
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDash();
  }, [user]);

  if (loading) return <div className="p-6 grid gap-6 max-w-7xl mx-auto"><SkeletonCard/><SkeletonCard/></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="bg-purple-700 text-white rounded-3xl p-8 mb-8 relative overflow-hidden shadow-md">
          <Navigation className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10" />
          <h1 className="text-3xl font-display font-bold relative z-10">Safe travels, {user?.name?.split(' ')[0]} 🚚</h1>
          <p className="text-purple-200 mt-2 relative z-10 max-w-lg leading-relaxed">Your assigned zone: <span className="text-white font-bold">{user?.location?.district}</span>. Check available jobs taking farm produce to local buyers.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0"><Wallet className="w-6 h-6"/></div>
            <div><p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Earnings</p><p className="text-xl font-bold text-farm-dark">{formatINR(data.totalEarnings)}</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0"><CheckCircle className="w-6 h-6"/></div>
            <div><p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Completed</p><p className="text-xl font-bold text-farm-dark">{data.completedCount} Trips</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><PackageOpen className="w-6 h-6"/></div>
            <div><p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Active Jobs</p><p className="text-xl font-bold text-farm-dark">{data.activeCount} Trips</p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center shrink-0"><Award className="w-6 h-6"/></div>
            <div><p className="text-xs uppercase font-bold text-gray-400 tracking-wider">Rating</p><p className="text-xl font-bold text-farm-dark">{user?.rating > 0 ? `${user.rating}★` : 'New'}</p></div>
          </div>
        </div>

        {/* Quick Action */}
        {data.activeCount > 0 && (
          <div onClick={() => navigate('/transporter/history')} className="bg-gradient-to-r from-blue-600 to-blue-400 p-6 rounded-2xl mb-8 shadow-md text-white flex items-center justify-between cursor-pointer hover:shadow-lg transition-all animate-pulse-slow">
            <div>
              <h3 className="font-bold text-xl mb-1 flex items-center gap-2"><Navigation className="w-5 h-5"/> You have an active trip!</h3>
              <p className="text-blue-100">Click to view route and OTP verifications.</p>
            </div>
            <span className="font-bold bg-white/20 px-4 py-2 rounded-xl backdrop-blur-sm">Resume Trip →</span>
          </div>
        )}

        {/* Available Jobs Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 line-clamp-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-farm-dark flex items-center gap-2">Nearby Available Jobs</h2>
            <Link to="/transporter/jobs" className="text-sm font-bold text-purple-600 hover:underline">View All Map</Link>
          </div>
          
          {data.jobs.length === 0 ? (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
              No jobs posted yet today. Keep checking back!
            </div>
          ) : (
            <div className="space-y-4">
              {data.jobs.map(job => (
                <Link key={job._id} to={`/transporter/jobs/${job._id}`} className="block border border-gray-100 rounded-xl p-4 hover:border-purple-300 hover:bg-purple-50/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-farm-dark flex items-center gap-2">From: {job.farmer?.location?.district}</h4>
                      <h4 className="font-bold text-farm-dark flex items-center gap-2 mt-1 opacity-70">To: {job.buyer?.location?.district}</h4>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-xl text-purple-700">{formatINR(job.deliveryFee)}</span>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{job.quantity}kg Load</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
