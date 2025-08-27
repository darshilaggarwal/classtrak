const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send OTP email
const sendOTPEmail = async (email, otp, name, userType = 'Student') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ClassTrack System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'ClassTrack - Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">ClassTrack Verification</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your OTP for ${userType} login verification is:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="background: #007bff; color: white; padding: 10px 20px; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 3px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this OTP, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>ClassTrack Attendance Management System</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent successfully!`);
    console.log(`📮 To: ${email}`);
    console.log(`📬 Message ID: ${result.messageId}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, otp, name, userType = 'Student') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"ClassTrack System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'ClassTrack - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Hello <strong>${name}</strong>,</p>
            <p>You requested to reset your password. Your OTP is:</p>
            <div style="text-align: center; margin: 20px 0;">
              <span style="background: #dc3545; color: white; padding: 10px 20px; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 3px;">${otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">
              This OTP will expire in ${process.env.OTP_EXPIRY_MINUTES || 5} minutes.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; color: #888; font-size: 12px;">
            <p>ClassTrack Attendance Management System</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send password reset email');
  }
};

module.exports = {
  sendOTPEmail,
  sendPasswordResetEmail
};
