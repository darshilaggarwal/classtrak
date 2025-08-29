const mongoose = require('mongoose');

const substitutionSchema = new mongoose.Schema({
  // Original teacher who is unavailable
  originalTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  
  // Substitute teacher who will take the class
  substituteTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true
  },
  
  // Subject being substituted
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // Batch for which the substitution is made
  batch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Batch',
    required: true
  },
  
  // Date of substitution
  date: {
    type: Date,
    required: true
  },
  
  // Time slot details
  startTime: {
    type: String,
    required: true
  },
  
  endTime: {
    type: String,
    required: true
  },
  
  // Room number
  roomNumber: {
    type: String,
    required: true
  },
  
  // Status of substitution
  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Reason for substitution
  reason: {
    type: String,
    required: true
  },
  
  // Notes from substitute teacher
  notes: {
    type: String,
    default: ''
  },
  
  // Created and updated timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
substitutionSchema.index({ originalTeacher: 1, date: 1 });
substitutionSchema.index({ substituteTeacher: 1, date: 1 });
substitutionSchema.index({ batch: 1, date: 1 });
substitutionSchema.index({ status: 1 });

const Substitution = mongoose.model('Substitution', substitutionSchema);

module.exports = Substitution;
    