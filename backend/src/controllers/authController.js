import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"
import Transporter from "../models/Transporter.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ─── Token generators (inline, no separate file needed) ───────────────────────

const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN,
  })
}

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
  })
}

// ─── Cookie config (only for accessToken) ─────────────────────────────────────

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000, // 15 minutes
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const sanitizeUser = (user) => {
  const obj = user.toObject()
  delete obj.password
  delete obj.refreshToken  // never expose refresh token in response
  return obj
}

// ─── Controllers ──────────────────────────────────────────────────────────────

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone, location, businessName, businessType, deliveryAddress, farmSize, farmingType, zones } = req.body

  const existing = await User.findOne({ email })
  if (existing) {
    throw new ApiError(409, "Email already registered")
  }

  const user = await User.create({ name, email, password, role, phone, location, businessName, businessType, deliveryAddress, farmSize, farmingType })

  // Item 5: Create Transporter profile if registering as transporter
  if (role === 'transporter') {
    if (!businessName || !phone) {
      throw new ApiError(400, 'Transporter registration requires businessName and phone')
    }

    await Transporter.create({
      user: user._id,
      companyName: businessName,
      phone,
      zones: Array.isArray(zones) ? zones : [],
      isAvailable: true,
      isActive: true,
    })
  }

  return res
    .status(201)
    .json(new ApiResponse(201, sanitizeUser(user), "Registered successfully"))
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email })
  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new ApiError(401, "Invalid credentials")
  }

  const payload = { id: user._id, role: user.role }

  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  // Save refresh token to DB
  user.refreshToken = refreshToken
  await user.save({ validateBeforeSave: false })

  // Only accessToken goes in cookie
  res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTIONS)

  return res.status(200).json(
    new ApiResponse(200, {
      user: sanitizeUser(user),
      accessToken,       // also sent in body for mobile clients
      refreshToken,      // sent in body so client can store it securely
    }, "Logged in successfully")
  )
})

export const logout = asyncHandler(async (req, res) => {
  // Clear refresh token from DB
  await User.findByIdAndUpdate(
    req.user._id,
    { $set: { refreshToken: null } },
    { new: true }
  )

  res.clearCookie("accessToken", ACCESS_COOKIE_OPTIONS)

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"))
})

export const refreshAccessToken = asyncHandler(async (req, res) => {
  // Client sends refresh token in request body
  const incomingRefreshToken = req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token required")
  }

  // Verify the refresh token
  let decoded
  try {
    decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token")
  }

  // Find user and check if refresh token matches DB
  const user = await User.findById(decoded.id)
  if (!user) {
    throw new ApiError(401, "User not found")
  }

  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Refresh token mismatch — please login again")
  }

  // Issue new tokens (token rotation)
  const payload = { id: user._id, role: user.role }
  const newAccessToken = generateAccessToken(payload)
  const newRefreshToken = generateRefreshToken(payload)

  // Save new refresh token to DB (rotation)
  user.refreshToken = newRefreshToken
  await user.save({ validateBeforeSave: false })

  res.cookie("accessToken", newAccessToken, ACCESS_COOKIE_OPTIONS)

  return res.status(200).json(
    new ApiResponse(200, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, "Access token refreshed")
  )
})

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken")

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Current user fetched"))
})

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const { name, phone, location, farmSize, farmingType, businessName, businessType, deliveryAddress } = req.body

  if (name             !== undefined) user.name            = name
  if (phone            !== undefined) user.phone           = phone
  if (location         !== undefined) user.location        = { ...user.location?.toObject?.() || user.location || {}, ...location }
  if (farmSize         !== undefined) user.farmSize        = Number(farmSize)
  if (farmingType      !== undefined) user.farmingType     = farmingType
  if (businessName     !== undefined) user.businessName    = businessName
  if (businessType     !== undefined) user.businessType    = businessType
  if (deliveryAddress  !== undefined) user.deliveryAddress = deliveryAddress

  await user.save({ validateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(200, sanitizeUser(user), "Profile updated successfully"))
})