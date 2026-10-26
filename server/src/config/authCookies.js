
const isProduction = process.env.NODE_ENV === "production";

const cookieName = isProduction
  ? "__Host-accessToken"
  : "accessToken";

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
};

const getTokenMaxAge = () => {
  const duration = process.env.JWT_EXPIRES_IN || "15m";
  const match = /^([1-9]\d*)([smhd])$/.exec(duration);

  if (!match) {
    throw new Error("Invalid JWT_EXPIRES_IN configuration");
  }

  const units = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return Number(match[1]) * units[match[2]];
};

module.exports = {
  cookieName,
  cookieOptions,
  getTokenMaxAge,
};
