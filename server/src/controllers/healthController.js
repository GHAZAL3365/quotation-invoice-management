const mongoose = require("mongoose");

const getHealth = (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;

  return res.status(200).json({
    success: true,
    status: "ok",
    database: databaseConnected ? "connected" : "in-memory-mock",
    message: databaseConnected
      ? "API and database are healthy"
      : "API is healthy (running with in-memory store)",
    timestamp: new Date().toISOString(),
  });
};

module.exports = { getHealth };