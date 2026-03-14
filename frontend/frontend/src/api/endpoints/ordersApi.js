const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const dummyOrder = {
  _id: 'ord123',
  listingId: 'c1',
  cropName: 'Alphonso Mango',
  quantity: 100,
  pricePerKg: 800,
  grade: 'A',
  cropAmount: 80000,
  deliveryFee: 1500,
  platformFee: 1600,
  totalAmount: 83100,
  status: 'pending',
  deliveryMethod: 'platform_transporter',
  buyer: { _id: 'b1', name: 'Buyer Demo', phone: '7777777777', location: { district: 'Mumbai', village: 'Andheri' } },
  farmer: { _id: 'f1', name: 'Farmer Demo', phone: '9999999999', location: { district: 'Ratnagiri', village: 'Ratnagiri Rural' }, rating: 4.8 },
  transporter: { name: 'Transporter Demo', phone: '8888888888', vehicleNumber: 'MH 04 AB 1234' },
  acceptanceDeadline: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString(),
  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  deliveryAddress: '123 Tech Park, Andheri East, Mumbai',
  otp: '4521',
  pickupDetails: { date: new Date().toISOString(), slot: '10:00 AM - 1:00 PM' }
};

export const ordersApi = {
  createOrder: async (data) => {
    await delay(1000);
    return { data: { data: { ...dummyOrder, ...data, _id: 'ord' + Math.floor(Math.random()*1000), status: 'pending' } } };
  },
  getOrders: async (params) => {
    await delay(600);
    const order1 = { ...dummyOrder, _id: 'ord1', status: 'pending' };
    const order2 = { ...dummyOrder, _id: 'ord2', cropName: 'Indrayani Rice', quantity: 50, totalAmount: 3500, status: 'accepted', deliveryMethod: 'farmer_delivers', preferredDate: new Date().toISOString() };
    const order3 = { ...dummyOrder, _id: 'ord3', cropName: 'Red Onion', quantity: 200, totalAmount: 7000, status: 'in_transit' };
    const order4 = { ...dummyOrder, _id: 'ord4', cropName: 'Fresh Tomatoes', quantity: 30, totalAmount: 650, status: 'completed' };
    
    let filtered = [order1, order2, order3, order4];
    if (params?.status) {
      const statuses = params.status.split(',');
      filtered = filtered.filter(o => statuses.includes(o.status));
    }
    return { data: { data: filtered } };
  },
  getOrderById: async (id) => {
    await delay(400);
    // Return dummy order with requested ID to prevent 404s
    return { data: { data: { ...dummyOrder, _id: id } } };
  },
  acceptOrder: async (id) => {
    await delay(500); return { data: { success: true } };
  },
  declineOrder: async (id, reason) => {
    await delay(500); return { data: { success: true } };
  },
  dispatchOrder: async (id) => {
    await delay(500); return { data: { success: true } };
  },
  confirmHandoff: async (id) => {
    await delay(500); return { data: { success: true } };
  },
  schedulePickup: async (id, details) => {
    await delay(500); return { data: { success: true } };
  },
  confirmReceived: async (id, review) => {
    await delay(500); return { data: { success: true } };
  }
};
