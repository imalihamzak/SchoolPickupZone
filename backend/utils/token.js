// utils/token.js
const jwt = require('jsonwebtoken');

exports.generateDeviceToken = (guardId) => {
  return jwt.sign(
    { guard_id: guardId, purpose: 'register_device' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

exports.verifyDeviceToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
