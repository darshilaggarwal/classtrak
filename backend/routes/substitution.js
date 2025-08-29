const express = require('express');
const router = express.Router();
const substitutionController = require('../controllers/substitutionController');
const { authenticateTeacher } = require('../middleware/auth');
const { body } = require('express-validator');

// Validation middleware
const createSubstitutionValidation = [
  body('originalTeacherId').isMongoId().withMessage('Valid original teacher ID is required'),
  body('substituteTeacherId').isMongoId().withMessage('Valid substitute teacher ID is required'),
  body('subjectId').isMongoId().withMessage('Valid subject ID is required'),
  body('batchId').isMongoId().withMessage('Valid batch ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:MM)'),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid end time is required (HH:MM)'),
  body('roomNumber').notEmpty().withMessage('Room number is required'),
  body('reason').notEmpty().withMessage('Reason for substitution is required')
];

const updateStatusValidation = [
  body('status').isIn(['pending', 'approved', 'completed', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

// Get all substitutions for a teacher (as original or substitute)
router.get('/teacher/:teacherId', authenticateTeacher, substitutionController.getTeacherSubstitutions);

// Get available teachers for a specific time slot
router.post('/available-teachers', authenticateTeacher, substitutionController.getAvailableTeachers);

// Create a substitution request
router.post('/', authenticateTeacher, createSubstitutionValidation, substitutionController.createSubstitution);

// Update substitution status (approve/reject by substitute teacher)
router.put('/:substitutionId/status', authenticateTeacher, updateStatusValidation, substitutionController.updateSubstitutionStatus);

// Cancel a substitution (by original teacher)
router.put('/:substitutionId/cancel', authenticateTeacher, substitutionController.cancelSubstitution);

// Get substitutions for attendance tracking (for substitute teachers)
router.get('/attendance/:teacherId', authenticateTeacher, substitutionController.getSubstitutionsForAttendance);

module.exports = router;
