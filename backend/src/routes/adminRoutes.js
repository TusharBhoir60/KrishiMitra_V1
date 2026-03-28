import { Router } from 'express';
import {
  getPlatformStats,
  getDisputes,
  resolveDispute,
  getUsers,
  verifyUser,
} from '../controllers/adminController.js';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { roleCheck } from '../middlewares/roleCheck.js';

const router = Router();

// All admin routes require authentication + admin role
router.use(verifyToken, roleCheck('admin'));

router.get('/stats', getPlatformStats);
router.get('/disputes', getDisputes);
router.patch('/disputes/:id/resolve', resolveDispute);
router.get('/users', getUsers);
router.patch('/users/:id/verify', verifyUser);

export default router;
