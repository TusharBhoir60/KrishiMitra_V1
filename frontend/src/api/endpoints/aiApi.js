import api from '../axiosConfig';

export const aiApi = {
  getPricePrediction: async (cropName, district) => {
    const res = await api.get('/ai/price-prediction', { params: { cropName, district } });
    return { data: res.data.data };
  },
  getMarketTrends: async (district) => {
    const res = await api.get('/ai/market-trends', { params: { district } });
    return { data: res.data.data };
  }
};
