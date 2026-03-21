const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized — please login first",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied — role '${req.user.role}' is not allowed. Required: ${roles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = authorize;