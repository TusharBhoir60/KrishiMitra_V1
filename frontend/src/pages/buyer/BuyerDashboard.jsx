import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Package, Search, Star, Bookmark } from 'lucide-react';
import { formatINR } from '../../utils/formatCurrency';

export const BuyerDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ activeOrders: [], recentCrops: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDash = async () => {
      try {
        const [ordersRes, cropsRes] = await Promise.all([
          ordersApi.getOrders({ status: 'pending,accepted,scheduled,dispatched,in_transit' }),
          cropsApi.getListings({ status: 'active', limit: 3 })
        ]);
        setData({
          activeOrders: ordersRes.data?.data?.slice(0, 3) || [],
          recentCrops: cropsRes.data?.data?.slice(0, 3) || []
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDash();
  }, [user]);

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-4">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-3xl p-8 text-white mb-8 shadow-md">
          <h1 className="text-3xl font-display font-bold mb-2">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="opacity-90 max-w-lg leading-relaxed">Find fresh, high-quality agricultural produce directly from verified farmers in {user?.location?.state || 'your region'}.</p>
          
          <div className="mt-8 flex gap-4">
            <Link to="/buyer/marketplace" className="px-6 py-3 bg-white text-blue-600 font-bold rounded-xl shadow-sm hover:shadow-md transition-shadow flex items-center gap-2">
              <Search className="w-5 h-5"/> Browse Market
            </Link>
            <Link to="/buyer/orders" className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white font-bold rounded-xl transition-colors hidden sm:flex items-center gap-2 backdrop-blur-sm border border-white/30">
              <Package className="w-5 h-5"/> My Orders
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Active Orders Widget */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 line-clamp-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-farm-dark flex items-center gap-2"><Package className="w-5 h-5 text-blue-500"/> Active Orders</h2>
              <Link to="/buyer/orders?tab=active" className="text-sm font-bold text-blue-600 hover:underline">View All</Link>
            </div>
            
            {data.activeOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border border-gray-100">
                You have no active orders.
              </div>
            ) : (
              <div className="space-y-4">
                {data.activeOrders.map(order => (
                  <Link key={order._id} to={`/buyer/orders/${order._id}`} className="block border border-gray-100 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-farm-dark">{order.cropName}</h4>
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-1 rounded-md">{order.status.replace('_', ' ')}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{order.quantity}kg · {formatINR(order.totalAmount)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* New Arrivals Widget */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-farm-dark flex items-center gap-2"><Star className="w-5 h-5 text-amber-500"/> Fresh Arrivals</h2>
              <Link to="/buyer/marketplace" className="text-sm font-bold text-blue-600 hover:underline">Explore</Link>
            </div>
            
            <div className="grid gap-4">
              {data.recentCrops.map(crop => (
                <Link key={crop._id} to={`/buyer/crops/${crop._id}`} className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                    <img src={crop.images?.[0]?.url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt={crop.cropName} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-farm-dark">{crop.cropName}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">By {crop.farmer?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-farm-green">{formatINR(crop.pricePerKg)}</p>
                    <p className="text-xs text-gray-400">/kg</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};
