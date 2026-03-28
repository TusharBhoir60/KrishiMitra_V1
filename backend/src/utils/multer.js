import multer from "multer"
import { ApiError } from "./ApiError.js"

const storage = multer.memoryStorage()

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new ApiError(400, "Only JPEG, PNG, and WEBP images are allowed"), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 3,
  },
})

// Catches multer-specific errors (file size, file type)
// and converts them into ApiError format
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(new ApiError(400, "File too large. Maximum size is 10MB"))
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return next(new ApiError(400, "Max 3 images allowed."))
    }
    return next(new ApiError(400, err.message))
  }
  if (err instanceof ApiError) {
    return next(err)
  }
  next(err)
}

export { upload, handleMulterError }