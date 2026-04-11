import { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { getStatusLabel, getStatusColor } from '../../utils/orderStatusHelpers';
import { formatINR } from '../../utils/formatCurrency';
import { Package, Truck, CheckCircle, XCircle, MapPin, Clock, ShoppingBag } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { StatusProgress } from '../../components/ui/StatusProgress';

// FIX: removed useOrders / OrderContext entirely — all data comes from the real API now

const TERMINAL_STATUSES = ['declined', 'cancelled', 'expired'];
const ACTIVE_STATUSES = ['accepted', 'scheduled', 'dispatched', 'in_transit'];
const DELIVERED_STATUSES = ['delivered', 'completed'];

export const BuyerOrders = () => {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTab, setCurrentTab] = useState('all');
  const autoSelectedPending = useRef(false);

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

  useEffect(() => {
    if (loading || autoSelectedPending.current) return;
    if (currentTab === 'all' && orders.some((order) => order.status === 'pending')) {
      autoSelectedPending.current = true;
      setCurrentTab('pending');
    }
  }, [orders, loading, currentTab]);

  const tabs = [
    { id: 'all', label: t('buyer.orders.allOrders') },
    { id: 'pending', label: t('buyer.orders.pending') },
    { id: 'active', label: t('buyer.orders.active') },
    { id: 'delivered', label: t('buyer.orders.delivered') },
    { id: 'cancelled', label: t('buyer.orders.rejected') },
  ];

  const orderCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    active: orders.filter((order) => ACTIVE_STATUSES.includes(order.status) || order.status === 'pending').length,
    delivered: orders.filter((order) => DELIVERED_STATUSES.includes(order.status)).length,
    cancelled: orders.filter((order) => TERMINAL_STATUSES.includes(order.status)).length,
  }), [orders]);

  const filteredOrders = useMemo(() => {
    if (currentTab === 'pending') return orders.filter((o) => o.status === 'pending');
    if (currentTab === 'delivered') return orders.filter((o) => DELIVERED_STATUSES.includes(o.status));
    if (currentTab === 'active') return orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    if (currentTab === 'cancelled') return orders.filter((o) => TERMINAL_STATUSES.includes(o.status));
    return orders;
  }, [orders, currentTab]);

  const getOrderImage = (order) => order.cropListing?.images?.[0]?.url || order.cropListing?.images?.[0] || '';

  const getOrderQuantity = (order) => {
    const rawQuantity = order?.orderDetails?.quantity ?? order?.quantity ?? order?.qty ?? 0;
    const numericQuantity = Number(rawQuantity);
    return Number.isFinite(numericQuantity) && numericQuantity > 0 ? numericQuantity : null;
  };

  const getTotalAmount = (order) => {
    const rawTotal = order?.delivery?.totalAmount ?? order?.totalAmount ?? 0;
    const numericTotal = Number(rawTotal);
    return Number.isFinite(numericTotal) ? numericTotal : 0;
  };

  const getSummaryTone = (key) => {
    switch (key) {
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'active': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-24 rounded-3xl bg-white border border-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-white border border-gray-200 rounded-3xl" />
            ))}
          </div>
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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-8 overflow-hidden rounded-[2rem] border border-blue-100 bg-gradient-to-r from-[#eff6ff] via-white to-[#ecfeff] p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#5b6b8a]">{t('buyer.orders.tracking')}</p>
            <h1 className="text-3xl font-display font-bold text-farm-dark">{t('buyer.orders.title')}</h1>
            <p className="mt-1 text-sm text-gray-600">{t('buyer.orders.subtitle')}</p>
          </div>
          <Link
            to="/buyer/marketplace"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-5 py-2.5 font-bold text-blue-700 transition-colors hover:bg-blue-50"
          >
            <ShoppingBag className="h-4 w-4" /> {t('buyer.orders.shopMore')}
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { key: 'all', label: t('buyer.orders.allOrders'), value: orderCounts.all },
            { key: 'pending', label: t('buyer.orders.pending'), value: orderCounts.pending },
            { key: 'active', label: t('buyer.orders.active'), value: orderCounts.active },
            { key: 'delivered', label: t('buyer.orders.delivered'), value: orderCounts.delivered },
            { key: 'cancelled', label: t('buyer.orders.rejected'), value: orderCounts.cancelled },
          ].map((item) => (
            <div key={item.key} className={`rounded-2xl border bg-white/90 px-4 py-3 shadow-sm ${getSummaryTone(item.key)}`}>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">{item.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id)}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
              currentTab === tab.id
                ? 'bg-farm-green text-white shadow-md'
                : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
            <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${currentTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
              {orderCounts[tab.id] || 0}
            </span>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-farm-green">
            <Truck className="h-8 w-8" />
          </div>
          <h3 className="mb-2 font-display text-xl font-bold text-farm-dark">
            {currentTab === 'pending' ? t('buyer.orders.noPendingOrders') : t('buyer.orders.noOrders')}
          </h3>
          <p className="mb-6 text-gray-500">
            {currentTab === 'pending'
              ? t('buyer.orders.noPendingOrdersSub')
              : t('buyer.orders.noOrdersSub')}
          </p>
          <Link
            to="/buyer/marketplace"
            className="inline-block px-6 py-3 bg-farm-green hover:bg-farm-dark text-white font-bold rounded-xl transition-colors"
          >
            {t('common.browseMarketplace')}
          </Link>
        </div>
      ) : (
          <div className="grid gap-4 xl:grid-cols-2">
          {filteredOrders.map((order) => {
            const isTerminal = TERMINAL_STATUSES.includes(order.status);
            const deliveryMethod = order.delivery?.method;
            const fallbackImage = getOrderImage(order);

            return (
              // FIX: each card links to the real order detail page using order._id
              <Link
                key={order._id}
                to={`/buyer/orders/${order._id}`}
                className="block overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:border-green-200 hover:shadow-md"
              >
                <div className="grid gap-4 sm:grid-cols-[120px,1fr]">
                  <div className="bg-gray-100 sm:min-h-full">
                    <div className="aspect-square h-full w-full overflow-hidden sm:aspect-auto">
                    {fallbackImage ? (
                      <img
                        src={fallbackImage}
                        alt={order.orderDetails?.cropName}
                        className="h-full w-full object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl">🌾</div>
                    )}
                    </div>
                  </div>
                  <div className="p-5 sm:p-6 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-bold leading-tight text-farm-dark">{order.orderDetails?.cropName}</h3>
                        <p className="mt-1 text-sm text-gray-500">By {order.farmer?.name}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                      <span className="font-bold text-farm-dark">{formatINR(getTotalAmount(order))}</span>
                      <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                        <Package className="h-3.5 w-3.5" /> {t('buyer.orders.quantityOrdered', { quantity: getOrderQuantity(order) ?? 0 })}
                      </span>
                      <span className="capitalize text-gray-500">
                        {deliveryMethod?.replace('_', ' ')}
                      </span>
                      {order.delivery?.distanceKm && deliveryMethod === 'platform_transporter' && (
                        <span className="flex items-center gap-1 text-blue-600">
                          <MapPin size={13} /> ~{order.delivery.distanceKm} km
                        </span>
                      )}
                    </div>

                    {order.status === 'pending' && (
                      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-bold text-amber-800">{t('buyer.orders.pendingApproval')}</p>
                        <p className="mt-1 text-xs text-amber-700">{t('buyer.orders.pendingApprovalSub')}</p>
                      </div>
                    )}

                    {!isTerminal && (
                      <div className="mt-4">
                        <StatusProgress currentStatus={order.status} deliveryMethod={deliveryMethod} />
                      </div>
                    )}

                    {isTerminal && (
                      <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600">
                        <XCircle size={16} className="mt-0.5 shrink-0" />
                        <span className="text-sm font-medium capitalize">{order.status}</span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-sm">
                      <span className="flex items-center gap-1 text-gray-400">
                        <Clock size={12} />
                        {t('buyer.orders.orderedOn')} {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-farm-green">{t('buyer.orders.viewDetails')}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};