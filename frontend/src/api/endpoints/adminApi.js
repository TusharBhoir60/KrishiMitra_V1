import api from '../axiosConfig';

export const adminApi = {
  getPlatformStats: async () => {
    const res = await api.get('/admin/stats');
    return { data: { data: res.data.data } };
  },
  getDisputes: async () => {
    const res = await api.get('/admin/disputes');
    return { data: { data: res.data.data } };
  },
  resolveDispute: async (id, data) => {
    await api.patch(`/admin/disputes/${id}/resolve`, data);
    return { data: { success: true } };
  },
  getUsers: async () => {
    const res = await api.get('/admin/users');
    const users = res.data.data?.users || res.data.data || [];
    return { data: { data: users } };
  },
  verifyUser: async (id, data) => {
    await api.patch(`/admin/users/${id}/verify`, data);
    return { data: { success: true } };
  },
};

