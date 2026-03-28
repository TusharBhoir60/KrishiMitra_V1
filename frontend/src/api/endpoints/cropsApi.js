import api from '../axiosConfig';

const toListingsQuery = (params) => {
  const q = {};
  if (params?.search) q.crop = params.search;
  if (params?.crop) q.crop = params.crop;
  if (params?.state) q.state = params.state;
  if (params?.minPrice != null) q.minPrice = params.minPrice;
  if (params?.maxPrice != null) q.maxPrice = params.maxPrice;
  if (params?.grade) q.grade = params.grade;
  if (params?.perishability) q.perishability = params.perishability;
  if (params?.platformTransporter === true) q.deliveryMethod = 'platform_transporter';
  else if (params?.deliveryMethod) q.deliveryMethod = params.deliveryMethod;
  return q;
};

export const cropsApi = {
  getListings: async (params) => {
    const res = await api.get('/listings', { params: toListingsQuery(params || {}) });
    const list = res.data.data || [];
    const pagination = { total: list.length, pages: 1, limit: 50, page: 1 };
    return { data: { data: list, pagination } };
  },
  getListingById: async (id) => {
    const res = await api.get(`/listings/${id}`);
    const listing = res.data.data || {};
    if (listing.delivery && !listing.deliveryOptions) {
      listing.deliveryOptions = {
        farmerDelivers: listing.delivery.farmerDelivers,
        buyerPickup: listing.delivery.buyerPickup,
        platformTransporter: listing.delivery.platformTransporter,
        deliveryCharge: listing.delivery.additionalDeliveryCharge,
      };
    }
    if (listing.quality && (listing.perishability === undefined || listing.grade === undefined)) {
      listing.perishability = listing.quality.perishability;
      listing.grade = listing.quality.grade;
    }
    return { data: { data: listing } };
  },
  createListing: async (formData) => {
    const res = await api.post('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { data: { data: res.data.data } };
  },
  updateListing: async (id, formData) => {
    const res = await api.put(`/listings/${id}`, formData, {
      headers: formData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return { data: { data: res.data.data } };
  },
  deleteListing: async (id) => {
    await api.delete(`/listings/${id}`);
    return { data: { success: true } };
  },
  getMyListings: async () => {
    const res = await api.get('/listings/my');
    return { data: { data: res.data.data || [] } };
  },
};
