
require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");

const createAdmin = async () => {
  const { MONGODB_URI, ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } =
    process.env;

  if (!MONGODB_URI || !ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error("Missing required admin setup environment variables");
  }

  if (ADMIN_PASSWORD.length < 8 || Buffer.byteLength(ADMIN_PASSWORD, "utf8") > 72) {
    throw new Error("Admin password must be 8–72 bytes long");
  }

  await mongoose.connect(MONGODB_URI);

  const email = ADMIN_EMAIL.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await User.create({
    name: ADMIN_NAME.trim(),
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log("Admin account created successfully");
};

createAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
