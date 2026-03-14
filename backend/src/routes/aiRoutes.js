import { Router } from 'express'
import { getMarketTrends, getPricePrediction } from '../controllers/aiController.js'
import { verifyToken } from '../middlewares/authMiddleware.js'

const router = Router()

router.get('/price-prediction', verifyToken, getPricePrediction)
router.get('/market-trends', verifyToken, getMarketTrends)

export default router
