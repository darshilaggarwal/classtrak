const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  rollNumber: {
    type: String,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  status: {
    type: String,
    enum: ['present', 'absent'],
    required: true
  }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  classTime: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: Number,
    default: 60, // Duration in minutes
    min: 30,
    max: 180
  },
  takenBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  records: [attendanceRecordSchema],
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure one attendance record per date-subject-batch-time combination
attendanceSchema.index({ date: 1, subject: 1, batch: 1, classTime: 1 }, { unique: true });

// Index for efficient monthly queries
attendanceSchema.index({ month: 1, year: 1, subject: 1 });

// Pre-save middleware to automatically set month and year
attendanceSchema.pre('save', function(next) {
  if (this.date) {
    this.month = this.date.getMonth() + 1; // 1-12
    this.year = this.date.getFullYear();
  }
  next();
});

// Method to get attendance statistics
attendanceSchema.methods.getStatistics = function() {
  const total = this.records.length;
  const present = this.records.filter(record => record.status === 'present').length;
  const absent = total - present;
  
  return {
    total,
    present,
    absent,
    presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);
