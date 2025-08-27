const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Updated to support multiple subjects
  subjects: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject'
  }],
  
  // Legacy field - will be phased out
  subject: {
    type: String,
    trim: true
  },
  
  // Courses the teacher teaches (multiple courses)
  courses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  
  password: {
    type: String,
    minlength: 6
  },
  otp: {
    type: String
  },
  otpExpiry: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
teacherSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
teacherSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Indexes for efficient queries
teacherSchema.index({ username: 1 });
teacherSchema.index({ email: 1 });
teacherSchema.index({ subjects: 1 });
teacherSchema.index({ courses: 1 });
teacherSchema.index({ isActive: 1 });

module.exports = mongoose.model('Teacher', teacherSchema);
