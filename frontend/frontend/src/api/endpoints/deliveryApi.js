const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const dummyJob = {
  _id: 'job123',
  farmer: { name: 'Farmer Demo', phone: '9999999999', location: { district: 'Ratnagiri', village: 'Ratnagiri Rural', address: 'Plot 4, Mango Farms' } },
  buyer: { name: 'Buyer Demo', phone: '7777777777', location: { district: 'Mumbai', village: 'Andheri' } },
  deliveryAddress: '123 Tech Park, Andheri East, Mumbai',
  cropName: 'Alphonso Mango',
  quantity: 100,
  deliveryFee: 2500,
  status: 'pending',
  pickupDetails: { date: new Date().toISOString(), slot: '10:00 AM - 1:00 PM' }
};

export const deliveryApi = {
  getEstimate: async (data) => {
    await delay(400);
    // Generate a reasonable random cost between 1000 and 3000
    const randomCost = Math.floor(Math.random() * 2000) + 1000;
    return { data: { data: { cost: randomCost, distance: 250, duration: '5h 30m' } } };
  },
  getAvailableJobs: async (params) => {
    await delay(600);
    return { data: { data: [dummyJob, { ...dummyJob, _id: 'job456', cropName: 'Indrayani Rice', quantity: 500, deliveryFee: 4000, farmer: { ...dummyJob.farmer, location: { district: 'Pune' } } }] } };
  },
  getAssignedJobs: async () => {
    await delay(500);
    return { data: { data: [{ ...dummyJob, _id: 'job789', status: 'in_transit' }] } };
  },
  getDeliveryHistory: async () => {
    await delay(500);
    return { data: { data: [{ ...dummyJob, _id: 'job000', status: 'completed' }, { ...dummyJob, _id: 'job999', cropName: 'Onions', status: 'completed', deliveryFee: 3200 }] } };
  },
  acceptJob: async (id) => {
    await delay(500); return { data: { success: true } };
  },
  getJobById: async (id) => {
    await delay(400);
    return { data: { data: { ...dummyJob, _id: id, status: 'scheduled' } } };
  },
  updateJobStatus: async (id, data) => {
    await delay(500); return { data: { success: true } };
  },
  verifyPickup: async (id, otp) => {
    await delay(500); return { data: { success: true } };
  },
  verifyDelivery: async (id, otp) => {
    await delay(500); return { data: { success: true } };
  }
};
