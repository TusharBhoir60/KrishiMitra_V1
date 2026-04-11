import { Router } from 'express'

import {
  createListing,
  getAllListings,
  getMyListings,
  getSingleListing,
  updateListing,
  deleteListing,
} from '../controllers/listingController.js'

import { upload, handleMulterError } from '../utils/multer.js'
import { verifyToken } from '../middlewares/authMiddleware.js'
import { roleCheck } from '../middlewares/roleCheck.js'

const router = Router()

// PUBLIC ROUTES
router.get('/', getAllListings)

// /my MUST be before /:id — otherwise Express treats "my" as an ObjectId
router.get('/my', verifyToken, roleCheck('farmer'), getMyListings)

// /:id must come after all fixed-path GET routes
router.get('/:id', getSingleListing)

// FARMER-ONLY ROUTES
router.post(
  '/',
  verifyToken,
  roleCheck('farmer'),
  upload.array('images', 3),
  handleMulterError,
  createListing
)

router.put(
  '/:id',
  verifyToken,
  roleCheck('farmer'),
  upload.array('images', 3),
  handleMulterError,
  updateListing
)

router.delete(
  '/:id',
  verifyToken,
  roleCheck('farmer'),
  deleteListing
)

export default router