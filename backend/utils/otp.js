const crypto = require('crypto');

const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

const generateOTPExpiry = () => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 5;
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
};

const isOTPExpired = (otpExpiry) => {
  return new Date() > otpExpiry;
};

module.exports = {
  generateOTP,
  generateOTPExpiry,
  isOTPExpired
};
