import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const verifyToken = asyncHandler(async (req, res, forward) => {

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

        return req.user;

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

export const authorizeRoles = (...roles) => (req, res, forward) => {
    if (!req.user?.role) {
        if (typeof forward === 'function') {
            return forward(new ApiError(401, "Unauthorized"));
        }

        throw new ApiError(401, "Unauthorized");
    }

    if (!roles.includes(req.user.role)) {
        if (typeof forward === 'function') {
            return forward(new ApiError(403, "Forbidden: Insufficient permissions"));
        }

        throw new ApiError(403, "Forbidden: Insufficient permissions");
    }

    if (typeof forward === 'function') {
        return forward();
    }

    return undefined;
};