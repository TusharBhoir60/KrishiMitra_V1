import { Router } from 'express'
import axios from 'axios'
import FormData from 'form-data'
import multer from 'multer'
import { verifyToken } from '../middlewares/authMiddleware.js'
import {
  getPriceSuggestion,
  getDemandForecast,
  getCropRecommendation,
  getPriceRangePrediction,
} from '../services/mlService.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000'
const ML_TIMEOUT_QUALITY = Number.parseInt(process.env.ML_TIMEOUT_QUALITY || '28000', 10)
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])

const fallbackResponse = { success: false, data: null, fallback: true }

const toSnakeCase = (value) =>
  value.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`)

const camelToSnakeDeep = (input) => {
  if (Array.isArray(input)) {
    return input.map(camelToSnakeDeep)
  }

  if (input && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[toSnakeCase(key)] = camelToSnakeDeep(value)
      return acc
    }, {})
  }

  return input
}

router.use(verifyToken)

router.post('/price', async (req, res) => {
  try {
    const payload = camelToSnakeDeep(req.body || {})
    const result = await getPriceSuggestion(payload)

    if (!result.success) {
      return res.status(200).json(fallbackResponse)
    }

    return res.status(200).json({ success: true, data: result.data })
  } catch {
    return res.status(200).json(fallbackResponse)
  }
})

router.post('/demand', async (req, res) => {
  try {
    const result = await getDemandForecast(req.body || {})

    if (!result.success) {
      return res.status(200).json(fallbackResponse)
    }

    return res.status(200).json({ success: true, data: result.data })
  } catch {
    return res.status(200).json(fallbackResponse)
  }
})

router.post('/recommend-crop', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) }

    if (Object.prototype.hasOwnProperty.call(payload, 'soilType')) {
      payload.soil_type = payload.soilType
      delete payload.soilType
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'topK')) {
      payload.top_k = payload.topK
      delete payload.topK
    }

    const result = await getCropRecommendation(payload)

    if (!result.success) {
      return res.status(200).json(fallbackResponse)
    }

    const recommendations =
      result.data?.recommendations ||
      result.data?.data?.recommendations ||
      result.data?.results ||
      []

    const topRecommendation =
      result.data?.topRecommendation ||
      result.data?.top_recommendation ||
      recommendations[0] ||
      null

    return res.status(200).json({
      success: true,
      topRecommendation,
      recommendations,
    })
  } catch {
    return res.status(200).json(fallbackResponse)
  }
})

router.post('/predict-price-range', async (req, res) => {
  try {
    const payload = { ...(req.body || {}) }

    if (Object.prototype.hasOwnProperty.call(payload, 'cropType')) {
      payload.crop_type = payload.cropType
      delete payload.cropType
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'historicalAvgPrice')) {
      payload.historical_avg_price = payload.historicalAvgPrice
      delete payload.historicalAvgPrice
    }

    const result = await getPriceRangePrediction(payload)

    if (!result.success) {
      return res.status(200).json(fallbackResponse)
    }

    return res.status(200).json({ success: true, data: result.data })
  } catch {
    return res.status(200).json(fallbackResponse)
  }
})

router.post('/listing-insights', async (req, res) => {
  const payload = req.body || {}

  const [priceResult, demandResult, recommendationResult] = await Promise.allSettled([
    getPriceSuggestion(payload),
    getDemandForecast(payload),
    getCropRecommendation(payload),
  ])

  const price = priceResult.status === 'fulfilled' ? priceResult.value.data : null
  const demand = demandResult.status === 'fulfilled' ? demandResult.value.data : null
  const recommendation =
    recommendationResult.status === 'fulfilled' ? recommendationResult.value.data : null

  return res.status(200).json({
    success: true,
    insights: { price, demand, recommendation },
  })
})

router.post('/quality', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, reason: 'invalid_file_type' })
    }

    if (!ALLOWED_IMAGE_MIME.has(req.file.mimetype)) {
      return res.status(400).json({ success: false, data: null, reason: 'invalid_file_type' })
    }

    const form = new FormData()
    form.append('file', req.file.buffer, {
      filename: req.file.originalname || 'crop-image.jpg',
      contentType: req.file.mimetype,
    })

    if (req.body?.cropName) {
      form.append('cropName', req.body.cropName)
    }

    const response = await axios.post(`${ML_SERVICE_URL}/api/quality/analyze`, form, {
      headers: form.getHeaders(),
      timeout: ML_TIMEOUT_QUALITY,
    })

    return res.status(200).json({ success: true, data: response.data })
  } catch (error) {
    if (error?.response?.status === 503) {
      return res.status(503).json({ success: false, data: null, reason: 'model_unavailable' })
    }

    return res.status(500).json({ success: false, data: null, reason: 'inference_error' })
  }
})

export default router