import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { formatINR } from '../../utils/formatCurrency';
import {
  Package, AlertCircle, ArrowRight, Wallet, ListChecks,
  Truck, ShoppingCart, Plus, ChevronRight, Clock,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { DeliveryBadge } from '../../components/ui/DeliveryBadge';
import { SkeletonCard } from '../../components/common/SkeletonCard';

export const FarmerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    pendingOrders: [],
    activeOrders: [],
    listings: [],
    totalEarnings: 0,
    completedCount: 0,
    pendingDeliveries: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [pendingRes, activeRes, listingsRes, completedRes] = await Promise.allSettled([
          ordersApi.getOrders({ status: 'pending' }),
          ordersApi.getOrders({ status: 'accepted,scheduled,dispatched,in_transit' }),
          cropsApi.getMyListings({ status: 'active' }),
          ordersApi.getOrders({ status: 'completed' }),
        ]);

        const completed = completedRes.status === 'fulfilled' ? completedRes.value.data.data : [];
        const active    = activeRes.status    === 'fulfilled' ? activeRes.value.data.data    : [];
        const earnings  = completed.reduce((sum, o) => sum + (o.cropAmount || 0), 0);
        const pendingDeliveries = active.filter(o =>
          ['scheduled', 'dispatched', 'in_transit'].includes(o.status)
        ).length;

        setData({
          pendingOrders:     pendingRes.status   === 'fulfilled' ? pendingRes.value.data.data   : [],
          activeOrders:      active,
          listings:          listingsRes.status  === 'fulfilled' ? listingsRes.value.data.data  : [],
          totalEarnings:     earnings,
          completedCount:    completed.length,
          pendingDeliveries,
        });
      } catch (err) {
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchDashboardData();
  }, [user]);

  /* ── Color palette for stat cards ── */
  const statCards = [
    {
      label: 'Total Listings', value: data.listings.length,
      icon: ListChecks, color: 'green',
      to: '/farmer/listings', sub: 'active crops',
    },
    {
      label: 'Active Orders', value: data.activeOrders.length,
      icon: ShoppingCart, color: 'blue',
      to: '/farmer/orders?tab=active', sub: 'in progress',
    },
    {
      label: 'Pending Deliveries', value: data.pendingDeliveries,
      icon: Truck, color: 'amber',
      to: '/farmer/orders?tab=active', sub: 'en route',
    },
    {
      label: 'Total Earnings', value: formatINR(data.totalEarnings),
      icon: Wallet, color: 'emerald',
      to: '/farmer/orders?tab=completed', sub: `${data.completedCount} completed`,
    },
  ];

  const colorMap = {
    green:   { wrap: 'bg-green-50 border-green-100 hover:shadow-green-100',   icon: 'bg-green-100 text-farm-green',     val: 'text-farm-dark' },
    blue:    { wrap: 'bg-blue-50 border-blue-100 hover:shadow-blue-100',       icon: 'bg-blue-100 text-blue-600',         val: 'text-blue-900'  },
    amber:   { wrap: 'bg-amber-50 border-amber-100 hover:shadow-amber-100',   icon: 'bg-amber-100 text-amber-600',       val: 'text-amber-900' },
    emerald: { wrap: 'bg-emerald-50 border-emerald-100 hover:shadow-emerald-100', icon: 'bg-emerald-100 text-emerald-700', val: 'text-emerald-900' },
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* ── Hero Header ── */}
      <div className="bg-gradient-to-r from-farm-green via-farm-mid to-farm-light px-6 py-8 md:py-10 md:px-10">
        <p className="text-farm-pale/70 text-xs font-semibold uppercase tracking-widest mb-1">Farmer Portal</p>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white mb-1">
          Welcome back, {(user?.name || user?.fullName)?.split(' ')[0]} 🌾
        </h1>
        <p className="text-farm-pale/80 text-sm">{user?.location?.district || 'Maharashtra'}</p>
        {user?.isVerified && (
          <span className="mt-3 inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block"></span>
            Verified Farmer
          </span>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Pending alert ── */}
        {data.pendingOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm animate-fadeUp">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-amber-900 text-sm">
                {data.pendingOrders.length} new order request{data.pendingOrders.length > 1 ? 's' : ''} waiting
              </p>
              <p className="text-amber-700 text-xs mt-0.5">Respond within 12 hours to avoid auto-cancellation.</p>
            </div>
            <Link
              to="/farmer/orders?tab=pending"
              className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
            >
              Review →
            </Link>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(card => {
            const c = colorMap[card.color];
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                onClick={() => navigate(card.to)}
                className={`${c.wrap} border rounded-2xl p-5 text-left shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group w-full`}
              >
                <div className={`w-10 h-10 ${c.icon} rounded-xl flex items-center justify-center mb-3`}>
                  <Icon size={20} />
                </div>
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                <p className={`text-2xl font-bold ${c.val} mb-0.5 leading-tight`}>{card.value}</p>
                <p className="text-xs text-gray-400 flex items-center gap-0.5">
                  {card.sub}
                  <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </p>
              </button>
            );
          })}
        </div>

        {/* ── Main two-column layout ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Active Orders panel */}
          <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-farm-dark flex items-center gap-2 text-sm">
                <ShoppingCart size={17} className="text-farm-green" /> Active Orders
              </h2>
              <Link to="/farmer/orders" className="text-xs text-farm-green hover:underline font-medium flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {data.activeOrders.length === 0 ? (
                <div className="py-14 text-center text-gray-400">
                  <ShoppingCart size={36} className="mx-auto mb-3 opacity-25" />
                  <p className="text-sm font-medium">No active orders right now</p>
                  <p className="text-xs mt-1">New orders will appear here</p>
                </div>
              ) : (
                data.activeOrders.slice(0, 5).map(order => (
                  <div
                    key={order._id}
                    onClick={() => navigate(`/farmer/orders/${order._id}`)}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 bg-farm-pale rounded-full flex items-center justify-center shrink-0 font-bold text-farm-green font-display">
                      {order.cropName?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-farm-dark text-sm">{order.cropName} · {order.quantity} kg</p>
                      <p className="text-xs text-gray-500 truncate">{order.buyer?.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge type="status" value={order.status} />
                      <ChevronRight size={15} className="text-gray-300 group-hover:text-farm-green transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right column: Quick actions + listings preview */}
          <div className="lg:col-span-2 space-y-5">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-bold text-farm-dark text-sm mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <Link
                  to="/farmer/listings/new"
                  className="flex items-center gap-2.5 p-3 bg-farm-green hover:bg-farm-dark text-white rounded-xl font-medium text-sm transition-colors shadow-sm shadow-farm-green/25"
                >
                  <Plus size={17} /> Add New Listing
                </Link>
                <Link
                  to="/farmer/orders?tab=pending"
                  className="flex items-center gap-2.5 p-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-100 rounded-xl font-medium text-sm transition-colors"
                >
                  <Clock size={17} className="text-amber-600" />
                  Pending Orders
                  {data.pendingOrders.length > 0 && (
                    <span className="ml-auto bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {data.pendingOrders.length}
                    </span>
                  )}
                </Link>
                <Link
                  to="/farmer/listings"
                  className="flex items-center gap-2.5 p-3 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-100 rounded-xl font-medium text-sm transition-colors"
                >
                  <Package size={17} className="text-gray-500" /> Manage Listings
                </Link>
              </div>
            </div>

            {/* My listings preview */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-bold text-farm-dark text-sm">My Listings</h2>
                <Link to="/farmer/listings" className="text-xs text-farm-green hover:underline">See all</Link>
              </div>
              <div className="divide-y divide-gray-50">
                {data.listings.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    No listings yet.{' '}
                    <Link to="/farmer/listings/new" className="text-farm-green font-medium underline">Add one</Link>
                  </div>
                ) : (
                  data.listings.slice(0, 4).map(listing => (
                    <div key={listing._id} className="flex items-center justify-between px-5 py-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-farm-dark truncate">{listing.cropName}</p>
                        <p className="text-xs text-gray-500">{listing.availableQty} kg · {formatINR(listing.pricePerKg)}/kg</p>
                      </div>
                      <Badge type="grade" value={listing.grade} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Pending Approval Cards ── */}
        {data.pendingOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg text-farm-dark">⏳ Pending Approvals</h2>
              <Link to="/farmer/orders?tab=pending" className="text-sm text-farm-green hover:underline font-medium">
                View all ({data.pendingOrders.length})
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {data.pendingOrders.slice(0, 4).map(order => (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border-l-4 border-l-amber-500 border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  onClick={() => navigate(`/farmer/orders/${order._id}`)}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <h4 className="font-bold text-farm-dark">{order.cropName} · {order.quantity} kg</h4>
                    <span className="font-bold text-farm-green text-sm">{formatINR(order.totalAmount)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">From: {order.buyer?.name}</p>
                  <div className="flex items-center justify-between">
                    <CountdownTimer deadline={order.acceptanceDeadline} />
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/farmer/orders/${order._id}`); }}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors"
                    >
                      Respond
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
