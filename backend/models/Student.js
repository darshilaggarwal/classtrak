const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const attendanceRecordSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  date: { type: Date, required: true },
  status: { type: String, enum: ['present', 'absent'], required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true }
}, { _id: false });

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  rno: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, minlength: 6 },
  otp: { type: String },
  otpExpiry: { type: Date },
  emailVerified: { type: Boolean, default: false },
  
  // Course information
  courseName: { type: String, required: true, trim: true },
  courseDuration: { type: String, required: true, trim: true },
  
  // Academic information
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  
  attendance: [attendanceRecordSchema], // Legacy field - will be phased out
  isFirstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
studentSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
studentSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get attendance percentage for a subject
studentSchema.methods.getAttendancePercentage = function(subject) {
  const subjectAttendance = this.attendance.filter(record => record.subject === subject);
  if (subjectAttendance.length === 0) return 0;
  
  const presentCount = subjectAttendance.filter(record => record.status === 'present').length;
  return Math.round((presentCount / subjectAttendance.length) * 100);
};

// Get all subjects attendance
studentSchema.methods.getAllSubjectsAttendance = function() {
  const subjects = [...new Set(this.attendance.map(record => record.subject))];
  return subjects.map(subject => ({
    subject,
    percentage: this.getAttendancePercentage(subject)
  }));
};

// Indexes for efficient queries
studentSchema.index({ rno: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ batch: 1 });
studentSchema.index({ department: 1 });
studentSchema.index({ isActive: 1 });

module.exports = mongoose.model('Student', studentSchema);
