import { Router } from 'express';
import { getMyJobs, getMyJobById, getAvailableJobs, acceptJob } from '../controllers/transporterController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { roleCheck } from '../middlewares/roleCheck.js';

const router = Router();

router.get('/available-jobs', verifyToken, roleCheck('transporter'), getAvailableJobs);
router.patch('/jobs/:orderId/accept', verifyToken, roleCheck('transporter'), acceptJob);
router.get('/my-jobs', verifyToken, roleCheck('transporter'), getMyJobs);
router.get('/my-jobs/:orderId', verifyToken, roleCheck('transporter'), getMyJobById);

export default router;

