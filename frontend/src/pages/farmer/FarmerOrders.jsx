import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ordersApi } from '../../api/endpoints/ordersApi';
import { getStatusLabel, getStatusColor } from '../../utils/orderStatusHelpers';
import { formatINR } from '../../utils/formatCurrency';
import { useLanguage } from '../../context/LanguageContext';
import { StatusProgress } from '../../components/ui/StatusProgress';
import { CountdownTimer } from '../../components/ui/CountdownTimer';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import {
  ShoppingCart,
  Package,
  Check,
  X,
  Clock,
  MapPin,
  RefreshCw,
  User,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

const VALID_TABS = ['pending', 'active', 'completed', 'rejected', 'all'];
const ACTIVE_STATUSES = ['accepted', 'scheduled', 'dispatched', 'in_transit'];
const COMPLETED_STATUSES = ['delivered', 'completed'];
const REJECTED_STATUSES = ['declined', 'cancelled', 'expired', 'disputed', 'resolved'];
const TERMINAL_STATUSES = [...COMPLETED_STATUSES, ...REJECTED_STATUSES];

const getOrderId = (order) => String(order?._id || order?.id || '');

const getOrderImage = (order) => order?.image || order?.cropListing?.images?.[0]?.url || order?.cropListing?.images?.[0] || '';

const getCropName = (order) => order?.cropName || order?.orderDetails?.cropName || order?.cropListing?.cropName || 'Crop';

const getBuyerName = (order) => order?.buyerName || order?.buyer?.name || 'Buyer';

const getQuantity = (order) => {
  const rawQuantity = order?.quantity ?? order?.orderDetails?.quantity ?? 0;
  const parsedQuantity = Number(rawQuantity);
  return Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
};

const getPricePerKg = (order) => {
  const rawPrice = order?.pricePerKg ?? order?.orderDetails?.pricePerKg ?? 0;
  const parsedPrice = Number(rawPrice);
  return Number.isFinite(parsedPrice) ? parsedPrice : 0;
};

const getTotalAmount = (order) => {
  const rawTotal = order?.totalAmount ?? order?.orderDetails?.cropAmount ?? order?.delivery?.totalAmount ?? 0;
  const parsedTotal = Number(rawTotal);
  return Number.isFinite(parsedTotal) ? parsedTotal : 0;
};

const getDeliveryLabel = (method) => {
  const labels = {
    farmer_delivers: 'Farmer delivery',
    buyer_pickup: 'Buyer pickup',
    platform_transporter: 'Platform transporter',
  };

  if (!method) return 'Delivery';
  return labels[method] || method.replace(/_/g, ' ');
};

const getTabStatuses = (tab) => {
  if (tab === 'pending') return ['pending'];
  if (tab === 'active') return ACTIVE_STATUSES;
  if (tab === 'completed') return COMPLETED_STATUSES;
  if (tab === 'rejected') return REJECTED_STATUSES;
  return [];
};

const getEmptyTitleKey = (tab) => {
  if (tab === 'pending') return 'farmer.orders.noPendingOrders';
  if (tab === 'active') return 'farmer.orders.noActiveOrders';
  if (tab === 'completed') return 'farmer.orders.noCompletedOrders';
  if (tab === 'rejected') return 'farmer.orders.noRejectedOrders';
  return 'farmer.orders.noOrders';
};

const getEmptySubKey = (tab) => {
  if (tab === 'pending') return 'farmer.orders.noPendingOrdersSub';
  if (tab === 'active') return 'farmer.orders.noActiveOrdersSub';
  if (tab === 'completed') return 'farmer.orders.noCompletedOrdersSub';
  if (tab === 'rejected') return 'farmer.orders.noRejectedOrdersSub';
  return 'farmer.orders.noOrdersSub';
};

export const FarmerOrders = () => {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentTab, setCurrentTab] = useState(() => {
    const tabFromUrl = searchParams.get('tab');
    return VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'pending';
  });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await ordersApi.getFarmerOrders();
      setOrders(res.data?.data || []);
    } catch {
      setError(t('farmer.orders.loadingFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab');
    if (tabFromUrl && VALID_TABS.includes(tabFromUrl) && tabFromUrl !== currentTab) {
      setCurrentTab(tabFromUrl);
    }
  }, [searchParams, currentTab]);

  const filteredOrders = useMemo(() => {
    const statuses = getTabStatuses(currentTab);
    if (!statuses.length) return orders;
    return orders.filter((order) => statuses.includes(order.status));
  }, [orders, currentTab]);

  const orderCounts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter((order) => order.status === 'pending').length,
    active: orders.filter((order) => ACTIVE_STATUSES.includes(order.status)).length,
    completed: orders.filter((order) => COMPLETED_STATUSES.includes(order.status)).length,
    rejected: orders.filter((order) => REJECTED_STATUSES.includes(order.status)).length,
  }), [orders]);

  const pendingCount = orderCounts.pending;

  const tabs = [
    { id: 'pending', label: t('farmer.orders.pendingApproval') },
    { id: 'active', label: t('farmer.orders.active') },
    { id: 'completed', label: t('farmer.orders.completed') },
    { id: 'rejected', label: t('farmer.orders.rejected') },
    { id: 'all', label: t('farmer.orders.allOrders') },
  ];

  const summaryCards = [
    { key: 'all', label: t('farmer.orders.allOrders'), value: orderCounts.all },
    { key: 'pending', label: t('farmer.orders.pendingApproval'), value: orderCounts.pending },
    { key: 'active', label: t('farmer.orders.active'), value: orderCounts.active },
    { key: 'completed', label: t('farmer.orders.completed'), value: orderCounts.completed },
  ];

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setSearchParams({ tab });
  };

  const handleAccept = async (orderId) => {
    try {
      await ordersApi.acceptOrder(orderId);
      toast.success(t('farmer.orders.orderAccepted'));
      await fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || t('farmer.orders.actionFailed'));
    }
  };

  const handleReject = async (orderId, cropName) => {
    const confirmed = window.confirm(
      `${t('farmer.orders.rejectConfirm')}\n\n${cropName}`
    );
    if (!confirmed) return;

    try {
      await ordersApi.declineOrder(orderId);
      toast.success(t('farmer.orders.orderRejected'));
      await fetchOrders();
    } catch (e) {
      toast.error(e.response?.data?.message || t('farmer.orders.actionFailed'));
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-28 rounded-3xl bg-white border border-gray-200" />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-24 rounded-2xl bg-white border border-gray-200" />
            ))}
          </div>
          <div className="flex gap-2 overflow-hidden">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="h-11 w-28 rounded-full bg-white border border-gray-200" />
            ))}
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {[1, 2].map((n) => (
              <SkeletonCard key={n} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="bg-gradient-to-r from-farm-green via-farm-mid to-farm-light px-6 py-8 md:px-10 md:py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.24em] text-farm-pale/75">
              {t('farmer.orders.title')}
            </p>
            <h1 className="font-display text-3xl font-bold text-white md:text-4xl">
              {t('farmer.orders.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-farm-pale/80">
              {t('farmer.orders.subtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={fetchOrders}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
            >
              <RefreshCw className="h-4 w-4" /> {t('farmer.orders.refresh')}
            </button>
            {pendingCount > 0 && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-800 shadow-sm">
                <Clock size={15} />
                {pendingCount} {t('farmer.orders.awaitingApproval')}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <div
              key={card.key}
              className="rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gray-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-bold text-farm-dark">{card.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {tabs.map((tab) => {
            const count = orderCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-colors ${
                  currentTab === tab.id
                    ? 'bg-farm-green text-white shadow-md'
                    : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] ${
                    currentTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {filteredOrders.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
            <ShoppingCart size={42} className="mx-auto mb-4 text-gray-300" />
            <h3 className="font-display text-xl font-bold text-farm-dark">
              {t(getEmptyTitleKey(currentTab))}
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-gray-500">
              {t(getEmptySubKey(currentTab))}
            </p>
            <Link
              to="/farmer/listings"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-farm-green px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-farm-dark"
            >
              {t('farmer.dashboard.manageListings')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 xl:grid-cols-2">
            {filteredOrders.map((order) => {
              const orderId = getOrderId(order);
              const deliveryMethod = order.deliveryMethod || order.delivery?.method;
              const image = getOrderImage(order);
              const cropName = getCropName(order);
              const buyerName = getBuyerName(order);
              const quantity = getQuantity(order);
              const pricePerKg = getPricePerKg(order);
              const totalAmount = getTotalAmount(order);
              const isTerminal = TERMINAL_STATUSES.includes(order.status);
              const isPending = order.status === 'pending';

              return (
                <div
                  key={orderId || `${cropName}-${order.createdAt}`}
                  className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition-all hover:border-green-200 hover:shadow-md"
                >
                  <div className="grid gap-4 sm:grid-cols-[140px,1fr]">
                    <div className="bg-gray-100 sm:min-h-full">
                      <div className="aspect-square h-full w-full overflow-hidden sm:aspect-auto">
                        {image ? (
                          <img
                            src={image}
                            alt={cropName}
                            className="h-full w-full object-cover"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-4xl">🌾</div>
                        )}
                      </div>
                    </div>

                    <div className="min-w-0 p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="truncate text-lg font-bold leading-tight text-farm-dark">
                            {cropName}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            <User className="mr-1 inline h-4 w-4" /> {t('farmer.orders.buyer')}: {buyerName}
                          </p>
                        </div>
                        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                        <span className="font-bold text-farm-dark">{formatINR(totalAmount)}</span>
                        <span className="flex items-center gap-1.5 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1">
                          <Package className="h-3.5 w-3.5" />
                          {t('farmer.orders.quantityOrdered', { quantity })}
                        </span>
                        {pricePerKg > 0 && (
                          <span className="text-gray-500">
                            {formatINR(pricePerKg)}/kg
                          </span>
                        )}
                        <span className="capitalize text-gray-500">
                          {getDeliveryLabel(deliveryMethod)}
                        </span>
                        {order.delivery?.distanceKm && deliveryMethod === 'platform_transporter' && (
                          <span className="flex items-center gap-1 text-blue-600">
                            <MapPin size={13} /> ~{order.delivery.distanceKm} km
                          </span>
                        )}
                      </div>

                      {isPending && (
                        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                          <p className="text-sm font-bold text-amber-800">{t('farmer.orders.pendingApproval')}</p>
                          <p className="mt-1 text-xs text-amber-700">{t('farmer.orders.pendingApprovalSub')}</p>
                          <div className="mt-2">
                            <CountdownTimer deadline={order.acceptanceDeadline} />
                          </div>
                        </div>
                      )}

                      {!isTerminal && (
                        <div className="mt-4">
                          <StatusProgress currentStatus={order.status} deliveryMethod={deliveryMethod} />
                        </div>
                      )}

                      {isTerminal && order.status !== 'completed' && (
                        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-red-600">
                          <X size={16} className="mt-0.5 shrink-0" />
                          <span className="text-sm font-medium capitalize">{getStatusLabel(order.status)}</span>
                        </div>
                      )}

                      <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="flex items-center gap-1 text-sm text-gray-400">
                          <Clock size={12} />
                          {t('farmer.orders.orderedOn')} {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                        <Link
                          to={`/farmer/orders/${orderId}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.18em] text-farm-green"
                        >
                          {t('farmer.orders.viewDetails')} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>

                      {isPending && (
                        <div className="mt-4 grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => handleAccept(orderId)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-farm-green px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-farm-dark"
                          >
                            <Check size={15} /> {t('farmer.orders.approve')}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(orderId, cropName)}
                            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-100"
                          >
                            <X size={15} /> {t('farmer.orders.reject')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
