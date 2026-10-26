const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0];

    return res.status(409).json({
      success: false,
      message:
        field === "email"
          ? "A client with this email already exists"
          : "A record with this value already exists",
      errors: [
        {
          field: field || "unknown",
          message: "This value must be unique",
        },
      ],
    });
  }

  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode >= 500
        ? "Internal server error"
        : err.message || "Request failed",
  });
};

module.exports = errorHandler;