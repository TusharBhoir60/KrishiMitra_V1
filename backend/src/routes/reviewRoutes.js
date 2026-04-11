import Router from 'express';
import { createReview, getReviewsByFarmer, updateReview, deleteReview } from '../controllers/reviewController.js';
import { verifyToken, authorizeRoles } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/', verifyToken, authorizeRoles('buyer'), createReview);
router.get('/farmer/:farmerId', getReviewsByFarmer);
router.patch('/:id', verifyToken, authorizeRoles('buyer'), updateReview);
router.delete('/:id', verifyToken, authorizeRoles('buyer'), deleteReview);

export default router;