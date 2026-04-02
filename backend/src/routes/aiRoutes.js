import { Router } from 'express'
import multer from 'multer'
import { getMarketTrends, getPricePrediction, predictPrice, predictDemand, analyzeQuality, recommendCrop, predictPriceRange, getListingInsights } from '../controllers/aiController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const isLikelyImage = file.mimetype?.startsWith('image/') || file.mimetype === 'application/octet-stream'
    if (isLikelyImage) {
      cb(null, true)
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`))
    }
  }
})

router.get('/price-prediction', verifyToken, getPricePrediction)
router.post('/price', verifyToken, predictPrice)
router.post('/demand', verifyToken, predictDemand)
router.post('/quality', verifyToken, upload.single('file'), analyzeQuality)
router.post('/recommend-crop', verifyToken, recommendCrop)
router.post('/predict-price-range', verifyToken, predictPriceRange)
router.post('/listing-insights', verifyToken, getListingInsights)
router.get('/market-trends', verifyToken, getMarketTrends)

export default router
