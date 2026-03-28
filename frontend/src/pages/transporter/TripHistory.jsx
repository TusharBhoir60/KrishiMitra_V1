import { useState, useEffect } from 'react';
import { deliveryApi } from '../../api/endpoints/deliveryApi';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { CheckCircle, Route, Box } from 'lucide-react';

export const TripHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveryApi.getDeliveryHistory()
      .then(res => setHistory(res.data?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 max-w-4xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-display font-bold text-farm-dark mb-8">Trip History</h1>
        
        {history.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-gray-200">
            <Route className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No completed trips yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(trip => (
              <div key={trip._id} className="bg-white p-5 rounded-2xl border border-gray-200 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
                    <CheckCircle className="w-6 h-6"/>
                  </div>
                  <div>
                    <h3 className="font-bold text-farm-dark">{trip.farmer?.location?.district} ➔ {trip.buyer?.location?.district}</h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1"><Box className="w-3.5 h-3.5"/> {trip.quantity}kg Load · {new Date(trip.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-black text-lg text-farm-green">{formatINR(trip.deliveryFee)}</span>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Paid</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
