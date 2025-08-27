const Timetable = require('../models/Timetable');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Department = require('../models/Department');

// Helper function for weekly timetable import
const importWeeklyTimetable = async (data, res) => {
  try {
    const { batchName, weeklyTimetable } = data;
    console.log('🔍 Processing weekly import for batch:', batchName);
    
    // Find batch by name
    const batch = await Batch.findOne({ name: batchName }).populate('department');
    if (!batch) {
      console.log('❌ Batch not found:', batchName);
      return res.status(404).json({ 
        success: false, 
        message: `Batch not found: ${batchName}` 
      });
    }

    const results = [];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Process each day
    for (const day of daysOfWeek) {
      if (weeklyTimetable[day]) {
        try {
          const timeSlots = weeklyTimetable[day];
          const processedSlots = [];

          // Process each time slot for this day
          for (const slot of timeSlots) {
            // Validate time format (HH:MM)
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(slot.startTime) || !timeRegex.test(slot.endTime)) {
              console.log(`❌ Invalid time format: ${slot.startTime} or ${slot.endTime}`);
              throw new Error(`Invalid time format. Use HH:MM format (e.g., 09:30, 14:35)`);
            }

            const processedSlot = {
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBreak: slot.isBreak || false,
              roomNumber: slot.roomNumber || ''
            };

            if (!slot.isBreak && slot.subjectName) {
              // Find subject by name and course
              const subject = await Subject.findOne({
                name: slot.subjectName,
                department: batch.department._id
              });

              if (subject) {
                processedSlot.subject = subject._id;

                // Find teacher
                const teacher = await Teacher.findOne({
                  subjects: subject._id,
                  isActive: true
                });

                if (teacher) {
                  processedSlot.teacher = teacher._id;
                }
              } else {
                console.warn(`Subject not found: ${slot.subjectName} for ${batch.department.name}`);
              }
            }

            processedSlots.push(processedSlot);
          }

          // Save/update timetable for this day
          await Timetable.findOneAndUpdate(
            { batch: batch._id, dayOfWeek: day },
            {
              batch: batch._id,
              dayOfWeek: day,
              timeSlots: processedSlots,
              isActive: true
            },
            { new: true, upsert: true }
          );

          results.push({ 
            batchName, 
            dayOfWeek: day,
            status: 'success',
            slotsCount: processedSlots.length
          });

        } catch (error) {
          results.push({ 
            batchName, 
            dayOfWeek: day,
            status: 'error', 
            message: error.message 
          });
        }
      } else {
        // Day not provided, delete existing timetable for this day
        await Timetable.findOneAndDelete({ batch: batch._id, dayOfWeek: day });
        results.push({ 
          batchName, 
          dayOfWeek: day,
          status: 'cleared',
          message: 'No data provided, existing timetable cleared'
        });
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const clearedCount = results.filter(r => r.status === 'cleared').length;

    return res.json({ 
      success: true, 
      results, 
      summary: {
        batch: batchName,
        success: successCount,
        errors: errorCount,
        cleared: clearedCount,
        total: daysOfWeek.length
      },
      message: `Weekly timetable processed: ${successCount} days created, ${errorCount} errors, ${clearedCount} cleared` 
    });

  } catch (error) {
    console.error('Error importing weekly timetable:', error);
    return res.status(500).json({ success: false, message: 'Failed to import weekly timetable' });
  }
};

const timetableController = {
  // Get all timetables for admin
  getAllTimetables: async (req, res) => {
    try {
      const timetables = await Timetable.find({ isActive: true })
        .populate({
          path: 'batch',
          select: 'name department year',
          populate: {
            path: 'department',
            select: 'name'
          }
        })
        .populate('timeSlots.subject', 'name code')
        .populate('timeSlots.teacher', 'name')
        .sort({ 'batch.name': 1, dayOfWeek: 1 });

      res.json({ success: true, timetables });
    } catch (error) {
      console.error('Error fetching timetables:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch timetables' });
    }
  },

  // Get timetable for a specific batch and day
  getTimetableByBatchAndDay: async (req, res) => {
    try {
      const { batchId, dayOfWeek } = req.params;
      
      const timetable = await Timetable.findOne({ 
        batch: batchId, 
        dayOfWeek,
        isActive: true 
      })
        .populate('batch', 'name')
        .populate('timeSlots.subject', 'name code')
        .populate('timeSlots.teacher', 'name');

      if (!timetable) {
        return res.json({ success: true, timetable: null });
      }

      res.json({ success: true, timetable });
    } catch (error) {
      console.error('Error fetching timetable:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
  },

  // Get teacher's daily schedule
  getTeacherDailySchedule: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query; // YYYY-MM-DD format
      
      const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      
      const timetables = await Timetable.find({
        dayOfWeek,
        'timeSlots.teacher': teacherId,
        isActive: true
      })
        .populate({
          path: 'batch',
          select: 'name department',
          populate: {
            path: 'department',
            select: 'name'
          }
        })
        .populate('timeSlots.subject', 'name code')
        .populate('timeSlots.teacher', 'name');

      // Extract only the teacher's time slots
      const teacherSchedule = [];
      
      timetables.forEach(timetable => {
        timetable.timeSlots.forEach(slot => {
          if (slot.teacher && slot.teacher._id.toString() === teacherId) {
            teacherSchedule.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              subject: slot.subject,
              batch: timetable.batch,
              roomNumber: slot.roomNumber,
              timetableId: timetable._id,
              slotId: slot._id
            });
          }
        });
      });

      // Sort by start time
      teacherSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

      res.json({ success: true, schedule: teacherSchedule, dayOfWeek });
    } catch (error) {
      console.error('Error fetching teacher schedule:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch teacher schedule' });
    }
  },

  // Create or update timetable
  createOrUpdateTimetable: async (req, res) => {
    try {
      const { batchId, dayOfWeek, timeSlots } = req.body;

      // Validate batch exists
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      // Process time slots - validate subjects and find teachers
      const processedSlots = [];
      for (const slot of timeSlots) {
        const processedSlot = {
          startTime: slot.startTime,
          endTime: slot.endTime,
          isBreak: slot.isBreak || false,
          roomNumber: slot.roomNumber || ''
        };

        if (!slot.isBreak && slot.subjectId) {
          // Validate subject exists and belongs to the batch's course
          const subject = await Subject.findById(slot.subjectId)
            .populate('department');
          
          if (!subject || subject.department._id.toString() !== batch.department.toString()) {
            return res.status(400).json({ 
              success: false, 
              message: `Subject ${slot.subjectId} doesn't belong to batch's course` 
            });
          }

          processedSlot.subject = slot.subjectId;

          // Find teacher who teaches this subject
          const teacher = await Teacher.findOne({
            subjects: slot.subjectId,
            isActive: true
          });

          if (teacher) {
            processedSlot.teacher = teacher._id;
          }
        }

        processedSlots.push(processedSlot);
      }

      // Create or update timetable
      const timetable = await Timetable.findOneAndUpdate(
        { batch: batchId, dayOfWeek },
        {
          batch: batchId,
          dayOfWeek,
          timeSlots: processedSlots,
          isActive: true
        },
        { new: true, upsert: true }
      )
        .populate('batch', 'name')
        .populate('timeSlots.subject', 'name code')
        .populate('timeSlots.teacher', 'name');

      res.json({ success: true, timetable, message: 'Timetable saved successfully' });
    } catch (error) {
      console.error('Error saving timetable:', error);
      res.status(500).json({ success: false, message: 'Failed to save timetable' });
    }
  },

  // Import timetables from JSON (supports both old and new format)
  importTimetables: async (req, res) => {
    try {
      const data = req.body;
      console.log('📥 Received import data:', JSON.stringify(data, null, 2));

      // Check if it's the new weekly format
      if (data.batchName && data.weeklyTimetable) {
        console.log('✅ Using weekly format import');
        return await importWeeklyTimetable(data, res);
      }

      // Handle old format for backward compatibility
      const { timetables } = data;
      if (!Array.isArray(timetables)) {
        console.log('❌ Invalid format - neither weekly nor timetables array');
        return res.status(400).json({ success: false, message: 'Invalid format. Use either weekly format or timetables array.' });
      }

      const results = [];

      for (const ttData of timetables) {
        try {
          // Find batch by name
          const batch = await Batch.findOne({ name: ttData.batchName })
            .populate('department');
          
          if (!batch) {
            results.push({ 
              batchName: ttData.batchName, 
              dayOfWeek: ttData.dayOfWeek,
              status: 'error', 
              message: 'Batch not found' 
            });
            continue;
          }

          // Process time slots
          const processedSlots = [];
          for (const slot of ttData.timeSlots) {
            const processedSlot = {
              startTime: slot.startTime,
              endTime: slot.endTime,
              isBreak: slot.isBreak || false,
              roomNumber: slot.roomNumber || ''
            };

            if (!slot.isBreak && slot.subjectName) {
              // Find subject by name and course
              const subject = await Subject.findOne({
                name: slot.subjectName,
                department: batch.department._id
              });

              if (subject) {
                processedSlot.subject = subject._id;

                // Find teacher
                const teacher = await Teacher.findOne({
                  subjects: subject._id,
                  isActive: true
                });

                if (teacher) {
                  processedSlot.teacher = teacher._id;
                }
              }
            }

            processedSlots.push(processedSlot);
          }

          // Save timetable
          await Timetable.findOneAndUpdate(
            { batch: batch._id, dayOfWeek: ttData.dayOfWeek },
            {
              batch: batch._id,
              dayOfWeek: ttData.dayOfWeek,
              timeSlots: processedSlots,
              isActive: true
            },
            { new: true, upsert: true }
          );

          results.push({ 
            batchName: ttData.batchName, 
            dayOfWeek: ttData.dayOfWeek,
            status: 'success' 
          });

        } catch (error) {
          results.push({ 
            batchName: ttData.batchName, 
            dayOfWeek: ttData.dayOfWeek,
            status: 'error', 
            message: error.message 
          });
        }
      }

      res.json({ success: true, results, message: 'Timetables import completed' });
    } catch (error) {
      console.error('Error importing timetables:', error);
      res.status(500).json({ success: false, message: 'Failed to import timetables' });
    }
  },

  // Get available subjects for a batch
  getBatchSubjects: async (req, res) => {
    try {
      const { batchId } = req.params;
      
      const batch = await Batch.findById(batchId);
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      // Extract semester from batch name
      const semesterMatch = batch.name.match(/(\d+)(?:st|nd|rd|th)\s+Sem/);
      const semester = semesterMatch ? parseInt(semesterMatch[1]) : null;

      // Find subjects for this batch's course and semester
      const subjects = await Subject.find({
        department: batch.department,
        semester: semester,
        isActive: true
      }).select('name code semester');

      res.json({ success: true, subjects });
    } catch (error) {
      console.error('Error fetching batch subjects:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch batch subjects' });
    }
  },

  // Delete timetable
  deleteTimetable: async (req, res) => {
    try {
      const { batchId, dayOfWeek } = req.params;
      
      await Timetable.findOneAndDelete({ batch: batchId, dayOfWeek });
      
      res.json({ success: true, message: 'Timetable deleted successfully' });
    } catch (error) {
      console.error('Error deleting timetable:', error);
      res.status(500).json({ success: false, message: 'Failed to delete timetable' });
    }
  },

  // Delete all timetables for a batch
  deleteTimetablesByBatch: async (req, res) => {
    try {
      const { batchName } = req.params;
      
      // Find batch by name
      const batch = await Batch.findOne({ name: batchName });
      if (!batch) {
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }

      // Delete all timetables for this batch
      const result = await Timetable.deleteMany({ batch: batch._id });
      
      res.json({ 
        success: true, 
        message: `Deleted ${result.deletedCount} timetables for ${batchName}`,
        deletedCount: result.deletedCount
      });
    } catch (error) {
      console.error('Error deleting timetables by batch:', error);
      res.status(500).json({ success: false, message: 'Failed to delete timetables' });
    }
  },

  // Edit a specific time slot
  editTimeSlot: async (req, res) => {
    try {
      const { batchName, dayOfWeek, slotIndex, updates } = req.body;
      console.log('🔧 Editing time slot:', { batchName, dayOfWeek, slotIndex, updates });
      
      // Find batch by name
      const batch = await Batch.findOne({ name: batchName });
      if (!batch) {
        console.log('❌ Batch not found:', batchName);
        return res.status(404).json({ success: false, message: 'Batch not found' });
      }
      console.log('✅ Found batch:', batch._id);

      // Find the timetable for this batch and day
      const timetable = await Timetable.findOne({ batch: batch._id, dayOfWeek });
      if (!timetable) {
        console.log('❌ Timetable not found for batch:', batch._id, 'day:', dayOfWeek);
        return res.status(404).json({ success: false, message: 'Timetable not found' });
      }
      console.log('✅ Found timetable with', timetable.timeSlots.length, 'slots');

      // Update the specific time slot
      if (timetable.timeSlots[slotIndex]) {
        timetable.timeSlots[slotIndex] = { ...timetable.timeSlots[slotIndex], ...updates };
        
        // If it's a break, clear subject and teacher
        if (updates.isBreak) {
          timetable.timeSlots[slotIndex].subject = null;
          timetable.timeSlots[slotIndex].teacher = null;
        }
        
        await timetable.save();
        console.log('✅ Time slot updated successfully');
        
        res.json({ 
          success: true, 
          message: 'Time slot updated successfully',
          updatedSlot: timetable.timeSlots[slotIndex]
        });
      } else {
        console.log('❌ Invalid slot index:', slotIndex, 'available slots:', timetable.timeSlots.length);
        res.status(400).json({ success: false, message: 'Invalid slot index' });
      }
    } catch (error) {
      console.error('❌ Error editing time slot:', error);
      res.status(500).json({ success: false, message: 'Failed to edit time slot' });
    }
  }
};

module.exports = timetableController;
