const jwt = require("jsonwebtoken");
const User = require("../models/User");

const optionalProtect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      next();
      return;
    }

    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.warn("Optional auth skipped:", error.message);
  }

  next();
};

module.exports = optionalProtect;
