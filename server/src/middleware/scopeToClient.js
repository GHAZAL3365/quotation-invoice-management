const Client = require("../models/Client");

const scopeToClient = async (req, res, next) => {
  if (req.user.role !== "client") {
    return next();
  }

  try {
    const client = await Client.findOne({
      email: req.user.email,
      isDeleted: { $ne: true },
    }).select("_id");

    if (!client) {
      return res.status(403).json({
        success: false,
        message: "No client record is linked to this account.",
      });
    }

    req.clientId = client._id;
    return next();
  } catch (error) {
    return next(error);
  }
};

module.exports = scopeToClient;
