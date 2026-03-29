import axios from 'axios';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_DEFAULT = Number.parseInt(process.env.ML_TIMEOUT_DEFAULT || '10000', 10);
const ML_TIMEOUT_QUALITY = Number.parseInt(process.env.ML_TIMEOUT_QUALITY || '28000', 10);

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_DEFAULT,
});

export async function callML(method, path, data, opts = {}) {
  const { retry = true, timeout, headers } = opts;
  const maxAttempts = retry ? 2 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await mlClient.request({
        method,
        url: path,
        data,
        timeout,
        headers,
      });

      return { success: true, data: response.data };
    } catch (error) {
      if (attempt === maxAttempts) {
        const statusCode = error?.response?.status;
        return { success: false, error: statusCode || 'NETWORK_ERROR' };
      }
    }
  }

  return { success: false, error: 'NETWORK_ERROR' };
}

export function getPriceSuggestion(payload) {
  return callML('POST', '/api/price/predict', payload, { retry: true });
}

export function getDemandForecast(payload) {
  return callML('POST', '/api/demand/forecast', payload, { retry: true });
}

export function getCropRecommendation(payload) {
  return callML('POST', '/api/recommendation/predict', payload, { retry: true });
}

export function getPriceRangePrediction(payload) {
  return callML('POST', '/api/price-range/predict', payload, { retry: true });
}

export function analyzeCropQuality(formData) {
  const qualityHeaders = typeof formData?.getHeaders === 'function' ? formData.getHeaders() : undefined;

  return callML('POST', '/api/quality/analyze', formData, {
    retry: false,
    timeout: ML_TIMEOUT_QUALITY,
    headers: qualityHeaders,
  });
}