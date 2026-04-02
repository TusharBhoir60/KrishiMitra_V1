import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { getStatusLabel, getStatusColor } from '../../utils/orderStatusHelpers';
import { formatINR } from '../../utils/formatCurrency';
import { Package, Truck, CheckCircle, XCircle, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// FIX: removed useOrders / OrderContext entirely — all data comes from the real API now

const PROGRESS_STEPS = [
  { key: 'pending',    label: 'Pending' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'dispatched', label: 'Dispatched' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'completed',  label: 'Completed' },
];

const TRANSPORTER_STEPS = [
  { key: 'pending',    label: 'Pending' },
  { key: 'accepted',   label: 'Accepted' },
  { key: 'scheduled',  label: 'Scheduled' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'completed',  label: 'Completed' },
];

const TERMINAL_STATUSES = ['declined', 'cancelled', 'expired'];

export const BuyerOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');

  // FIX: fetch real orders from the API on mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setError(null);
        const res = await ordersApi.getBuyerOrders();
        setOrders(res.data?.data || []);
      } catch {
        setError('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const tabs = [
    { id: 'all',       label: t('buyer.orders.allOrders') },
    { id: 'active',    label: t('buyer.orders.active') },
    { id: 'delivered', label: t('buyer.orders.delivered') },
    { id: 'cancelled', label: t('buyer.orders.rejected') },
  ];

  const filteredOrders = useMemo(() => {
    if (currentTab === 'delivered') return orders.filter((o) => o.status === 'delivered' || o.status === 'completed');
    if (currentTab === 'active')    return orders.filter((o) => !['delivered', 'completed', ...TERMINAL_STATUSES].includes(o.status));
    if (currentTab === 'cancelled') return orders.filter((o) => TERMINAL_STATUSES.includes(o.status));
    return orders;
  }, [orders, currentTab]);

  const getSteps = (order) =>
    order.delivery?.method === 'platform_transporter' ? TRANSPORTER_STEPS : PROGRESS_STEPS;

  const getStepIndex = (order) => {
    const steps = getSteps(order);
    const idx = steps.findIndex((s) => s.key === order.status);
    return idx !== -1 ? idx : 0;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-farm-green text-white font-bold rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

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

      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 border-dashed p-12 text-center">
          <div className="w-16 h-16 bg-green-50 text-farm-green rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8" />
          </div>
          <h3 className="font-display font-bold text-xl text-farm-dark mb-2">{t('buyer.orders.noOrders')}</h3>
          <p className="text-gray-500 mb-6">{t('buyer.orders.noOrdersSub')}</p>
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
            const isTerminal = TERMINAL_STATUSES.includes(order.status);
            const stepIdx = getStepIndex(order);
            const steps = getSteps(order);
            const deliveryMethod = order.delivery?.method;

            return (
              // FIX: each card links to the real order detail page using order._id
              <Link
                key={order._id}
                to={`/buyer/orders/${order._id}`}
                className="block bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-green-200 hover:shadow-md transition-all"
              >
                {/* Top row */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl overflow-hidden shrink-0">
                    {order.cropListing?.images?.[0]?.url ? (
                      <img src={order.cropListing.images[0].url} alt={order.orderDetails?.cropName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl">🌾</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-lg text-farm-dark leading-tight">{order.orderDetails?.cropName}</h3>
                        <p className="text-sm text-gray-500">By {order.farmer?.name}</p>
                      </div>
                      {/* FIX: use getStatusColor/getStatusLabel from orderStatusHelpers */}
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mb-4">
                  <span className="font-bold text-farm-dark">{formatINR(order.delivery?.totalAmount)}</span>
                  <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                    <Package className="w-3.5 h-3.5" /> {order.orderDetails?.quantity} kg
                  </span>
                  <span className="capitalize text-gray-500">
                    {deliveryMethod?.replace('_', ' ')}
                  </span>
                  {order.delivery?.distanceKm && deliveryMethod === 'platform_transporter' && (
                    <span className="flex items-center gap-1 text-blue-600">
                      <MapPin size={13} /> ~{order.delivery.distanceKm} km
                    </span>
                  )}
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>

                {/* Step progress */}
                {!isTerminal ? (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="relative flex items-start">
                      <div className="absolute top-3 left-3 right-3 h-0.5 bg-gray-100" />
                      {stepIdx >= 0 && (
                        <div
                          className="absolute top-3 left-3 h-0.5 bg-farm-green transition-all duration-700"
                          style={{ width: `${(stepIdx / (steps.length - 1)) * (100 - (6 / steps.length))}%` }}
                        />
                      )}
                      {steps.map((step, index) => {
                        const isDone = stepIdx >= 0 && index <= stepIdx;
                        const isCurrent = index === stepIdx;
                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center gap-2 relative z-10">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isDone ? 'bg-farm-green border-farm-green' : 'bg-white border-gray-200'} ${isCurrent ? 'ring-2 ring-farm-green ring-offset-1' : ''}`}>
                              {isDone && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <p className={`text-[10px] font-medium leading-tight text-center max-w-[60px] ${isDone ? 'text-farm-dark' : 'text-gray-400'}`}>
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
                    <span className="text-sm font-medium capitalize">{order.status}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};