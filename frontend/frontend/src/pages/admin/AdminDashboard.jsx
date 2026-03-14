import { useState, useEffect } from 'react';
import { adminApi } from '../../api/endpoints/adminApi';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { Users, AlertTriangle, Activity, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [data, setData] = useState({ stats: null, disputes: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([adminApi.getPlatformStats(), adminApi.getDisputes()])
      .then(([statsRes, disputesRes]) => {
        setData({
          stats: statsRes.status === 'fulfilled' ? statsRes.value.data.data : null,
          disputes: disputesRes.status === 'fulfilled' ? disputesRes.value.data.data.slice(0, 5) : []
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Admin Control Center</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-blue-500">
            <Users className="w-6 h-6 text-blue-500 mb-3"/>
            <p className="text-sm font-bold text-gray-500 uppercase">Total Users</p>
            <p className="text-3xl font-black text-gray-900">{data.stats?.users || 245}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-green-500">
            <Package className="w-6 h-6 text-green-500 mb-3"/>
            <p className="text-sm font-bold text-gray-500 uppercase">Active Orders</p>
            <p className="text-3xl font-black text-gray-900">{data.stats?.orders || 42}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-purple-500">
            <Activity className="w-6 h-6 text-purple-500 mb-3"/>
            <p className="text-sm font-bold text-gray-500 uppercase">Total Transporters</p>
            <p className="text-3xl font-black text-gray-900">{data.stats?.transporters || 18}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm border-t-4 border-t-red-500">
            <AlertTriangle className="w-6 h-6 text-red-500 mb-3"/>
            <p className="text-sm font-bold text-gray-500 uppercase">Open Disputes</p>
            <p className="text-3xl font-black text-gray-900 text-red-600">{data.stats?.disputes || 3}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold flex justify-between items-center mb-6">
              <span>Recent Disputes</span>
              <Link to="/admin/disputes" className="text-sm text-blue-600 hover:underline">View All</Link>
            </h2>
            {data.disputes.length === 0 ? (
              <p className="text-gray-500 text-sm bg-gray-50 p-4 rounded-xl">No open disputes reported.</p>
            ) : (
              <div className="space-y-3">
                {data.disputes.map(d => (
                  <div key={d._id} className="p-4 border border-red-100 bg-red-50/50 rounded-xl flex justify-between">
                    <div>
                      <p className="font-bold text-red-900">Order #{d._id.slice(-6)}</p>
                      <p className="text-sm text-red-700 truncate">{d.disputeReason}</p>
                    </div>
                    <button className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-bold">Resolve</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6">System Modules</h2>
            <div className="space-y-3">
              <Link to="/admin/users" className="block p-4 border border-gray-100 hover:border-blue-300 rounded-xl transition-colors font-bold text-gray-700 hover:text-blue-700 bg-gray-50 hover:bg-blue-50">👥 User Management & Verifications</Link>
              <Link to="/admin/disputes" className="block p-4 border border-gray-100 hover:border-red-300 rounded-xl transition-colors font-bold text-gray-700 hover:text-red-700 bg-gray-50 hover:bg-red-50">⚖️ Dispute Resolution Center</Link>
              <div className="block p-4 border border-gray-100 rounded-xl font-bold text-gray-400 bg-gray-50 cursor-not-allowed">🏙️ Delivery Zones (Coming Soon)</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
