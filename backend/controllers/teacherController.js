const Teacher = require('../models/Teacher');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');

const teacherController = {
  // Get teacher's own profile
  getMyProfile: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      const teacher = await Teacher.findById(teacherId)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        })
        .populate('courses', 'name code')
        .select('-password -otp -otpExpiry');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }
      
      res.status(200).json({
        success: true,
        data: teacher
      });
    } catch (error) {
      console.error('Get teacher profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher profile'
      });
    }
  },

  // Get teacher's batches with subject counts
  getMyBatches: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      // Get teacher with populated subjects
      const teacher = await Teacher.findById(teacherId)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        });
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      console.log('👤 Teacher subjects:', teacher.subjects.map(s => s.name));

      // Get all batches
      const allBatches = await Batch.find({ isActive: true })
        .populate('department', 'name code');
      
      // Get batches where teacher teaches subjects
      // We'll use semester matching to determine which subjects go to which batches
      const teacherBatches = [];
      
      allBatches.forEach(batch => {
        const batchDepartmentId = batch.department?._id || batch.department;
        
        // Extract semester from batch name (e.g., "BTech AIML 5th Sem" -> 5)
        const semesterMatch = batch.name.match(/(\d+)(?:st|nd|rd|th)\s+Sem/);
        const batchSemester = semesterMatch ? parseInt(semesterMatch[1]) : null;
        
        // Find subjects teacher teaches in this department and semester
        const subjectsInBatch = teacher.subjects.filter(subject => {
          const subjectDepartmentId = subject.department?._id || subject.department;
          const subjectSemester = subject.semester;
          
          // Match department and semester (convert to strings for comparison)
          const deptMatch = subjectDepartmentId.toString() === batchDepartmentId.toString();
          const semMatch = subjectSemester === batchSemester;
          
          return deptMatch && semMatch;
        });
        
        // Only include batch if teacher teaches at least one subject
        if (subjectsInBatch.length > 0) {
          teacherBatches.push({
            ...batch.toObject(),
            subjectCount: subjectsInBatch.length,
            teacherSubjects: subjectsInBatch.map(subject => ({
              _id: subject._id,
              name: subject.name,
              code: subject.code,
              semester: subject.semester,
              department: subject.department
            }))
          });
        }
      });
      
      const batchesWithSubjectCount = teacherBatches;
      
      console.log('📚 Teacher batches with subjects:', batchesWithSubjectCount.length);
      batchesWithSubjectCount.forEach(batch => {
        const semesterMatch = batch.name.match(/(\d+)(?:st|nd|rd|th)\s+Sem/);
        const batchSemester = semesterMatch ? parseInt(semesterMatch[1]) : 'Unknown';
        console.log(`- ${batch.name} (Sem ${batchSemester}): ${batch.subjectCount} subjects (${batch.teacherSubjects.map(s => `${s.name} (Sem ${s.semester})`).join(', ')})`);
      });
      
      res.status(200).json({
        success: true,
        data: batchesWithSubjectCount
      });
    } catch (error) {
      console.error('Get teacher batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher batches'
      });
    }
  },

  // Get teacher's subjects
  getMySubjects: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      const teacher = await Teacher.findById(teacherId)
        .populate('subjects', 'name code department');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      res.status(200).json({
        success: true,
        data: teacher.subjects || []
      });
    } catch (error) {
      console.error('Get teacher subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher subjects'
      });
    }
  },

  // Get teacher's schedule for a specific date
  getTeacherSchedule: async (req, res) => {
    try {
      const { teacherId } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      const searchDate = new Date(date);
      const dayOfWeek = searchDate.toLocaleDateString('en-US', { weekday: 'long' });

      // Get all batches where this teacher teaches
      const teacher = await Teacher.findById(teacherId).populate('subjects');
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Get timetables for all batches where teacher has subjects
      const teacherBatches = [];
      for (const subject of teacher.subjects) {
        const batches = await Batch.find({
          department: subject.department,
          semester: subject.semester,
          isActive: true
        });
        teacherBatches.push(...batches);
      }

      // Get timetables for these batches
      const timetables = await Timetable.find({
        batch: { $in: teacherBatches.map(b => b._id) },
        day: dayOfWeek
      }).populate('batch', 'name');

      // Extract time slots where teacher has classes
      const schedule = [];
      for (const timetable of timetables) {
        for (const slot of timetable.timeSlots) {
          if (!slot.isBreak && slot.teacher && slot.teacher.toString() === teacherId) {
            schedule.push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              subjectId: slot.subject,
              subjectName: slot.subjectName,
              batchName: timetable.batch.name,
              roomNumber: slot.roomNumber || 'TBD'
            });
          }
        }
      }

      // Sort by start time
      schedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

      res.status(200).json({
        success: true,
        data: schedule
      });
    } catch (error) {
      console.error('Get teacher schedule error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher schedule'
      });
    }
  },

  // Get teacher's batches by ID
  getTeacherBatches: async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      const teacher = await Teacher.findById(teacherId)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        });
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Get all batches
      const allBatches = await Batch.find({ isActive: true })
        .populate('department', 'name code');
      
      // Get batches where teacher teaches subjects
      const teacherBatches = [];
      
      allBatches.forEach(batch => {
        const batchDepartmentId = batch.department?._id || batch.department;
        
        // Extract semester from batch name
        const semesterMatch = batch.name.match(/(\d+)(?:st|nd|rd|th)\s+Sem/);
        const batchSemester = semesterMatch ? parseInt(semesterMatch[1]) : null;
        
        // Find subjects teacher teaches in this department and semester
        const subjectsInBatch = teacher.subjects.filter(subject => {
          const subjectDepartmentId = subject.department?._id || subject.department;
          const subjectSemester = subject.semester;
          
          const deptMatch = subjectDepartmentId.toString() === batchDepartmentId.toString();
          const semMatch = subjectSemester === batchSemester;
          
          return deptMatch && semMatch;
        });
        
        if (subjectsInBatch.length > 0) {
          teacherBatches.push({
            ...batch.toObject(),
            subjectCount: subjectsInBatch.length,
            teacherSubjects: subjectsInBatch.map(subject => ({
              _id: subject._id,
              name: subject.name,
              code: subject.code,
              semester: subject.semester,
              department: subject.department
            }))
          });
        }
      });

      res.status(200).json({
        success: true,
        data: teacherBatches
      });
    } catch (error) {
      console.error('Get teacher batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher batches'
      });
    }
  },

  // Get teacher's subjects by ID
  getTeacherSubjects: async (req, res) => {
    try {
      const { teacherId } = req.params;
      
      const teacher = await Teacher.findById(teacherId)
        .populate('subjects', 'name code department semester');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      res.status(200).json({
        success: true,
        data: teacher.subjects || []
      });
    } catch (error) {
      console.error('Get teacher subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher subjects'
      });
    }
  }
};

module.exports = teacherController;
