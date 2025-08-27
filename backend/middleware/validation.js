const { body } = require('express-validator');

// Student validation rules
const studentValidation = {
  initiateLogin: [
    body('rno')
      .notEmpty()
      .withMessage('Roll number is required')
      .isLength({ min: 1, max: 20 })
      .withMessage('Roll number must be between 1-20 characters')
      .trim()
  ],

  verifyOTP: [
    body('rno')
      .notEmpty()
      .withMessage('Roll number is required')
      .trim(),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ],

  loginWithPassword: [
    body('rno')
      .notEmpty()
      .withMessage('Roll number is required')
      .trim(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  requestPasswordReset: [
    body('rno')
      .notEmpty()
      .withMessage('Roll number is required')
      .trim()
  ],

  resetPassword: [
    body('rno')
      .notEmpty()
      .withMessage('Roll number is required')
      .trim(),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ]
};

// Teacher validation rules
const teacherValidation = {
  // Teacher signup validation
  initiateSignup: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .custom((value) => {
        if (!value.toLowerCase().endsWith('@imaginxp.com')) {
          throw new Error('Please use your official @imaginxp.com email address');
        }
        return true;
      })
      .normalizeEmail()
  ],

  verifySignupOTP: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .custom((value) => {
        if (!value.toLowerCase().endsWith('@imaginxp.com')) {
          throw new Error('Please use your official @imaginxp.com email address');
        }
        return true;
      })
      .normalizeEmail(),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ],

  initiateLogin: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],

  verifyOTP: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ],

  loginWithPassword: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ],

  requestPasswordReset: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail()
  ],

  resetPassword: [
    body('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('otp')
      .notEmpty()
      .withMessage('OTP is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
      .matches(/^(?=.*[a-zA-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one letter and one number')
  ]
};

// Attendance validation rules
const attendanceValidation = {
  markAttendance: [
    body('date')
      .notEmpty()
      .withMessage('Date is required')
      .isISO8601()
      .withMessage('Please provide a valid date in ISO format')
      .toDate(),
    body('subject')
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject must be between 1-100 characters')
      .trim(),
    body('batch')
      .notEmpty()
      .withMessage('Batch is required')
      .isMongoId()
      .withMessage('Please provide a valid batch ID'),
    body('classTime')
      .notEmpty()
      .withMessage('Class time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage('Please provide a valid time in HH:MM format'),
    body('duration')
      .optional()
      .isInt({ min: 30, max: 180 })
      .withMessage('Duration must be between 30 and 180 minutes'),
    body('records')
      .isArray({ min: 1 })
      .withMessage('At least one attendance record is required'),
    body('records.*.rollNumber')
      .notEmpty()
      .withMessage('Roll number is required for each record')
      .trim(),
    body('records.*.studentId')
      .notEmpty()
      .withMessage('Student ID is required for each record')
      .isMongoId()
      .withMessage('Please provide a valid student ID'),
    body('records.*.status')
      .notEmpty()
      .withMessage('Status is required for each record')
      .isIn(['present', 'absent'])
      .withMessage('Status must be either "present" or "absent"')
  ],

  getAttendance: [
    body('date')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid date in ISO format')
      .toDate(),
    body('subject')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Subject must be between 1-100 characters')
      .trim(),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid start date in ISO format')
      .toDate(),
    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('Please provide a valid end date in ISO format')
      .toDate()
  ]
};

module.exports = {
  studentValidation,
  teacherValidation,
  attendanceValidation
};
