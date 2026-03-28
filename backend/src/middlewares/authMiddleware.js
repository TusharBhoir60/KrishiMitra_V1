import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyToken = asyncHandler(async (req, res, next) => {

    const bearerToken = req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null;
    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
        throw new ApiError(401, "Unauthorized: No token provided");
    }

    try {
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        req.user = {
            _id: decodedToken?.id,
            role: decodedToken?.role
        };

        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const authorizeRoles = (...roles) => (req, res, next) => {
    if (!req.user?.role) {
        return next(new ApiError(401, "Unauthorized"));
    }

    if (!roles.includes(req.user.role)) {
        return next(new ApiError(403, "Forbidden: Insufficient permissions"));
    }

    return next();
};