const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { cookieName } = require("../config/authCookies");

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
      issuer: "ultrakey-invoice-api",
      audience: "ultrakey-invoice-app",
    });

    const user = await User.findOne({
      _id: decoded.sub,
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or inactive user",
      });
    }

    req.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired authentication token",
      });
    }

    next(error);
  }
};

module.exports = authenticate;