
const { timingSafeEqual } = require("node:crypto");

const requireCsrfToken = (req, res, next) => {
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.get("X-CSRF-Token");

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string"
  ) {
    return res.status(403).json({
      success: false,
      message: "CSRF validation failed",
    });
  }

  const cookieBuffer = Buffer.from(cookieToken);
  const headerBuffer = Buffer.from(headerToken);

  if (
    cookieBuffer.length !== headerBuffer.length ||
    !timingSafeEqual(cookieBuffer, headerBuffer)
  ) {
    return res.status(403).json({
      success: false,
      message: "CSRF validation failed",
    });
  }

  next();
};

module.exports = requireCsrfToken;
