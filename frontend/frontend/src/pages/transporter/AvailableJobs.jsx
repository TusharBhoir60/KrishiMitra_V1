import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { MapPin, ArrowRight, CheckCircle, Navigation, Truck, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export const AvailableJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await deliveryApi.getAvailableJobs();
      setJobs(res.data?.data || []);
    } catch (err) {
      toast.error('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistanceEstimate = (job) => {
    // Mock distance for the UI. In real app, Google Maps Matrix API.
    return `${Math.floor(Math.random() * 40) + 10} km`;
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-farm-dark">Available Delivery Jobs</h1>
          <p className="text-gray-500 mt-1">Accept jobs taking crops from farmers to buyers</p>
        </div>

        {loading ? (
          <div className="grid gap-6"><SkeletonCard/><SkeletonCard/></div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4"><Package className="w-8 h-8"/></div>
            <h3 className="font-display font-bold text-xl text-farm-dark mb-2">No jobs available right now</h3>
            <p className="text-gray-500">Check back later when new orders are placed in your delivery zone.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map(job => (
              <div key={job._id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow group flex flex-col md:flex-row">
                
                {/* Visual Map/Distance Indicator */}
                <div className="bg-purple-50 p-6 md:w-64 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-purple-100 shrink-0 relative overflow-hidden">
                  <Truck className="w-16 h-16 text-purple-200 absolute -bottom-4 -left-4 opacity-50"/>
                  <p className="text-sm font-bold text-purple-600 uppercase tracking-widest mb-2">Distance (Est)</p>
                  <p className="text-4xl font-display font-bold text-purple-900">{calculateDistanceEstimate(job)}</p>
                  <p className="text-xs text-purple-500 mt-2 font-medium bg-purple-100 px-3 py-1 rounded-full">Intra-state trip</p>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="font-bold text-xl text-farm-dark mb-1">Trip Route</h3>
                      <div className="space-y-3 mt-4 relative pl-6">
                        <div className="absolute top-2 bottom-4 left-1.5 w-0.5 bg-gray-200"></div>
                        
                        <div className="relative">
                          <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 bg-green-500 rounded-full ring-4 ring-green-50"></div>
                          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-0.5">Pickup (Farmer)</p>
                          <p className="font-medium text-farm-dark text-lg">{job.farmer?.location?.district}</p>
                        </div>
                        
                        <div className="relative pt-2">
                          <div className="absolute -left-[27px] top-4 w-3.5 h-3.5 bg-blue-500 rounded-full ring-4 ring-blue-50"></div>
                          <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-0.5">Dropoff (Buyer)</p>
                          <p className="font-medium text-farm-dark text-lg">{job.buyer?.location?.district}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Earnings</p>
                      <p className="text-3xl font-bold text-purple-700">{formatINR(job.deliveryFee)}</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 mt-auto">
                    <div className="flex items-center gap-4 text-sm font-medium text-gray-600 w-full sm:w-auto">
                      <span className="bg-gray-100 py-1.5 px-3 rounded-lg border border-gray-200">📦 {job.quantity}kg Load</span>
                      <span className="bg-gray-100 py-1.5 px-3 rounded-lg border border-gray-200">📅 Scheduled for {new Date(job.pickupDetails?.date).toLocaleDateString()}</span>
                    </div>
                    <button onClick={() => navigate(`/transporter/jobs/${job._id}`)} className="w-full sm:w-auto px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/20 transition-colors flex justify-center items-center gap-2">
                      View Details & Accept <ArrowRight className="w-4 h-4"/>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
