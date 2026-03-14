const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const dummyCrops = [
  { _id: 'c1', cropName: 'Alphonso Mango', category: 'fruit', pricePerKg: 800, quantity: 500, availableQty: 400, minOrderQty: 50, grade: 'A', perishability: 'high', status: 'active', harvestDate: new Date(Date.now() - 86400000*2).toISOString(), farmer: { name: 'Ramesh Patil', isVerified: true, location: { district: 'Ratnagiri', state: 'Maharashtra' }, rating: 4.9, completedOrders: 120 }, location: { district: 'Ratnagiri' }, images: [{ url: 'https://images.unsplash.com/photo-1553279768-865429ef9416?auto=format&fit=crop&w=600&q=80' }], deliveryOptions: { farmerDelivers: true, deliveryCharge: 500, buyerPickup: true, platformTransporter: true } },
  { _id: 'c2', cropName: 'Indrayani Rice', category: 'grain', pricePerKg: 65, quantity: 2000, availableQty: 2000, minOrderQty: 100, grade: 'A', perishability: 'low', status: 'active', harvestDate: new Date(Date.now() - 86400000*15).toISOString(), farmer: { name: 'Suresh Deshmukh', isVerified: true, location: { district: 'Pune', state: 'Maharashtra' }, rating: 4.7, completedOrders: 85 }, location: { district: 'Pune' }, images: [{ url: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?auto=format&fit=crop&w=600&q=80' }], deliveryOptions: { farmerDelivers: false, deliveryCharge: 0, buyerPickup: true, platformTransporter: true } },
  { _id: 'c3', cropName: 'Red Onion', category: 'vegetable', pricePerKg: 30, quantity: 5000, availableQty: 4500, minOrderQty: 500, grade: 'B', perishability: 'medium', status: 'active', harvestDate: new Date(Date.now() - 86400000*5).toISOString(), farmer: { name: 'Kisan Jadhav', isVerified: false, location: { district: 'Nashik', state: 'Maharashtra' }, rating: 4.5, completedOrders: 210 }, location: { district: 'Nashik' }, images: [{ url: 'https://images.unsplash.com/photo-1620574387735-3624d75b2dfc?auto=format&fit=crop&w=600&q=80' }], deliveryOptions: { farmerDelivers: true, deliveryCharge: 1500, buyerPickup: true, platformTransporter: true } },
  { _id: 'c4', cropName: 'Fresh Tomatoes', category: 'vegetable', pricePerKg: 20, quantity: 300, availableQty: 300, minOrderQty: 50, grade: 'A', perishability: 'high', status: 'active', harvestDate: new Date(Date.now() - 86400000*1).toISOString(), farmer: { name: 'Amit Pawar', isVerified: true, location: { district: 'Satara', state: 'Maharashtra' }, rating: 4.8, completedOrders: 45 }, location: { district: 'Satara' }, images: [{ url: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80' }], deliveryOptions: { farmerDelivers: true, deliveryCharge: 300, buyerPickup: true, platformTransporter: false } }
];

export const cropsApi = {
  getListings: async (params) => {
    await delay(600);
    return { data: { data: dummyCrops, pagination: { total: dummyCrops.length, pages: 1, limit: 10, page: 1 } } };
  },
  getListingById: async (id, userDistrict) => {
    await delay(400);
    const crop = dummyCrops.find(c => c._id === id) || dummyCrops[0];
    return { data: { data: crop } };
  },
  createListing: async (formData) => {
    await delay(1000);
    return { data: { data: { _id: 'cnew', status: 'active' } } };
  },
  updateListing: async (id, data) => {
    await delay(500);
    return { data: { data: { _id: id } } };
  },
  deleteListing: async (id) => {
    await delay(500);
    return { data: { success: true } };
  },
  getMyListings: async (params) => {
    await delay(500);
    return { data: { data: dummyCrops.slice(0, 2) } };
  }
};
