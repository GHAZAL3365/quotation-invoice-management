require("dotenv").config();
require("./config/validateEnv");
const mongoose = require("mongoose");

// Ensure all models are loaded
require("./models/User");
require("./models/Client");
require("./models/Quotation");
require("./models/Invoice");
require("./models/Payment");
require("./models/Counter");
require("./models/QuotationCounter");

const { initializeInMemoryFallbacks } = require("./config/inMemoryDb");
initializeInMemoryFallbacks();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 3365;
const HOST = process.env.HOST || "localhost";

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, HOST, () => {
    console.log(`Server running on http://${HOST}:${PORT}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          await mongoose.disconnect();
          console.log("MongoDB disconnected successfully");
        }
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

startServer();
