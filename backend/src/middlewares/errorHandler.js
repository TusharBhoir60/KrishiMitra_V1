import { ApiError } from '../utils/ApiError.js'

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err)

  console.error('ERROR:', err?.stack || err)

  if (err?.name === 'ValidationError') {
    const errors = Object.values(err.errors || {}).map((e) => e.message)
    return res.status(400).json({ success: false, message: 'Validation failed', errors })
  }

  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    return res.status(409).json({ success: false, message: `${field} already registered` })
  }

  if (err?.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }

  if (err?.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expired, please login again' })
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ success: false, message: err.message, errors: err.errors || [] })
  }

  return res.status(err?.statusCode || 500).json({
    success: false,
    message: err?.message || 'Internal server error',
  })
}
