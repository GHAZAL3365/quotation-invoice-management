
const authService = require("../services/authService");
const {
  cookieName,
  cookieOptions,
  getTokenMaxAge,
} = require("../config/authCookies");
const { randomBytes } = require("node:crypto");

const setAuthCookies = (res, token) => {
  res.cookie(cookieName, token, {
    ...cookieOptions,
    maxAge: getTokenMaxAge(),
  });

  const csrfToken = randomBytes(32).toString("hex");

  res.cookie("csrfToken", csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return csrfToken;
};

const register = async (req, res, next) => {
  try {
    const result = await authService.registerUser(req.body);
    const csrfToken = setAuthCookies(res, result.token);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      data: {
        user: result.user,
        csrfToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    const csrfToken = setAuthCookies(res, result.token);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        user: result.user,
        csrfToken,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = (req, res) => {
  res.clearCookie(cookieName, cookieOptions);

  res.clearCookie("csrfToken", {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "User retrieved successfully",
    data: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
};
