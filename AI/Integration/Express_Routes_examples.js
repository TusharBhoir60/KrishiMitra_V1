/**
 * AgriConnect Express Routes - ML Integration Examples
 * =====================================================
 * Paste these routes into your existing Express app to connect
 * the Node.js backend to the Python ML microservice.
 *
 * Prerequisites:
 *   npm install axios form-data
 *
 * In your app.js / server.js:
 *   const mlRoutes = require('./integration/express_routes_example');
 *   app.use('/api/ml', mlRoutes);
 */

const express = require('express');
const multer = require('multer');
const mlClient = require('./Nodejs_clients');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// GET /api/ml/health
// Check if ML service is reachable
router.get('/health', async (req, res) => {
  const health = await mlClient.checkHealth();
  res.status(health.available ? 200 : 503).json(health);
});

// POST /api/ml/price
// Predict price for a new crop listing - call this when farmer creates listing
router.post('/price', async (req, res) => {
  try {
    const { cropName, state, district, quantity, month, season, historicalAvgPrice } = req.body;

    if (!cropName || !state || !district || !quantity || !month || !season) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: cropName, state, district, quantity, month, season',
      });
    }

    const result = await mlClient.predictPrice({
      cropName,
      state,
      district,
      quantity: Number(quantity),
      month: Number(month),
      season,
      historicalAvgPrice: historicalAvgPrice ? Number(historicalAvgPrice) : undefined,
    });

    return res.json(result);
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
      console.warn('[ML] Service unavailable - using fallback heuristic');
      return res.json(mlClient.fallbackPriceEstimate(req.body.cropName));
    }
    console.error('[ML] Price prediction error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ml/demand
// Forecast demand - useful for buyers and farmers planning harvest
router.post('/demand', async (req, res) => {
  try {
    const {
      cropName,
      state,
      month,
      season,
      historicalDemandScores,
      historicalPrices,
      forecastWeeks,
    } = req.body;

    if (!cropName || !state || !month || !season) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const result = await mlClient.forecastDemand({
      cropName,
      state,
      month: Number(month),
      season,
      historicalDemandScores: historicalDemandScores || [],
      historicalPrices: historicalPrices || [],
      forecastWeeks: Number(forecastWeeks || 4),
    });

    return res.json(result);
  } catch (err) {
    console.error('[ML] Demand forecast error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ml/quality
// Analyze crop quality from uploaded image (integrates with Cloudinary upload)
router.post('/quality', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Image file required' });
    }

    const { cropName } = req.body;
    const result = await mlClient.analyzeCropQuality(req.file.buffer, req.file.mimetype, cropName || '');

    return res.json(result);
  } catch (err) {
    console.error('[ML] Quality analysis error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/ml/listing-insights
// Composite endpoint - price + demand in one call for new crop listings
router.post('/listing-insights', async (req, res) => {
  try {
    const { cropName, state, district, quantity, month, season } = req.body;

    if (!cropName || !state || !district || !quantity || !month || !season) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const params = {
      cropName,
      state,
      district,
      quantity: Number(quantity),
      month: Number(month),
      season,
    };

    const [priceResult, demandResult] = await Promise.allSettled([
      mlClient.predictPrice(params),
      mlClient.forecastDemand({ ...params, forecastWeeks: 4 }),
    ]);

    return res.json({
      success: true,
      cropName,
      price: priceResult.status === 'fulfilled' ? priceResult.value : null,
      demand: demandResult.status === 'fulfilled' ? demandResult.value : null,
      errors: {
        price: priceResult.status === 'rejected' ? priceResult.reason?.message : null,
        demand: demandResult.status === 'rejected' ? demandResult.reason?.message : null,
      },
    });
  } catch (err) {
    console.error('[ML] Listing insights error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
