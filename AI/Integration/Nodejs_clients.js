/**
 * AgriConnect ML Client - Node.js Integration
 * =============================================
 * Drop-in HTTP client for the Python ML microservice.
 * Provides typed wrappers for all 3 phases with retry logic,
 * timeout handling, and graceful fallbacks.
 *
 * Usage in your Express route:
 *
 *   const mlClient = require('./integration/nodejs_client');
 *
 *   // Price prediction
 *   const price = await mlClient.predictPrice({ cropName: 'Tomato', state: 'Maharashtra', ... });
 *
 *   // Demand forecast
 *   const demand = await mlClient.forecastDemand({ cropName: 'Tomato', state: 'Maharashtra', ... });
 *
 *   // Crop quality (multipart image)
 *   const quality = await mlClient.analyzeCropQuality(imageBuffer, 'image/jpeg', 'Tomato');
 */

const axios = require('axios');
const FormData = require('form-data');

// Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS = parseInt(process.env.ML_TIMEOUT_MS || '10000', 10);
const ML_RETRIES = parseInt(process.env.ML_RETRIES || '2', 10);

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

function detectImageMimeFromBuffer(buffer) {
  if (!buffer || buffer.length < 4) {
    return null;
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

function extensionFromMime(mimeType) {
  if (mimeType === 'image/jpeg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  return 'bin';
}

async function withRetry(fn, retries = ML_RETRIES, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = !err.response || err.response.status >= 500;
      if (attempt <= retries && isRetryable) {
        console.warn(`[MLClient] Attempt ${attempt} failed - retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

async function predictPrice(params) {
  return withRetry(async () => {
    const { data } = await client.post('/api/price/predict', params);
    return data;
  });
}

async function predictPriceBatch(items) {
  return withRetry(async () => {
    const { data } = await client.post('/api/price/batch', { items });
    return data;
  });
}

async function forecastDemand(params) {
  return withRetry(async () => {
    const { data } = await client.post('/api/demand/forecast', params);
    return data;
  });
}

async function analyzeCropQuality(imageBuffer, mimeType = 'image/jpeg', cropName = '') {
  return withRetry(async () => {
    const detectedMime = detectImageMimeFromBuffer(imageBuffer);
    const normalizedMime = detectedMime || mimeType;

    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: `crop.${extensionFromMime(normalizedMime)}`,
      contentType: normalizedMime,
    });
    if (cropName) {
      form.append('cropName', cropName);
    }

    const { data } = await client.post('/api/quality/analyze', form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,
    });
    return data;
  });
}

async function checkHealth() {
  try {
    const { data } = await client.get('/health', { timeout: 3000 });
    return { available: true, ...data };
  } catch {
    return { available: false, status: 'unreachable' };
  }
}

function middleware(req, _res, next) {
  req.ml = {
    predictPrice,
    predictPriceBatch,
    forecastDemand,
    analyzeCropQuality,
    checkHealth,
  };
  next();
}

function fallbackPriceEstimate(cropName) {
  const CROP_DEFAULTS = {
    Tomato: 25,
    Potato: 18,
    Onion: 22,
    Wheat: 20,
    Rice: 35,
    Maize: 15,
    Banana: 30,
    Mango: 80,
    Cotton: 60,
    Soybean: 45,
  };
  const base = CROP_DEFAULTS[cropName] || 30;
  return {
    success: true,
    predicted_price_per_kg: base,
    price_range: { low: base * 0.85, high: base * 1.15 },
    confidence: 'low',
    model_version: 'fallback-heuristic',
    _fallback: true,
  };
}

module.exports = {
  predictPrice,
  predictPriceBatch,
  forecastDemand,
  analyzeCropQuality,
  checkHealth,
  middleware,
  fallbackPriceEstimate,
};
