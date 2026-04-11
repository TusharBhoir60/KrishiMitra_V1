import api from '../axiosConfig';

export const notificationsApi = {
  getNotifications: async (params) => {
    const res = await api.get('/notifications', { params: params || {} });
    const payload = res.data.data || {};
    const list = payload.notifications || [];
    return { data: { data: list, total: payload.total, page: payload.page, totalPages: payload.totalPages } };
  },
  getUnreadCount: async () => {
    const res = await api.get('/notifications/unread-count');
    const count = res.data.data?.count ?? 0;
    return { data: { count } };
  },
  markAsRead: async (id) => {
    await api.patch(`/notifications/${id}/read`);
    return { data: { success: true } };
  },
  markAllAsRead: async () => {
    await api.patch('/notifications/read-all');
    return { data: { success: true } };
  },
};
