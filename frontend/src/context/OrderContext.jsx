import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const OrderContext = createContext(null);

const ORDERS_KEY = 'krishimitra-orders-v2';
const NOTIFICATIONS_KEY = 'krishimitra-order-notifications-v1';

const readOrders = () => {
  try {
    const raw = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const statusFromLegacy = (value) => {
      if (!value) return 'pending_farmer_approval';
      const v = String(value).trim().toLowerCase();
      if (v === 'pending' || v === 'order placed' || v === 'pending farmer approval') return 'pending_farmer_approval';
      if (v === 'accepted' || v === 'order confirmed' || v === 'confirmed') return 'order_confirmed';
      if (v === 'packed' || v === 'preparing order' || v === 'preparing') return 'preparing_order';
      if (v === 'out for delivery' || v === 'in transit' || v === 'in_transit') return 'out_for_delivery';
      if (v === 'delivered' || v === 'completed') return 'delivered';
      if (v === 'declined' || v === 'rejected' || v === 'order rejected') return 'order_rejected';
      return 'pending_farmer_approval';
    };

    return Array.isArray(raw)
      ? raw.map((order) => {
          const normalizedStatus = statusFromLegacy(order.status || order.orderStatus || order.deliveryStatus);
          return {
            ...order,
            status: normalizedStatus,
            orderStatus: ORDER_STATUS_LABELS[normalizedStatus],
            cropName: order.cropName || order.productName || 'Crop',
            productName: order.productName || order.cropName || 'Crop',
            pricePerKg: Number(order.pricePerKg ?? order.price ?? 0),
            price: Number(order.price ?? order.pricePerKg ?? 0),
            totalAmount: Number(order.totalAmount ?? 0),
          };
        })
      : [];
  } catch {
    return [];
  }
};

const readNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const resolveId = (value) => {
  if (!value) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return String(value._id || value.id || value.userId || '');
};

// eslint-disable-next-line react-refresh/only-export-components
export const ORDER_STATUSES = {
  PENDING_FARMER_APPROVAL: 'pending_farmer_approval',
  ORDER_CONFIRMED: 'order_confirmed',
  PREPARING_ORDER: 'preparing_order',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  ORDER_REJECTED: 'order_rejected',
};

// eslint-disable-next-line react-refresh/only-export-components
export const ORDER_STATUS_LABELS = {
  pending_farmer_approval: 'Pending Farmer Approval',
  order_confirmed: 'Order Confirmed',
  preparing_order: 'Preparing Order',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  order_rejected: 'Order Rejected',
};

// eslint-disable-next-line react-refresh/only-export-components
export const ORDER_STATUS_COLORS = {
  pending_farmer_approval: 'bg-amber-100 text-amber-800',
  order_confirmed: 'bg-green-100 text-green-800',
  preparing_order: 'bg-purple-100 text-purple-800',
  out_for_delivery: 'bg-orange-100 text-orange-800',
  delivered: 'bg-green-100 text-green-800',
  order_rejected: 'bg-red-100 text-red-800',
};

// eslint-disable-next-line react-refresh/only-export-components
export const PROGRESS_STEPS = [
  { key: 'pending_farmer_approval', label: 'Pending Approval' },
  { key: 'order_confirmed', label: 'Order Confirmed' },
  { key: 'preparing_order', label: 'Preparing Order' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

// eslint-disable-next-line react-refresh/only-export-components
export const DELIVERY_METHOD_LABELS = {
  farmer_delivery: 'Farmer Delivery',
  buyer_pickup: 'Farm Pickup',
  krishimitra_transport: 'KrishiMitra Transport',
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState(readOrders);
  const [notifications, setNotifications] = useState(readNotifications);

  useEffect(() => {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const addBuyerNotification = useCallback((buyerId, orderId, title, message) => {
    setNotifications((prev) => [
      {
        id: `NT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        buyerId,
        orderId,
        title,
        message,
        createdAt: new Date().toISOString(),
        read: false,
      },
      ...prev,
    ]);
  }, []);

  const placeOrder = useCallback((orderData) => {
    const buyerId = resolveId(orderData.buyerId);
    const farmerId = resolveId(orderData.farmerId);
    const newOrder = {
      id: `KM-${Date.now()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      orderId: `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      ...orderData,
      buyerId,
      farmerId,
      productName: orderData.productName || orderData.cropName,
      price: Number(orderData.price ?? orderData.pricePerKg ?? 0),
      paymentStatus: orderData.paymentStatus || 'Paid',
      status: ORDER_STATUSES.PENDING_FARMER_APPROVAL,
      orderStatus: ORDER_STATUS_LABELS.pending_farmer_approval,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setOrders((prev) => [newOrder, ...prev]);
    addBuyerNotification(
      newOrder.buyerId,
      newOrder.id,
      'Order Placed',
      `${newOrder.cropName} order is pending farmer approval.`
    );
    return newOrder;
  }, [addBuyerNotification]);

  const approveOrder = useCallback((orderId) => {
    let approvedOrder = null;
    setOrders((prev) => {
      approvedOrder = prev.find((o) => o.id === orderId) || null;
      return prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: ORDER_STATUSES.ORDER_CONFIRMED,
              orderStatus: ORDER_STATUS_LABELS.order_confirmed,
              updatedAt: new Date().toISOString(),
            }
          : o
      );
    });
    if (approvedOrder) {
      addBuyerNotification(
        approvedOrder.buyerId,
        approvedOrder.id,
        'Order Confirmed',
        `${approvedOrder.farmerName} approved your ${approvedOrder.cropName} order.`
      );
    }
    toast.success('Order approved! Buyer has been notified.');
  }, [addBuyerNotification]);

  const rejectOrder = useCallback((orderId, reason = '') => {
    let rejectedOrder = null;
    setOrders((prev) => {
      rejectedOrder = prev.find((o) => o.id === orderId) || null;
      return prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status: ORDER_STATUSES.ORDER_REJECTED,
              orderStatus: ORDER_STATUS_LABELS.order_rejected,
              rejectionReason: reason,
              updatedAt: new Date().toISOString(),
            }
          : o
      );
    });
    if (rejectedOrder) {
      addBuyerNotification(
        rejectedOrder.buyerId,
        rejectedOrder.id,
        'Order Rejected',
        reason
          ? `${rejectedOrder.farmerName} rejected your ${rejectedOrder.cropName} order: ${reason}`
          : `${rejectedOrder.farmerName} rejected your ${rejectedOrder.cropName} order.`
      );
    }
    toast.error('Order rejected. Buyer has been notified.');
  }, [addBuyerNotification]);

  const updateOrderStatus = useCallback((orderId, status) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              status,
              orderStatus: ORDER_STATUS_LABELS[status] || status,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );
  }, []);

  const getBuyerNotifications = useCallback(
    (buyerId) => notifications.filter((n) => (buyerId ? n.buyerId === buyerId : true)),
    [notifications]
  );

  const markBuyerNotificationsRead = useCallback((buyerId) => {
    setNotifications((prev) =>
      prev.map((n) => (!buyerId || n.buyerId === buyerId ? { ...n, read: true } : n))
    );
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        notifications,
        placeOrder,
        approveOrder,
        rejectOrder,
        updateOrderStatus,
        getBuyerNotifications,
        markBuyerNotificationsRead,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useOrders = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be used within OrderProvider');
  return ctx;
};
