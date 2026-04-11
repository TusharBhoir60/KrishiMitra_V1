export const roleCheck = (...roles) => (req, res, next) => {
  if (!req.user?.role) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  if (!roles.includes(req.user.role)) {
    return res
      .status(403)
      .json({ success: false, message: 'Access denied: insufficient role' });
  }

  return next();
};

