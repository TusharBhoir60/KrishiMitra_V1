const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const adminApi = {
  getPlatformStats: async () => {
    await delay(500);
    return { data: { data: { users: 1245, orders: 342, transporters: 89, disputes: 2 } } };
  },
  getDisputes: async () => {
    await delay(500);
    return { data: { data: [
      { _id: 'ord123', disputeReason: 'Quality is much lower than Grade A described in the listing.', buyer: { name: 'Buyer Demo' }, farmer: { name: 'Farmer Demo' }, status: 'disputed' },
      { _id: 'ord456', disputeReason: 'Delivery was delayed by 3 days causing items to spoil.', buyer: { name: 'Another Buyer' }, farmer: { name: 'Another Farmer' }, status: 'disputed' }
    ] } };
  },
  resolveDispute: async (id, data) => {
    await delay(500); return { data: { success: true } };
  },
  getUsers: async () => {
    await delay(600);
    return { data: { data: [
      { _id: 'u1', name: 'Farmer Demo', phone: '9999999999', role: 'farmer', isVerified: true, location: { district: 'Ratnagiri' } },
      { _id: 'u2', name: 'Buyer Demo', phone: '7777777777', role: 'buyer', isVerified: false, location: { district: 'Mumbai' } },
      { _id: 'u3', name: 'Transporter Demo', phone: '8888888888', role: 'transporter', isVerified: true, location: { district: 'Pune' } },
      { _id: 'u4', name: 'Admin Demo', phone: '1111111111', role: 'admin', isVerified: true, location: { district: 'HQ' } }
    ] } };
  },
  verifyUser: async (id, data) => {
    await delay(500); return { data: { success: true } };
  }
};
