
const mongoose = require("mongoose");

const connectDB = async () => {
  mongoose.set("bufferCommands", false);
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn("[Database] MONGODB_URI not set — running with in-memory store");
    return;
  }

  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.warn("MongoDB connection failed — continuing with in-memory store:", error.message);
  }
};

module.exports = connectDB;