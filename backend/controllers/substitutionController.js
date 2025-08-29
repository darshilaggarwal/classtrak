const Substitution = require('../models/Substitution');
const Teacher = require('../models/Teacher');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const { validationResult } = require('express-validator');

const substitutionController = {
  // Get all substitutions for a teacher (as original or substitute)
  getTeacherSubstitutions: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { status, date } = req.query;

      let query = {
        $or: [
          { originalTeacher: teacherId },
          { substituteTeacher: teacherId }
        ]
      };

      if (status) query.status = status;
      if (date) {
        const searchDate = new Date(date);
        query.date = {
          $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }

      const substitutions = await Substitution.find(query)
        .populate('originalTeacher', 'name email')
        .populate('substituteTeacher', 'name email')
        .populate('subject', 'name code')
        .populate('batch', 'name')
        .sort({ date: -1, startTime: 1 });

      res.json({
        success: true,
        data: substitutions
      });
    } catch (error) {
      console.error('Error fetching teacher substitutions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch substitutions',
        error: error.message
      });
    }
  },

  // Get available teachers for a specific time slot
  getAvailableTeachers: async (req, res) => {
    try {
      const { date, startTime, endTime, batchId, subjectId } = req.body;

      // Validate required fields
      if (!date || !startTime || !endTime || !batchId || !subjectId) {
        return res.status(400).json({
          success: false,
          message: 'Date, start time, end time, batch ID, and subject ID are required'
        });
      }

      const searchDate = new Date(date);
      const dayOfWeek = searchDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Get the batch and its department
      const batch = await Batch.findById(batchId).populate('department');
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // Get all teachers in the same department
      const departmentTeachers = await Teacher.find({
        courses: batch.department._id,
        isActive: true
      }).populate('subjects');

      // Get timetable for the specific day and batch
      const timetable = await Timetable.findOne({
        batch: batchId,
        dayOfWeek: dayOfWeek
      });

      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: 'No timetable found for this day and batch'
        });
      }

      // Find teachers who are available during the specified time slot
      const availableTeachers = [];

      for (const teacher of departmentTeachers) {
        // Skip the original teacher (the one requesting substitution)
        if (teacher._id.toString() === req.user.id.toString()) {
          continue;
        }

        // Check if teacher has any classes during this time slot
        let hasConflict = false;
        
        // Check conflicts in the current batch's timetable
        for (const slot of timetable.timeSlots) {
          if (slot.isBreak) continue;
          
          const slotStart = slot.startTime;
          const slotEnd = slot.endTime;
          
          // Check for time overlap
          const hasOverlap = !(endTime <= slotStart || startTime >= slotEnd);
          
          if (hasOverlap && slot.teacher && slot.teacher.toString() === teacher._id.toString()) {
            hasConflict = true;
            break;
          }
        }

        // Also check other batches where this teacher might have classes at the same time
        if (!hasConflict) {
          const otherTimetables = await Timetable.find({
            dayOfWeek: dayOfWeek,
            batch: { $ne: batchId }
          }).populate('batch');

          for (const otherTimetable of otherTimetables) {
            for (const slot of otherTimetable.timeSlots) {
              if (slot.isBreak) continue;
              
              const slotStart = slot.startTime;
              const slotEnd = slot.endTime;
              
              // Check for time overlap
              const hasOverlap = !(endTime <= slotStart || startTime >= slotEnd);
              
              if (hasOverlap && slot.teacher && slot.teacher.toString() === teacher._id.toString()) {
                hasConflict = true;
                break;
              }
            }
            if (hasConflict) break;
          }
        }

        if (!hasConflict) {
          availableTeachers.push({
            _id: teacher._id,
            name: teacher.name,
            email: teacher.email,
            username: teacher.username,
            subjects: teacher.subjects.map(sub => ({
              _id: sub._id,
              name: sub.name,
              code: sub.code
            }))
          });
        }
      }

      res.json({
        success: true,
        data: availableTeachers
      });
    } catch (error) {
      console.error('Error finding available teachers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find available teachers',
        error: error.message
      });
    }
  },

  // Create a substitution request
  createSubstitution: async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        originalTeacherId,
        substituteTeacherId,
        subjectId,
        batchId,
        date,
        startTime,
        endTime,
        roomNumber,
        reason
      } = req.body;

      // Validate that the original teacher is the one making the request
      if (req.teacher._id.toString() !== originalTeacherId) {
        return res.status(403).json({
          success: false,
          message: 'You can only create substitutions for your own classes'
        });
      }

      // Check if substitution already exists for this time slot
      const existingSubstitution = await Substitution.findOne({
        originalTeacher: originalTeacherId,
        batch: batchId,
        date: new Date(date),
        startTime,
        endTime,
        status: { $in: ['pending', 'approved'] }
      });

      if (existingSubstitution) {
        return res.status(400).json({
          success: false,
          message: 'A substitution already exists for this time slot'
        });
      }

      // Create the substitution
      const substitution = new Substitution({
        originalTeacher: originalTeacherId,
        substituteTeacher: substituteTeacherId,
        subject: subjectId,
        batch: batchId,
        date: new Date(date),
        startTime,
        endTime,
        roomNumber,
        reason,
        status: 'pending'
      });

      await substitution.save();

      // Populate the created substitution
      const populatedSubstitution = await Substitution.findById(substitution._id)
        .populate('originalTeacher', 'name email')
        .populate('substituteTeacher', 'name email')
        .populate('subject', 'name code')
        .populate('batch', 'name');

      res.status(201).json({
        success: true,
        message: 'Substitution request created successfully',
        data: populatedSubstitution
      });
    } catch (error) {
      console.error('Error creating substitution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create substitution',
        error: error.message
      });
    }
  },

  // Update substitution status (approve/reject by substitute teacher)
  updateSubstitutionStatus: async (req, res) => {
    try {
      const { substitutionId } = req.params;
      const { status, notes } = req.body;

      const substitution = await Substitution.findById(substitutionId);
      if (!substitution) {
        return res.status(404).json({
          success: false,
          message: 'Substitution not found'
        });
      }

      // Validate that the substitute teacher is the one updating
      if (substitution.substituteTeacher.toString() !== req.teacher._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the substitute teacher can update this substitution'
        });
      }

      // Update status and notes
      substitution.status = status;
      if (notes) substitution.notes = notes;
      substitution.updatedAt = new Date();

      await substitution.save();

      // Populate the updated substitution
      const updatedSubstitution = await Substitution.findById(substitutionId)
        .populate('originalTeacher', 'name email')
        .populate('substituteTeacher', 'name email')
        .populate('subject', 'name code')
        .populate('batch', 'name');

      res.json({
        success: true,
        message: 'Substitution status updated successfully',
        data: updatedSubstitution
      });
    } catch (error) {
      console.error('Error updating substitution status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update substitution status',
        error: error.message
      });
    }
  },

  // Cancel a substitution (by original teacher)
  cancelSubstitution: async (req, res) => {
    try {
      const { substitutionId } = req.params;

      const substitution = await Substitution.findById(substitutionId);
      if (!substitution) {
        return res.status(404).json({
          success: false,
          message: 'Substitution not found'
        });
      }

      // Validate that the original teacher is the one cancelling
      if (substitution.originalTeacher.toString() !== req.teacher._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Only the original teacher can cancel this substitution'
        });
      }

      // Only allow cancellation if status is pending or approved
      if (!['pending', 'approved'].includes(substitution.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel substitution with current status'
        });
      }

      substitution.status = 'cancelled';
      substitution.updatedAt = new Date();

      await substitution.save();

      res.json({
        success: true,
        message: 'Substitution cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling substitution:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cancel substitution',
        error: error.message
      });
    }
  },

  // Get substitutions for attendance tracking (for substitute teachers)
  getSubstitutionsForAttendance: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;

      let query = {
        substituteTeacher: teacherId,
        status: 'approved'
      };

      if (date) {
        const searchDate = new Date(date);
        query.date = {
          $gte: new Date(searchDate.setHours(0, 0, 0, 0)),
          $lt: new Date(searchDate.setHours(23, 59, 59, 999))
        };
      }

      const substitutions = await Substitution.find(query)
        .populate('originalTeacher', 'name email')
        .populate('subject', 'name code')
        .populate('batch', 'name')
        .sort({ date: 1, startTime: 1 });

      res.json({
        success: true,
        data: substitutions
      });
    } catch (error) {
      console.error('Error fetching substitutions for attendance:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch substitutions for attendance',
        error: error.message
      });
    }
  }
};

module.exports = substitutionController;
