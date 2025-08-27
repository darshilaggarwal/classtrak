const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true // e.g., "09:30"
  },
  endTime: {
    type: String,
    required: true // e.g., "10:30"
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    default: null // null means break/no class
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    default: null
  },
  isBreak: {
    type: Boolean,
    default: false
  },
  roomNumber: {
    type: String,
    default: ''
  }
});

const timetableSchema = new mongoose.Schema({
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  timeSlots: [timeSlotSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    default: '2024-25'
  }
}, {
  timestamps: true
});

// Compound index to ensure one timetable per batch per day
timetableSchema.index({ batch: 1, dayOfWeek: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);