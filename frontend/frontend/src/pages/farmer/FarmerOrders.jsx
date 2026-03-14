import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { Badge } from '../../components/ui/Badge';
import { DeliveryBadge } from '../../components/ui/DeliveryBadge';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { formatINR } from '../../utils/formatCurrency';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { formatDate } from '../../utils/formatDate';
import { ChevronRight, ShoppingCart, User, Package, Truck } from 'lucide-react';

export const FarmerOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const currentTab = searchParams.get('tab') || 'all';

  const tabs = [
    { id: 'all', label: 'All Orders', query: '' },
    { id: 'pending', label: 'Pending', query: 'pending' },
    { id: 'active', label: 'Active', query: 'accepted,scheduled,dispatched,in_transit' },
    { id: 'completed', label: 'Completed', query: 'completed' },
    { id: 'disputed', label: 'Disputed', query: 'disputed' }
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const statusQuery = tabs.find(t => t.id === currentTab)?.query;
        const res = await ordersApi.getOrders(statusQuery ? { status: statusQuery } : {});
        setOrders(res.data?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [currentTab]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-display font-bold text-farm-dark">Order Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">{orders.length} {currentTab !== 'all' ? currentTab : 'total'} orders</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tabs */}
        <div className="w-full overflow-x-auto pb-1 mb-6 hide-scrollbar">
          <div className="flex gap-2 min-w-max">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`shrink-0 px-5 py-2 rounded-full font-semibold text-xs uppercase tracking-wide transition-all ${
                  currentTab === tab.id
                    ? 'bg-farm-green text-white shadow-md shadow-farm-green/25'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}</div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <ShoppingCart size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-400">No {currentTab !== 'all' ? currentTab : ''} orders found</h3>
            <p className="text-gray-400 text-sm mt-1">When buyers place orders, they will appear here.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {['Crop', 'Buyer', 'Qty', 'Amount', 'Order Status', 'Delivery', 'Date', ''].map(h => (
                      <th key={h} className="px-5 py-3.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => (
                    <tr
                      key={order._id}
                      onClick={() => navigate(`/farmer/orders/${order._id}`)}
                      className="hover:bg-green-50/30 cursor-pointer transition-colors group"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-farm-pale rounded-lg flex items-center justify-center text-farm-green font-bold text-sm shrink-0">
                            {order.cropName?.charAt(0)}
                          </div>
                          <span className="font-semibold text-farm-dark text-sm">{order.cropName}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <User size={14} className="text-gray-400" />
                          <span>{order.buyer?.name || '–'}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 pl-5">{order.buyer?.location?.district}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                          <Package size={14} className="text-gray-400" />
                          {order.quantity} kg
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-farm-green text-sm">{formatINR(order.totalAmount)}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge type="status" value={order.status} />
                        {order.status === 'pending' && (
                          <div className="mt-1">
                            <CountdownTimer deadline={order.acceptanceDeadline} />
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <DeliveryBadge method={order.deliveryMethod} />
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '–'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-farm-green transition-colors" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {orders.map(order => (
                <div
                  key={order._id}
                  onClick={() => navigate(`/farmer/orders/${order._id}`)}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 cursor-pointer hover:shadow-md transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 bg-farm-pale rounded-xl flex items-center justify-center text-farm-green font-bold">
                        {order.cropName?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-farm-dark">{order.cropName}</p>
                        <p className="text-xs text-gray-500">{order.quantity} kg · {formatINR(order.totalAmount)}</p>
                      </div>
                    </div>
                    <Badge type="status" value={order.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={12} /> {order.buyer?.name}</span>
                    <DeliveryBadge method={order.deliveryMethod} />
                  </div>
                  {order.status === 'pending' && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <CountdownTimer deadline={order.acceptanceDeadline} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
