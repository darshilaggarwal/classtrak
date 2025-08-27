const express = require('express');
const router = express.Router();
const { studentAuth, teacherAuth, adminAuth } = require('../controllers/authController');
const { studentValidation, teacherValidation } = require('../middleware/validation');
const { otpLimiter, loginLimiter } = require('../middleware/rateLimiter');

// Student Authentication Routes
router.post(
  '/student/initiate-login',
  otpLimiter,
  studentValidation.initiateLogin,
  studentAuth.initiateLogin
);

router.post(
  '/student/verify-otp',
  studentValidation.verifyOTP,
  studentAuth.verifyOTP
);

router.post(
  '/student/login',
  loginLimiter,
  studentValidation.loginWithPassword,
  studentAuth.loginWithPassword
);

router.post(
  '/student/request-password-reset',
  otpLimiter,
  studentValidation.requestPasswordReset,
  studentAuth.requestPasswordReset
);

router.post(
  '/student/reset-password',
  studentValidation.resetPassword,
  studentAuth.resetPassword
);

// Teacher Authentication Routes
// Teacher signup with @imaginxp.com email
router.post(
  '/teacher/initiate-signup',
  otpLimiter,
  teacherValidation.initiateSignup,
  teacherAuth.initiateSignup
);

router.post(
  '/teacher/verify-signup-otp',
  teacherValidation.verifySignupOTP,
  teacherAuth.verifySignupOTP
);

router.post(
  '/teacher/initiate-login',
  otpLimiter,
  teacherValidation.initiateLogin,
  teacherAuth.initiateLogin
);

router.post(
  '/teacher/verify-otp',
  teacherValidation.verifyOTP,
  teacherAuth.verifyOTP
);

router.post(
  '/teacher/login',
  loginLimiter,
  teacherValidation.loginWithPassword,
  teacherAuth.loginWithPassword
);

router.post(
  '/teacher/request-password-reset',
  otpLimiter,
  teacherValidation.requestPasswordReset,
  teacherAuth.requestPasswordReset
);

router.post(
  '/teacher/reset-password',
  teacherValidation.resetPassword,
  teacherAuth.resetPassword
);

// Teacher username/password login for testing
router.post(
  '/teacher/login-username',
  loginLimiter,
  teacherAuth.loginWithUsername
);

// Admin Routes
router.post('/admin/request-otp', adminAuth.requestOTP);
router.post('/admin/login', adminAuth.login);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
