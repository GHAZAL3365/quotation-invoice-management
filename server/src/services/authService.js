
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { role: user.role },
    process.env.JWT_SECRET,
    {
      subject: user._id.toString(),
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
      issuer: "ultrakey-invoice-api",
      audience: "ultrakey-invoice-app",
       algorithm: "HS256"
    }
  );
};

const getSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    const error = new Error("Email is already registered");
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "client",
  });

  return {
    user: getSafeUser(user),
    token: createToken(user),
  };
};

const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordMatches) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  return {
    user: getSafeUser(user),
    token: createToken(user),
  };
};

module.exports = {
  registerUser,
  loginUser,
};
