const config = require('../config');

const generateOTP = () => {
  const length = config.otp.length;
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
};

const getOTPExpirationTime = () => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + config.otp.expiresInMinutes * 60000);
  return expiresAt;
};

module.exports = {
  generateOTP,
  getOTPExpirationTime
};
