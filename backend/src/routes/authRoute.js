import { Router } from "express"
import {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  refreshAccessToken,
} from "../controllers/authController.js"
import { verifyToken } from "../middlewares/authMiddleware.js"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", verifyToken, logout)
router.post("/refresh-token", refreshAccessToken)
router.get("/me", verifyToken, getMe)
router.patch("/me", verifyToken, updateProfile)

export default router