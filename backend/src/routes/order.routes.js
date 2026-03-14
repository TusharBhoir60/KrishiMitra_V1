import { Router } from 'express'

import {
  getIncomingOrders,
  getOrderById,
  updateOrderStatus,
  placeOrder,
  getMyOrders,
  schedulePickup,
  verifyOTPAndPickup,
  dispatchOrder,
  confirmHandoff,
  markDelivered,
  confirmReceived,
  raiseDispute,
} from '../controllers/ordercontroller.js'

import { verifyToken } from '../middlewares/authMiddleware.js'
import { roleCheck } from '../middlewares/roleCheck.js'
import { upload, handleMulterError } from '../utils/multer.js'

const router = Router()

// BUYER ROUTES
router.post('/', verifyToken, roleCheck('buyer'), placeOrder)
router.get('/my', verifyToken, roleCheck('buyer'), getMyOrders)

// FARMER ROUTES (fixed paths before /:id)
router.get('/incoming', verifyToken, roleCheck('farmer'), getIncomingOrders)

// SHARED: get single order (buyer / farmer / transporter)
router.get('/:id', verifyToken, getOrderById)
router.patch('/:id/status', verifyToken, roleCheck('farmer'), updateOrderStatus)
router.patch('/:id/schedule-pickup', verifyToken, roleCheck('farmer'), schedulePickup)
router.patch('/:id/dispatch', verifyToken, roleCheck('farmer'), dispatchOrder)
router.patch('/:id/confirm-handoff', verifyToken, roleCheck('farmer'), confirmHandoff)

// TRANSPORTER ROUTES
router.patch('/:id/verify-otp', verifyToken, roleCheck('transporter'), verifyOTPAndPickup)
router.patch('/:id/mark-delivered', verifyToken, roleCheck('transporter'), markDelivered)

// BUYER CONFIRM + DISPUTE
router.patch('/:id/confirm-received', verifyToken, roleCheck('buyer'), confirmReceived)
router.post(
  '/:id/dispute',
  verifyToken,
  upload.array('evidence', 3),
  handleMulterError,
  raiseDispute
)

export default router