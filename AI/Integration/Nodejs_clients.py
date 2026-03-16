/**
 * AgriConnect ML Client — Node.js Integration
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

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_TIMEOUT_MS  = parseInt(process.env.ML_TIMEOUT_MS || '10000', 10);
const ML_RETRIES     = parseInt(process.env.ML_RETRIES   || '2',     10);

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: ML_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Retry Utility
// ─────────────────────────────────────────────────────────────────────────────

async function withRetry(fn, retries = ML_RETRIES, delayMs = 500) {
  let lastError;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable = !err.response || err.response.status >= 500;
      if (attempt <= retries && isRetryable) {
        console.warn(`[MLClient] Attempt ${attempt} failed — retrying in ${delayMs}ms...`);
        await new Promise(r => setTimeout(r, delayMs * attempt));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 1 — Price Prediction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Predict recommended price per kg for a crop listing.
 *
 * @param {Object} params
 * @param {string} params.cropName            - e.g. "Tomato"
 * @param {string} params.state               - e.g. "Maharashtra"
 * @param {string} params.district            - e.g. "Pune"
 * @param {number} params.quantity            - Quantity in kg
 * @param {number} params.month               - 1–12
 * @param {string} params.season              - "Kharif" | "Rabi" | "Zaid" | "Winter" | "Summer"
 * @param {number} [params.historicalAvgPrice]- Optional known historical price
 *
 * @returns {Promise<{
 *   predicted_price_per_kg: number,
 *   price_range: { low: number, high: number },
 *   confidence: string,
 *   model_version: string
 * }>}
 */
async function predictPrice(params) {
  return withRetry(async () => {
    const { data } = await client.post('/api/price/predict', params);
    return data;
  });
}

/**
 * Batch price predictions (up to 50 items).
 * @param {Array<Object>} items - Array of price prediction params
 */
async function predictPriceBatch(items) {
  return withRetry(async () => {
    const { data } = await client.post('/api/price/batch', { items });
    return data;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 — Demand Forecasting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Forecast demand for a crop over upcoming weeks.
 *
 * @param {Object} params
 * @param {string}   params.cropName                  - Crop name
 * @param {string}   params.state                     - State
 * @param {number}   params.month                     - Starting month (1–12)
 * @param {string}   params.season                    - Season
 * @param {number[]} [params.historicalDemandScores]  - Last N weeks of demand (0–1)
 * @param {number[]} [params.historicalPrices]        - Last N weeks of avg price
 * @param {number}   [params.forecastWeeks=1]         - Weeks ahead to forecast (1–8)
 *
 * @returns {Promise<{
 *   forecasts: Array<{ week: number, demand_score: number, demand_label: string }>,
 *   recommendation: string
 * }>}
 */
async function forecastDemand(params) {
  return withRetry(async () => {
    const { data } = await client.post('/api/demand/forecast', params);
    return data;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase 3 — Crop Quality Analysis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Analyze crop quality from an image buffer.
 *
 * @param {Buffer} imageBuffer    - Raw image bytes (from Cloudinary download or multer)
 * @param {string} mimeType       - "image/jpeg" | "image/png" | "image/webp"
 * @param {string} [cropName]     - Optional crop name for context
 *
 * @returns {Promise<{
 *   grade: string,
 *   grade_confidence: number,
 *   freshness: string,
 *   freshness_confidence: number,
 *   marketability: string,
 *   recommendations: string[]
 * }>}
 */
async function analyzeCropQuality(imageBuffer, mimeType = 'image/jpeg', cropName = '') {
  return withRetry(async () => {
    const form = new FormData();
    form.append('file', imageBuffer, {
      filename: `crop.${mimeType.split('/')[1]}`,
      contentType: mimeType,
    });
    if (cropName) {
      form.append('cropName', cropName);
    }

    const { data } = await client.post('/api/quality/analyze', form, {
      headers: { ...form.getHeaders() },
      timeout: 30000,   // Image inference takes longer
    });
    return data;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the ML service is reachable and healthy.
 * Use this in your app startup or health middleware.
 */
async function checkHealth() {
  try {
    const { data } = await client.get('/health', { timeout: 3000 });
    return { available: true, ...data };
  } catch {
    return { available: false, status: 'unreachable' };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Express Middleware — Attach ML client to req object
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mount this middleware BEFORE your routes:
 *   app.use(mlClient.middleware);
 *
 * Then use in any route handler:
 *   const price = await req.ml.predictPrice({ ... });
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// Graceful Fallbacks (for hackathon demo when ML service is down)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fallback price estimator using simple heuristics.
 * Used when ML service is unavailable.
 */
function fallbackPriceEstimate(cropName) {
  const CROP_DEFAULTS = {
    Tomato: 25, Potato: 18, Onion: 22, Wheat: 20, Rice: 35,
    Maize: 15, Banana: 30, Mango: 80, Cotton: 60, Soybean: 45,
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