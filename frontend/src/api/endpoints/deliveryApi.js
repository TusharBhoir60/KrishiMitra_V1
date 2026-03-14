import api from '../axiosConfig';

export const deliveryApi = {
  getEstimate: async (data) => {
    const res = await api.get('/delivery/estimate', {
      params: {
        fromDistrict: data?.fromDistrict,
        toDistrict: data?.toDistrict,
        quantity: data?.quantity,
        perishability: data?.perishability || 'medium',
      },
    });

    const estimate = res.data?.data || {};
    return {
      data: {
        data: {
          available: estimate.available,
          cost: estimate.estimatedCost ?? 0,
          distance: estimate.distanceKm,
          zone: estimate.zone,
          reason: estimate.reason,
        },
      },
    };
  },

  getAvailableJobs: async () => {
    const res = await api.get('/transporter/available-jobs');
    const jobs = res.data.data?.jobs || [];
    return { data: { data: jobs } };
  },

  getAssignedJobs: async (params) => {
    const res = await api.get('/transporter/my-jobs', { params: params || {} });
    const jobs = res.data.data?.jobs || [];
    return { data: { data: jobs } };
  },

  getDeliveryHistory: async () => {
    const [res1, res2] = await Promise.allSettled([
      api.get('/transporter/my-jobs', { params: { status: 'delivered' } }),
      api.get('/transporter/my-jobs', { params: { status: 'completed' } }),
    ]);
    const delivered = res1.status === 'fulfilled' ? res1.value.data?.data?.jobs || [] : [];
    const completed = res2.status === 'fulfilled' ? res2.value.data?.data?.jobs || [] : [];
    const all = [
      ...delivered,
      ...completed.filter((j) => !delivered.find((d) => d._id === j._id)),
    ];
    return { data: { data: all } };
  },

  acceptJob: async (id) => {
    await api.patch(`/transporter/jobs/${id}/accept`);
    return { data: { success: true } };
  },

  getJobById: async (id) => {
    const res = await api.get(`/transporter/my-jobs/${id}`);
    const job = res.data.data?.job || res.data.data;
    return { data: { data: job } };
  },

  updateJobStatus: async (id, data) => {
    const res = await api.patch(`/transporter/jobs/${id}/status`, data);
    return { data: { success: true, ...(res.data?.data || {}) } };
  },

  verifyPickup: async (id, otp) => {
    await api.patch(`/orders/${id}/verify-otp`, { otp });
    return { data: { success: true } };
  },

  verifyDelivery: async (id, otp) => {
    await api.patch(`/orders/${id}/mark-delivered`);
    return { data: { success: true } };
  },
};

