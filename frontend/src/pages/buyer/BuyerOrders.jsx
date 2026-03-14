import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useOrders,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PROGRESS_STEPS,
  DELIVERY_METHOD_LABELS,
} from '../../context/OrderContext';
import { useAuth } from '../../hooks/useAuth';
import { formatINR } from '../../utils/formatCurrency';
import { Package, Truck, CheckCircle, XCircle, MapPin, Clock, Bell } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

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

export const BuyerOrders = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { orders, getBuyerNotifications, markBuyerNotificationsRead } = useOrders();
  const [currentTab, setCurrentTab] = useState('all');

  const myOrders = useMemo(() => {
    const currentBuyerId = getCurrentUserId(user);
    if (!currentBuyerId) return orders;
    const filtered = orders.filter((o) => resolveId(o.buyerId) === currentBuyerId);
    return filtered.length > 0 ? filtered : orders;
  }, [orders, user]);

  const tabs = [
    { id: 'all', label: t('buyer.orders.allOrders') },
    { id: 'active', label: t('buyer.orders.active') },
    { id: 'delivered', label: t('buyer.orders.delivered') },
    { id: 'rejected', label: t('buyer.orders.rejected') },
  ];

  const filteredOrders = useMemo(() => {
    if (currentTab === 'delivered') return myOrders.filter((o) => o.status === 'delivered');
    if (currentTab === 'active')
      return myOrders.filter((o) => !['delivered', 'order_rejected'].includes(o.status));
    if (currentTab === 'rejected') return myOrders.filter((o) => o.status === 'order_rejected');
    return myOrders;
  }, [myOrders, currentTab]);

  const getStepIndex = (status) => PROGRESS_STEPS.findIndex((s) => s.key === status);
  const buyerNotifications = getBuyerNotifications(getCurrentUserId(user));
  const unreadNotifications = buyerNotifications.filter((n) => !n.read);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8c7a5a]">{t('buyer.orders.tracking')}</p>
          <h1 className="text-3xl font-display font-bold text-farm-dark">{t('buyer.orders.title')}</h1>
        </div>
        <Link
          to="/buyer/marketplace"
          className="px-5 py-2.5 bg-green-50 text-farm-green font-bold rounded-xl border border-green-200 hover:bg-green-100 transition-colors flex items-center gap-2"
        >
          <Package className="w-4 h-4" /> {t('buyer.orders.shopMore')}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`shrink-0 px-5 py-2.5 rounded-full font-bold text-sm transition-colors ${
              currentTab === tab.id
                ? 'bg-farm-green text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Buyer notifications */}
      {buyerNotifications.length > 0 && (
        <div className="mb-6 bg-white rounded-2xl border border-green-100 p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 text-farm-dark">
              <Bell size={16} className="text-farm-green" />
              <h2 className="font-semibold text-sm">{t('buyer.orders.notifications')}</h2>
              {unreadNotifications.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                  {unreadNotifications.length} new
                </span>
              )}
            </div>
            {unreadNotifications.length > 0 && (
              <button
                onClick={() => markBuyerNotificationsRead(getCurrentUserId(user))}
                className="text-xs font-semibold text-farm-green hover:text-farm-dark transition-colors"
              >
                {t('buyer.orders.markRead')}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {buyerNotifications.slice(0, 4).map((note) => (
              <div
                key={note.id}
                className={`rounded-xl border px-3 py-2.5 text-sm ${
                  note.read
                    ? 'border-gray-100 bg-gray-50 text-gray-600'
                    : 'border-green-100 bg-green-50 text-farm-dark'
                }`}
              >
                <p className="font-semibold">{note.title}</p>
                <p className="text-xs mt-0.5">{note.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
          <div className="w-16 h-16 bg-green-50 text-farm-green rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-farm-dark mb-2">{t('buyer.orders.noOrders')}</h3>
          <p className="text-gray-500 mb-6">
            {t('buyer.orders.noOrdersSub')}
          </p>
          <Link
            to="/buyer/marketplace"
            className="inline-block px-6 py-3 bg-farm-green hover:bg-farm-dark text-white font-bold rounded-xl transition-colors"
          >
            {t('common.browseMarketplace')}
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const isRejected = order.status === 'order_rejected';
            const stepIdx = getStepIndex(order.status);

            return (
              <div
                key={order.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-green-200 hover:shadow-md transition-all"
              >
                {/* Top row: image + info + status badge */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                    {order.image ? (
                      <img
                        src={order.image}
                        alt={order.cropName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🌾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-farm-dark leading-tight">
                          {order.cropName}
                        </h3>
                        <p className="text-sm text-gray-500">By {order.farmerName}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-4">
                  <span className="font-bold text-farm-dark">{formatINR(order.totalAmount)}</span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <Package className="w-3.5 h-3.5" /> {order.quantity} kg
                  </span>
                  <span className="capitalize text-gray-500">
                    {DELIVERY_METHOD_LABELS[order.deliveryMethod] || order.deliveryMethod}
                  </span>
                  {order.distanceKm && order.deliveryMethod === 'krishimitra_transport' && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <MapPin size={13} /> ~{order.distanceKm} km
                    </span>
                  )}
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                {/* Step progress indicator */}
                {!isRejected ? (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="relative flex items-start">
                      {/* Full connector */}
                      <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100" />
                      {/* Filled connector */}
                      {stepIdx >= 0 && (
                        <div
                          className="absolute top-3 left-3 h-0.5 bg-farm-green transition-all duration-700"
                          style={{
                            width: `${(stepIdx / (PROGRESS_STEPS.length - 1)) * (100 - (6 / PROGRESS_STEPS.length))}%`,
                          }}
                        />
                      )}

                      {PROGRESS_STEPS.map((step, index) => {
                        const isDone = stepIdx >= 0 && index <= stepIdx;
                        const isCurrent = index === stepIdx;
                        return (
                          <div
                            key={step.key}
                            className="flex-1 flex flex-col items-center gap-2 relative z-10"
                          >
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-farm-green border-farm-green'
                                  : 'bg-white border-gray-200'
                              } ${isCurrent ? 'ring-2 ring-farm-green ring-offset-1' : ''}`}
                            >
                              {isDone && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <p
                              className={`text-[10px] font-medium leading-tight text-center max-w-[60px] ${
                                isDone ? 'text-farm-dark' : 'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-gray-100 flex items-start gap-2 text-red-600">
                    <XCircle size={16} className="shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">
                      Order Rejected
                      {order.rejectionReason ? ` — ${order.rejectionReason}` : ''}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
