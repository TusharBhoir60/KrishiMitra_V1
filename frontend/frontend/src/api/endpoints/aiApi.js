const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const aiApi = {
  getPricePrediction: async (cropName, district) => {
    await delay(600);
    return { data: { available: true, predictedPrice: 750, confidence: 92, trend: 'up', source: 'Market Data Model' } };
  },
  getMarketTrends: async (district) => {
    await delay(800);
    return { data: { available: true, topCrops: [
      { name: 'Alphonso Mango', avgPrice: 800, demand: 'high' },
      { name: 'Red Onion', avgPrice: 35, demand: 'high' },
      { name: 'Indrayani Rice', avgPrice: 65, demand: 'medium' }
    ] } };
  }
};
