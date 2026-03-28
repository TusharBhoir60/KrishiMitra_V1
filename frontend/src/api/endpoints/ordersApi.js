import api from '../axiosConfig';

export const ordersApi = {
  createOrder: async (payload) => {
    const body = {
      cropListingId: payload.listingId || payload.cropListingId,
      quantity: Number(payload.quantity),
      deliveryMethod: payload.deliveryMethod,
      buyerAddress: payload.deliveryAddress || payload.buyerAddress,
      agreedDate: payload.preferredDate || payload.agreedDate,
      buyerNote: payload.specialInstructions || payload.buyerNote,
    };
    const res = await api.post('/orders', body);
    const order = res.data.data?.order || res.data.data;
    return { data: { data: order } };
  },

  getOrders: async (params) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const url = user.role === 'farmer' ? '/orders/incoming' : '/orders/my';
    const res = await api.get(url, { params: params || {} });
    const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.orders || []);
    return { data: { data: list } };
  },

  // FIX: dedicated buyer orders fetch (always hits /orders/my regardless of role in localStorage)
  getBuyerOrders: async (params) => {
    const res = await api.get('/orders/my', { params: params || {} });
    const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.orders || []);
    return { data: { data: list } };
  },

  getOrderById: async (id) => {
    const res = await api.get(`/orders/${id}`);
    return { data: { data: res.data.data } };
  },

  acceptOrder: async (id) => {
    await api.patch(`/orders/${id}/accept`);
    return { data: { success: true } };
  },

  declineOrder: async (id) => {
    await api.patch(`/orders/${id}/status`, { status: 'declined' });
    return { data: { success: true } };
  },

  // FIX: dedicated buyer cancel endpoint — separate from farmer decline
  cancelOrder: async (id) => {
    await api.patch(`/orders/${id}/status`, { status: 'cancelled' });
    return { data: { success: true } };
  },

  schedulePickup: async (id, details) => {
    const res = await api.patch(`/orders/${id}/schedule-pickup`, {
      scheduledDate: details.date || details.scheduledDate,
      scheduledSlot: details.slot || details.scheduledSlot,
    });
    return { data: res.data.data };
  },

  dispatchOrder: async (id) => {
    await api.patch(`/orders/${id}/dispatch`);
    return { data: { success: true } };
  },

  confirmHandoff: async (id) => {
    await api.patch(`/orders/${id}/confirm-handoff`);
    return { data: { success: true } };
  },

  confirmReceived: async (id, review) => {
    const body = {
      farmerRating: review?.farmerRating ?? review?.rating ?? 5,
      farmerComment: review?.farmerComment ?? review?.review ?? '',
      transporterRating: review?.transporterRating ?? null,
      transporterComment: review?.transporterComment ?? null,
    };
    await api.patch(`/orders/${id}/confirm-received`, body);
    return { data: { success: true } };
  },

  raiseDispute: async (id, payload) => {
    const formData = new FormData();
    if (payload.reason != null) formData.append('reason', payload.reason);
    if (payload.description != null) formData.append('description', payload.description);
    if (payload.evidence && payload.evidence.length) {
      payload.evidence.forEach((file) => formData.append('evidence', file));
    }
    const res = await api.post(`/orders/${id}/dispute`, formData);
    return { data: res.data.data };
  },
};