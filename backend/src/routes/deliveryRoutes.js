import { Router } from 'express';
import { getDeliveryEstimate, getDeliveryZones } from '../controllers/deliveryController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/estimate', verifyToken, getDeliveryEstimate);
router.get('/zones', getDeliveryZones);

export default router;

