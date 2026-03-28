import { useState, useMemo } from 'react';
import {
  useOrders,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  DELIVERY_METHOD_LABELS,
} from '../../context/OrderContext';
import { useAuth } from '../../hooks/useAuth';
import { formatINR } from '../../utils/formatCurrency';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShoppingCart,
  User,
  Package,
  Truck,
  Check,
  X,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';

const resolveId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value._id || value.id || value.userId || '');
};

const getCurrentUserId = (user) => {
  const fromState = resolveId(user);
  if (fromState) return fromState;
  try {
    const stored = JSON.parse(localStorage.getItem('user') || '{}');
    return resolveId(stored);
  } catch {
    return '';
  }
};

export const FarmerOrders = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { orders, approveOrder, rejectOrder } = useOrders();
  const [currentTab, setCurrentTab] = useState('pending');
  const [rejectTarget, setRejectTarget] = useState(null); // { id, cropName }
  const [rejectReason, setRejectReason] = useState('');

  const myOrders = useMemo(() => {
    const currentFarmerId = getCurrentUserId(user);
    if (!currentFarmerId) return [];
    return orders.filter((o) => resolveId(o.farmerId) === currentFarmerId);
  }, [orders, user]);

  const pendingCount = useMemo(
    () => myOrders.filter((o) => o.status === 'pending_farmer_approval').length,
    [myOrders]
  );

  const tabs = [
    { id: 'pending', label: t('farmer.orders.pendingApproval') },
    { id: 'confirmed', label: t('farmer.orders.confirmed') },
    { id: 'all', label: t('farmer.orders.allOrders') },
    { id: 'rejected', label: t('farmer.orders.rejected') },
  ];

  const filteredOrders = useMemo(() => {
    if (currentTab === 'pending')
      return myOrders.filter((o) => o.status === 'pending_farmer_approval');
    if (currentTab === 'confirmed')
      return myOrders.filter((o) =>
        ['order_confirmed', 'preparing_order', 'out_for_delivery', 'delivered'].includes(o.status)
      );
    if (currentTab === 'rejected')
      return myOrders.filter((o) => o.status === 'order_rejected');
    return myOrders;
  }, [myOrders, currentTab]);

  const handleConfirmReject = () => {
    if (rejectTarget) {
      rejectOrder(rejectTarget.id, rejectReason.trim());
      setRejectTarget(null);
      setRejectReason('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-farm-dark">{t('farmer.orders.title')}</h1>
            <p className="text-gray-500 text-sm mt-0.5">{myOrders.length} total orders</p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-full text-sm font-bold">
              <Clock size={15} />
              {pendingCount} {t('farmer.orders.awaitingApproval')}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`shrink-0 px-5 py-2 rounded-full font-semibold text-xs uppercase tracking-wide transition-all flex items-center gap-2 ${
                currentTab === tab.id
                  ? 'bg-farm-green text-white shadow-md shadow-farm-green/25'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {tab.label}
              {tab.id === 'pending' && pendingCount > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    currentTab === tab.id ? 'bg-white text-farm-green' : 'bg-amber-100 text-amber-700'
                  }`}
                >
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
            <ShoppingCart size={40} className="mx-auto mb-3 text-gray-300" />
            <h3 className="font-bold text-lg text-gray-400">
              No {currentTab !== 'all' ? currentTab : ''} orders
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {currentTab === 'pending'
                ? 'New buyer orders will appear here for your approval.'
                : 'Orders will appear here once buyers start purchasing.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col"
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-farm-pale rounded-xl overflow-hidden shrink-0">
                      {order.image ? (
                        <img
                          src={order.image}
                          alt={order.cropName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xl font-bold text-farm-green">
                          {order.cropName?.charAt(0) || '?'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-farm-dark truncate">{order.cropName}</h3>
                      <p className="text-xs text-gray-400 font-mono">{order.id}</p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                      ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>

                {/* Order details */}
                <div className="space-y-2 text-sm text-gray-600 mb-4 flex-1">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400 shrink-0" />
                    <span className="font-medium text-gray-700">{order.buyerName}</span>
                  </div>
                  {order.buyerPhone && (
                    <p className="text-xs text-gray-400 pl-5">{order.buyerPhone}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-gray-400 shrink-0" />
                    <span>
                      {order.quantity} kg × {formatINR(order.pricePerKg)}/kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck size={14} className="text-gray-400 shrink-0" />
                    <span>{DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod}</span>
                  </div>
                  {order.deliveryMethod === 'krishimitra_transport' &&
                    order.farmerDistrict &&
                    order.buyerDistrict && (
                      <p className="text-xs text-blue-600 pl-5 flex items-center gap-1">
                        <MapPin size={11} />
                        {order.farmerDistrict} → {order.buyerDistrict}
                        {order.distanceKm && (
                          <span className="ml-1 text-blue-400">~{order.distanceKm} km</span>
                        )}
                      </p>
                    )}
                  {order.deliveryInstructions && (
                    <p className="text-xs italic text-gray-400 pl-5">"{order.deliveryInstructions}"</p>
                  )}
                </div>

                {/* Footer: date + amount */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mb-4">
                  <span className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-bold text-xl text-farm-green">
                    {formatINR(order.totalAmount)}
                  </span>
                </div>

                {/* Action buttons — only for pending orders */}
                {order.status === 'pending_farmer_approval' && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => approveOrder(order.id)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-farm-green text-white text-sm font-bold hover:bg-farm-dark transition-colors shadow-sm"
                    >
                      <Check size={15} /> {t('farmer.orders.approve')}
                    </button>
                    <button
                      onClick={() => {
                        setRejectTarget({ id: order.id, cropName: order.cropName });
                        setRejectReason('');
                      }}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-bold hover:bg-red-100 transition-colors"
                    >
                      <X size={15} /> {t('farmer.orders.reject')}
                    </button>
                  </div>
                )}

                {/* Rejection reason display */}
                {order.status === 'order_rejected' && order.rejectionReason && (
                  <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-xl p-3 mt-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>Reason: {order.rejectionReason}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Reject Confirmation Modal ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <X size={18} />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-farm-dark">{t('farmer.orders.rejectTitle')}</h3>
                <p className="text-sm text-gray-500">{rejectTarget.cropName}</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3">
              Provide a reason (optional). The buyer will be notified about the rejection.
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="E.g., Stock no longer available, quality does not meet standards..."
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none mb-4"
            />

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRejectTarget(null)}
                className="py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-colors"
              >
                {t('farmer.orders.cancel')}
              </button>
              <button
                onClick={handleConfirmReject}
                className="py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm transition-colors"
              >
                {t('farmer.orders.rejectConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};