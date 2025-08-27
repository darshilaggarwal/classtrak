const { validationResult } = require('express-validator');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin');
const { generateToken } = require('../utils/jwt');
const { generateOTP, generateOTPExpiry, isOTPExpired } = require('../utils/otp');
const { sendOTPEmail, sendPasswordResetEmail } = require('../utils/email');

// Student Authentication Controllers
const studentAuth = {
  // Initial login with roll number
  initiateLogin: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { rno } = req.body;

      // Find student by roll number
      const student = await Student.findOne({ rno: rno.trim() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found. Please check your roll number.'
        });
      }

      // Generate and save OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      student.otp = otp;
      student.otpExpiry = otpExpiry;
      await student.save();

      console.log(`\n🔐 OTP GENERATION:`);
      console.log(`📧 Student: ${student.name} (${student.rno})`);
      console.log(`📮 Email: ${student.email}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`⏰ Expires: ${otpExpiry.toLocaleString()}`);
      console.log(`🚀 Sending email...`);

      // Send OTP email
      await sendOTPEmail(student.email, otp, student.name, 'Student');
      
      console.log(`✅ OTP email sent successfully to ${student.email}`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your registered email address',
        data: {
          email: student.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
          isFirstLogin: student.isFirstLogin
        }
      });

    } catch (error) {
      console.error('Student initiate login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  },

  // Verify OTP and complete login
  verifyOTP: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { rno, otp, password } = req.body;

      const student = await Student.findOne({ rno: rno.trim() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      console.log(`\n🔍 OTP VERIFICATION:`);
      console.log(`📧 Student: ${student.name} (${student.rno})`);
      console.log(`🔑 Provided OTP: ${otp}`);
      console.log(`💾 Stored OTP: ${student.otp}`);
      console.log(`⏰ OTP Expiry: ${student.otpExpiry?.toLocaleString()}`);

      // Check if OTP exists and is valid
      if (!student.otp || student.otp !== otp) {
        console.log(`❌ OTP verification failed: Invalid OTP`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      // Check if OTP is expired
      if (isOTPExpired(student.otpExpiry)) {
        console.log(`❌ OTP verification failed: OTP expired`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      console.log(`✅ OTP verified successfully!`);

      // If first login, password is required
      if (student.isFirstLogin) {
        if (!password || password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password is required and must be at least 6 characters long'
          });
        }
        student.password = password;
        student.isFirstLogin = false;
      }

      // Clear OTP and mark email as verified
      student.otp = undefined;
      student.otpExpiry = undefined;
      student.emailVerified = true;
      await student.save();

      // Generate JWT token
      const token = generateToken({
        id: student._id,
        role: 'student',
        rno: student.rno
      });

      const isFirstTime = student.isFirstLogin;
      console.log(`🎉 ${isFirstTime ? 'Account Setup' : 'Login'} completed successfully!`);
      console.log(`👤 Student: ${student.name}`);
      console.log(`🎓 Roll No: ${student.rno}`);
      console.log(`🔑 JWT Token generated`);
      console.log(`📱 Redirecting to dashboard...`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: isFirstTime ? 'Account setup completed successfully' : 'Login successful',
        data: {
          token,
          user: {
            id: student._id,
            name: student.name,
            email: student.email,
            rno: student.rno,
            role: 'student'
          }
        }
      });

    } catch (error) {
      console.error('Student verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed. Please try again.'
      });
    }
  },

  // Login with password (for returning users)
  loginWithPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { rno, password } = req.body;

      const student = await Student.findOne({ rno: rno.trim() });
      if (!student) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if student has set up password
      if (!student.password || student.isFirstLogin) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your account setup first using OTP verification'
        });
      }

      // Verify password
      const isPasswordValid = await student.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: student._id,
        role: 'student',
        rno: student.rno
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: student._id,
            name: student.name,
            email: student.email,
            rno: student.rno,
            role: 'student'
          }
        }
      });

    } catch (error) {
      console.error('Student password login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  },

  // Password reset - request OTP
  requestPasswordReset: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { rno } = req.body;

      const student = await Student.findOne({ rno: rno.trim() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Generate and save OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      student.otp = otp;
      student.otpExpiry = otpExpiry;
      await student.save();

      // Send password reset email
      await sendPasswordResetEmail(student.email, otp, student.name, 'Student');

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to your email',
        data: {
          email: student.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }
      });

    } catch (error) {
      console.error('Student password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reset OTP. Please try again.'
      });
    }
  },

  // Password reset - verify OTP and set new password
  resetPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { rno, otp, newPassword } = req.body;

      const student = await Student.findOne({ rno: rno.trim() });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Verify OTP
      if (!student.otp || student.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      if (isOTPExpired(student.otpExpiry)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // Update password and clear OTP
      student.password = newPassword;
      student.otp = undefined;
      student.otpExpiry = undefined;
      await student.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Student password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed. Please try again.'
      });
    }
  }
};

// Teacher Authentication Controllers
const teacherAuth = {
  // Teacher signup with @imaginxp.com email
  initiateSignup: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      // Validate @imaginxp.com email
      if (!email.toLowerCase().endsWith('@imaginxp.com')) {
        return res.status(400).json({
          success: false,
          message: 'Please use your official @imaginxp.com email address'
        });
      }

      // Check if teacher exists in the imported data (from the JSON we imported)
      const importedTeacher = await Teacher.findOne({ 
        email: email.toLowerCase().trim(),
        isActive: true 
      });

      if (!importedTeacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found in our records. Please contact administrator to add your details.'
        });
      }

      // Check if teacher has already signed up (has password)
      if (importedTeacher.password && !importedTeacher.isFirstLogin) {
        return res.status(400).json({
          success: false,
          message: 'Teacher with this email already has an account. Please login instead.'
        });
      }

      // Generate and save OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      importedTeacher.otp = otp;
      importedTeacher.otpExpiry = otpExpiry;
      await importedTeacher.save();

      console.log(`\n🔐 TEACHER SIGNUP OTP GENERATION:`);
      console.log(`📧 Teacher: ${importedTeacher.name}`);
      console.log(`📮 Email: ${importedTeacher.email}`);
      console.log(`🔑 OTP: ${otp}`);
      console.log(`⏰ Expires: ${otpExpiry.toLocaleString()}`);
      console.log(`🚀 Sending email...`);

      // Send OTP email
      await sendOTPEmail(importedTeacher.email, otp, importedTeacher.name, 'Teacher');
      
      console.log(`✅ OTP email sent successfully to ${importedTeacher.email}`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: 'OTP sent to your @imaginxp.com email address',
        data: {
          email: importedTeacher.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Masked email
          isFirstLogin: importedTeacher.isFirstLogin
        }
      });

    } catch (error) {
      console.error('Teacher signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  },

  // Verify signup OTP and create account
  verifySignupOTP: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp, password } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      console.log(`\n🔍 TEACHER SIGNUP OTP VERIFICATION:`);
      console.log(`📧 Teacher: ${teacher.name}`);
      console.log(`🔑 Provided OTP: ${otp}`);
      console.log(`💾 Stored OTP: ${teacher.otp}`);
      console.log(`⏰ OTP Expiry: ${teacher.otpExpiry?.toLocaleString()}`);

      // Verify OTP
      if (!teacher.otp || teacher.otp !== otp) {
        console.log(`❌ OTP verification failed`);
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      if (isOTPExpired(teacher.otpExpiry)) {
        console.log(`❌ OTP expired`);
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // Set password and mark as verified
      teacher.password = password;
      teacher.isFirstLogin = false;
      teacher.emailVerified = true;
      teacher.otp = undefined;
      teacher.otpExpiry = undefined;
      await teacher.save();

      console.log(`✅ Teacher account setup completed for ${teacher.name}`);
      console.log(`📧 Email: ${teacher.email}`);
      console.log(`🔐 Password set: Yes`);
      console.log(`✅ Email verified: Yes`);
      console.log(`─────────────────────────────────────────────────────\n`);

      // Generate JWT token
      const token = generateToken({
        id: teacher._id,
        role: 'teacher',
        email: teacher.email,
        courses: teacher.courses
      });

      res.status(200).json({
        success: true,
        message: 'Account setup completed successfully',
        data: {
          token,
          user: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            courses: teacher.courses,
            role: 'teacher'
          }
        }
      });

    } catch (error) {
      console.error('Teacher signup verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed. Please try again.'
      });
    }
  },

  // Initial login with email
  initiateLogin: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found. Please contact administrator.'
        });
      }

      // Generate and save OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      teacher.otp = otp;
      teacher.otpExpiry = otpExpiry;
      await teacher.save();

      // Send OTP email
      await sendOTPEmail(teacher.email, otp, teacher.name, 'Teacher');

      res.status(200).json({
        success: true,
        message: 'OTP sent to your email address',
        data: {
          email: teacher.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
          isFirstLogin: teacher.isFirstLogin,
          subject: teacher.subject
        }
      });

    } catch (error) {
      console.error('Teacher initiate login error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP. Please try again.'
      });
    }
  },

  // Verify OTP and complete login
  verifyOTP: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp, password } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Verify OTP
      if (!teacher.otp || teacher.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      if (isOTPExpired(teacher.otpExpiry)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      // If first login, password is required
      if (teacher.isFirstLogin) {
        if (!password || password.length < 6) {
          return res.status(400).json({
            success: false,
            message: 'Password is required and must be at least 6 characters long'
          });
        }
        teacher.password = password;
        teacher.isFirstLogin = false;
      }

      // Clear OTP and mark email as verified
      teacher.otp = undefined;
      teacher.otpExpiry = undefined;
      teacher.emailVerified = true;
      await teacher.save();

      // Generate JWT token
      const token = generateToken({
        id: teacher._id,
        role: 'teacher',
        email: teacher.email,
        subject: teacher.subject
      });

      res.status(200).json({
        success: true,
        message: teacher.isFirstLogin ? 'Account setup completed successfully' : 'Login successful',
        data: {
          token,
          user: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            subject: teacher.subject,
            role: 'teacher'
          }
        }
      });

    } catch (error) {
      console.error('Teacher verify OTP error:', error);
      res.status(500).json({
        success: false,
        message: 'Verification failed. Please try again.'
      });
    }
  },

  // Login with password (for returning users)
  loginWithPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Check if teacher has set up password
      if (!teacher.password || teacher.isFirstLogin) {
        return res.status(400).json({
          success: false,
          message: 'Please complete your account setup first using OTP verification'
        });
      }

      // Verify password
      const isPasswordValid = await teacher.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = generateToken({
        id: teacher._id,
        role: 'teacher',
        email: teacher.email,
        subject: teacher.subject
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            phone: teacher.phone,
            subject: teacher.subject,
            role: 'teacher'
          }
        }
      });

    } catch (error) {
      console.error('Teacher password login error:', error);
      res.status(500).json({
        success: false,
        message: 'Login failed. Please try again.'
      });
    }
  },

  // Password reset functionality (similar to student)
  requestPasswordReset: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      teacher.otp = otp;
      teacher.otpExpiry = otpExpiry;
      await teacher.save();

      await sendPasswordResetEmail(teacher.email, otp, teacher.name, 'Teacher');

      res.status(200).json({
        success: true,
        message: 'Password reset OTP sent to your email',
        data: {
          email: teacher.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
        }
      });

    } catch (error) {
      console.error('Teacher password reset request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send reset OTP. Please try again.'
      });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, otp, newPassword } = req.body;

      const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      if (!teacher.otp || teacher.otp !== otp) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      if (isOTPExpired(teacher.otpExpiry)) {
        return res.status(400).json({
          success: false,
          message: 'OTP has expired. Please request a new one.'
        });
      }

      teacher.password = newPassword;
      teacher.otp = undefined;
      teacher.otpExpiry = undefined;
      await teacher.save();

      res.status(200).json({
        success: true,
        message: 'Password reset successful. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Teacher password reset error:', error);
      res.status(500).json({
        success: false,
        message: 'Password reset failed. Please try again.'
      });
    }
  },

  // Simple username/password login for testing
  loginWithUsername: async (req, res) => {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username and password are required'
        });
      }

      console.log(`\n🎓 TEACHER LOGIN ATTEMPT:`);
      console.log(`👤 Username: ${username}`);
      console.log(`🔍 Searching for teacher...`);

      // Find teacher by username or email
      // If username contains @, extract username part before @
      let searchUsername = username.toLowerCase();
      if (searchUsername.includes('@')) {
        searchUsername = searchUsername.split('@')[0];
      }
      
      const teacher = await Teacher.findOne({
        $or: [
          { username: searchUsername },
          { email: username.toLowerCase() }
        ]
      });
      
      if (!teacher) {
        console.log(`❌ Teacher not found with username/email: ${username}`);
        console.log(`🔍 Searched for username: ${searchUsername}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      console.log(`✅ Teacher found: ${teacher.name} (${teacher.subjects?.length || 0} subjects)`);
      
      // Check if teacher needs to complete OTP setup first
      if (!teacher.password || teacher.isFirstLogin) {
        console.log(`⚠️  Teacher needs to complete OTP setup first`);
        console.log(`🔐 Password set: ${teacher.password ? 'YES' : 'NO'}`);
        console.log(`🆕 First login: ${teacher.isFirstLogin}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(400).json({
          success: false,
          message: 'Please complete your account setup first using OTP verification'
        });
      }
      
      console.log(`🔑 Verifying password...`);

      // Check password
      const isPasswordValid = await teacher.comparePassword(password);
      if (!isPasswordValid) {
        console.log(`❌ Invalid password for teacher: ${teacher.name}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Invalid username or password'
        });
      }

      console.log(`✅ Password verified successfully!`);

      // Generate JWT token
      const token = generateToken({
        id: teacher._id,
        role: 'teacher',
        username: teacher.username,
        email: teacher.email
      });

      console.log(`🎉 Teacher login successful!`);
      console.log(`👤 Teacher: ${teacher.name}`);
      console.log(`📚 Subjects: ${teacher.subjects?.length || 0}`);
      console.log(`🔑 JWT Token generated`);
      console.log(`📱 Redirecting to teacher dashboard...`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            username: teacher.username,
            role: 'teacher'
          }
        }
      });

    } catch (error) {
      console.error('Teacher username login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

// Admin Authentication Controllers
const adminAuth = {
  // Admin OTP request
  requestOTP: async (req, res) => {
    try {
      const { email } = req.body;

      // Validate input
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      console.log(`\n👨‍💼 ADMIN OTP REQUEST:`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔍 Searching for admin...`);

      // Find admin by email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        console.log(`❌ Admin not found with email: ${email}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Email not authorized for admin access'
        });
      }

      console.log(`✅ Admin found: ${admin.name} (${admin.role})`);

      // Generate OTP
      const otp = generateOTP();
      const otpExpiry = generateOTPExpiry();

      // Save OTP to admin
      admin.otp = otp;
      admin.otpExpiry = otpExpiry;
      await admin.save();

      // Send OTP email
      await sendOTPEmail(email, otp, admin.name, 'Admin');

      console.log(`📧 OTP sent to: ${email}`);
      console.log(`🔑 Generated OTP: ${otp}`);
      console.log(`⏰ OTP expires at: ${otpExpiry}`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: 'OTP sent successfully',
        data: {
          email: email,
          message: 'Check your email for OTP'
        }
      });

    } catch (error) {
      console.error('Admin OTP request error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send OTP'
      });
    }
  },

  // Admin login with OTP
  login: async (req, res) => {
    try {
      const { email, otp } = req.body;

      // Validate input
      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      console.log(`\n👨‍💼 ADMIN LOGIN ATTEMPT:`);
      console.log(`📧 Email: ${email}`);
      console.log(`🔍 Searching for admin...`);

      // Find admin by email
      const admin = await Admin.findOne({ email: email.toLowerCase() });
      if (!admin) {
        console.log(`❌ Admin not found with email: ${email}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Email not authorized for admin access'
        });
      }

      console.log(`✅ Admin found: ${admin.name} (${admin.role})`);
      console.log(`🔑 Verifying OTP...`);

      // Check if OTP exists and is not expired
      if (!admin.otp || !admin.otpExpiry) {
        console.log(`❌ No OTP found for admin: ${admin.name}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Please request OTP first'
        });
      }

      // Check if OTP is expired
      if (isOTPExpired(admin.otpExpiry)) {
        console.log(`❌ OTP expired for admin: ${admin.name}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'OTP has expired. Please request a new one'
        });
      }

      // Check if OTP matches
      if (admin.otp !== otp) {
        console.log(`❌ Invalid OTP for admin: ${admin.name}`);
        console.log(`─────────────────────────────────────────────────────\n`);
        return res.status(401).json({
          success: false,
          message: 'Invalid OTP'
        });
      }

      console.log(`✅ OTP verified successfully!`);

      // Clear OTP after successful verification
      admin.otp = undefined;
      admin.otpExpiry = undefined;
      admin.lastLogin = new Date();
      await admin.save();

      // Generate JWT token
      const token = generateToken({
        id: admin._id,
        role: 'admin',
        username: admin.username,
        permissions: admin.permissions
      });

      console.log(`🎉 Admin login successful!`);
      console.log(`👤 Admin: ${admin.name}`);
      console.log(`🔑 Role: ${admin.role}`);
      console.log(`📋 Permissions: ${admin.permissions.join(', ')}`);
      console.log(`🔑 JWT Token generated`);
      console.log(`📱 Redirecting to admin dashboard...`);
      console.log(`─────────────────────────────────────────────────────\n`);

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: admin._id,
            name: admin.name,
            email: admin.email,
            username: admin.username,
            role: 'admin',
            permissions: admin.permissions
          }
        }
      });

    } catch (error) {
      console.error('Admin login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
};

module.exports = {
  studentAuth,
  teacherAuth,
  adminAuth
};
