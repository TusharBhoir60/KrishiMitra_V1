import api from '../axiosConfig';

export const aiApi = {
  getPricePrediction: async (cropName, district) => {
    const res = await api.get('/ai/price-prediction', { params: { cropName, district } });
    return { data: res.data.data };
  },
  analyzeQuality: async (file, cropName) => {
    const formData = new FormData();
    formData.append('file', file);
    if (cropName) {
      formData.append('cropName', cropName);
    }

    const res = await api.post('/ai/quality', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return { data: res.data.data };
  },
  getMarketTrends: async (district) => {
    const res = await api.get('/ai/market-trends', { params: { district } });
    return { data: res.data.data };
  }
};
