const { validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');

// Teacher Controllers
const teacherControllers = {
  // Get all students for attendance marking
  getStudentsForAttendance: async (req, res) => {
    try {
      const students = await Student.find({}, {
        _id: 1,
        name: 1,
        rno: 1,
        email: 1
      }).sort({ rno: 1 });

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students
      });

    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students'
      });
    }
  },

  // Get students for a specific batch
  getStudentsForBatch: async (req, res) => {
    try {
      const { batchId } = req.params;
      
      console.log('🔍 Fetching students for batch:', batchId);
      
      // Get the batch first
      const Batch = require('../models/Batch');
      const batch = await Batch.findById(batchId);
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // Find students in this batch by batch ID
      const students = await Student.find({
        batch: batchId
      }, {
        _id: 1,
        name: 1,
        rno: 1,
        email: 1,
        batch: 1,
        semester: 1
      }).sort({ rno: 1 });

      console.log('✅ Found', students.length, 'students for batch', batch.name);

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students
      });

    } catch (error) {
      console.error('Get students for batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students for this batch'
      });
    }
  },

  // Get all batches that a teacher can teach
  getTeacherBatches: async (req, res) => {
    try {
      const teacherId = req.user.id;
      
      console.log('🔍 Fetching batches for teacher:', teacherId);
      
      // Get teacher with subjects
      const teacher = await Teacher.findById(teacherId).populate('subjects');
      
      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Get all batches
      const Batch = require('../models/Batch');
      const batches = await Batch.find({}).populate('department');
      
      // Filter batches that have timetables with subjects this teacher teaches
      const Timetable = require('../models/Timetable');
      const teacherSubjectIds = teacher.subjects.map(sub => sub._id.toString());
      
      console.log('🔍 Teacher subject IDs:', teacherSubjectIds);
      console.log('🔍 Teacher subject names:', teacher.subjects.map(s => s.name));
      
      const batchesWithTimetables = [];
      
      for (const batch of batches) {
        // Check if this batch has timetables with subjects this teacher teaches
        const timetables = await Timetable.find({ 
          batch: batch._id
        }).populate('timeSlots.subject');
        
        console.log(`🔍 Batch ${batch.name}: Found ${timetables.length} timetables total`);
        
        // Get unique subjects from timetables that this teacher teaches
        const batchSubjects = new Set();
        const teacherSubjectsInBatch = new Set();
        
        timetables.forEach(tt => {
          tt.timeSlots.forEach(slot => {
            if (slot.subject && slot.subject._id) {
              const subjectId = slot.subject._id.toString();
              const subjectName = slot.subject.name;
              
              console.log(`🔍 Slot subject: ${subjectName} (${subjectId})`);
              
              if (teacherSubjectIds.includes(subjectId)) {
                batchSubjects.add(subjectName);
                teacherSubjectsInBatch.add(subjectName);
                console.log(`✅ Teacher can teach: ${subjectName}`);
              } else {
                console.log(`❌ Teacher cannot teach: ${subjectName}`);
              }
            }
          });
        });
        
        console.log(`📚 Batch ${batch.name} - Teacher's subjects:`, Array.from(teacherSubjectsInBatch));
        
        // Only include batches where teacher has at least one subject
        if (teacherSubjectsInBatch.size > 0) {
          batchesWithTimetables.push({
            _id: batch._id,
            name: batch.name,
            department: batch.department,
            timetableDays: timetables.length,
            subjects: Array.from(teacherSubjectsInBatch)
          });
        }
      }

      console.log('✅ Found', batchesWithTimetables.length, 'batches for teacher');

      res.status(200).json({
        success: true,
        message: 'Batches retrieved successfully',
        data: batchesWithTimetables
      });

    } catch (error) {
      console.error('Get teacher batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve batches for teacher'
      });
    }
  },

  // Get students for a specific batch by name
  getStudentsForBatchByName: async (req, res) => {
    try {
      const { batchName } = req.params;
      
      console.log('🔍 Fetching students for batch name:', batchName);
      
      // Get the batch first by name
      const Batch = require('../models/Batch');
      const batch = await Batch.findOne({ name: batchName });
      
      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      // Find students in this batch
      const students = await Student.find({
        batch: batch._id
      }, {
        _id: 1,
        name: 1,
        rno: 1,
        email: 1,
        batch: 1,
        semester: 1
      }).sort({ rno: 1 });

      console.log('✅ Found', students.length, 'students for batch', batch.name);

      res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students,
        batchInfo: {
          id: batch._id,
          name: batch.name,
          department: batch.department
        }
      });

    } catch (error) {
      console.error('Get students for batch by name error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve students for this batch'
      });
    }
  },

  // Mark attendance for a specific date and subject
  markAttendance: async (req, res) => {
    try {
      console.log('\n📝 ATTENDANCE MARKING:');
      console.log('👤 Teacher ID:', req.user.id);
      console.log('📚 Teacher Subject:', req.teacher.subject);
      console.log('📅 Date:', req.body.date);
      console.log('👥 Records Count:', req.body.records?.length);

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.log('❌ Validation errors:', errors.array());
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { date, subject, batch, records, classTime, duration } = req.body;
      const teacherId = req.user.id;

      console.log('✅ Validation passed. Processing attendance...');
      console.log('🕐 Class Time:', classTime);
      console.log('⏱️ Duration:', duration, 'minutes');
      console.log('📚 Subject:', subject);
      console.log('👥 Batch:', batch);

      // Verify teacher can mark attendance for this subject
      const teacher = await Teacher.findById(teacherId).populate('subjects');
      const canTeachSubject = teacher.subjects.some(sub => sub.name === subject);
      
      if (!canTeachSubject) {
        return res.status(403).json({
          success: false,
          message: 'You can only mark attendance for your assigned subjects'
        });
      }

      // Check if attendance already exists for this date, subject, batch, and time
      const existingAttendance = await Attendance.findOne({
        date: new Date(date),
        subject: subject,
        batch: batch,
        classTime: classTime
      });

      if (existingAttendance) {
        console.log('❌ Attendance already exists for this class');
        console.log('📅 Date:', date);
        console.log('📚 Subject:', subject);
        console.log('👥 Batch:', batch);
        console.log('🕐 Time:', classTime);
        console.log('─────────────────────────────────────────────────────\n');

        return res.status(409).json({
          success: false,
          message: 'Attendance has already been marked for this class. You cannot mark attendance twice for the same class.',
          data: existingAttendance
        });
      } else {
        // Create new attendance record
        const attendance = new Attendance({
          date: new Date(date),
          subject,
          batch: batch,
          classTime: classTime || '09:00',
          duration: duration || 60,
          takenBy: teacherId,
          records
        });

        await attendance.save();

        // Update student attendance records
        await updateStudentAttendanceRecords(records, subject, date, teacherId);

        console.log('🎉 New attendance record created successfully');
        console.log('📊 Marked attendance for', records.length, 'students');
        console.log('─────────────────────────────────────────────────────\n');

        res.status(201).json({
          success: true,
          message: 'Attendance marked successfully',
          data: attendance
        });
      }

    } catch (error) {
      console.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark attendance'
      });
    }
  },

  // Get attendance for a specific date and subject
  getAttendanceByDate: async (req, res) => {
    try {
      const { date, subject } = req.query;
      const teacherId = req.user.id;

      // Verify teacher can access this subject
      const teacher = await Teacher.findById(teacherId);
      if (subject && teacher.subject !== subject) {
        return res.status(403).json({
          success: false,
          message: 'You can only view attendance for your assigned subject'
        });
      }

      const query = { takenBy: teacherId };
      if (date) query.date = new Date(date);
      if (subject) query.subject = subject;

      const attendance = await Attendance.find(query)
        .populate('records.studentId', 'name rno email')
        .populate('takenBy', 'name email subject')
        .sort({ date: -1 });

      res.status(200).json({
        success: true,
        message: 'Attendance retrieved successfully',
        data: attendance
      });

    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance'
      });
    }
  },

  // Get attendance statistics for teacher's subject
  getAttendanceStatistics: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const teacher = await Teacher.findById(teacherId);
      const { startDate, endDate } = req.query;

      const query = {
        takenBy: teacherId,
        subject: teacher.subject
      };

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      const attendanceRecords = await Attendance.find(query);

      // Calculate statistics
      let totalClasses = attendanceRecords.length;
      let totalStudentRecords = 0;
      let totalPresent = 0;

      attendanceRecords.forEach(record => {
        totalStudentRecords += record.records.length;
        totalPresent += record.records.filter(r => r.status === 'present').length;
      });

      const overallPercentage = totalStudentRecords > 0 
        ? Math.round((totalPresent / totalStudentRecords) * 100) 
        : 0;

      // Get student-wise statistics
      const studentStats = {};
      attendanceRecords.forEach(record => {
        record.records.forEach(studentRecord => {
          if (!studentRecord.studentId) {
            return; // Skip records with null/undefined studentId
          }
          const studentId = studentRecord.studentId.toString();
          if (!studentStats[studentId]) {
            studentStats[studentId] = {
              rollNumber: studentRecord.rollNumber,
              present: 0,
              total: 0
            };
          }
          studentStats[studentId].total++;
          if (studentRecord.status === 'present') {
            studentStats[studentId].present++;
          }
        });
      });

      // Convert to array and add percentages
      const studentStatistics = Object.entries(studentStats).map(([studentId, stats]) => ({
        studentId,
        rollNumber: stats.rollNumber,
        present: stats.present,
        total: stats.total,
        percentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0
      }));

      res.status(200).json({
        success: true,
        message: 'Statistics retrieved successfully',
        data: {
          subject: teacher.subject,
          totalClasses,
          overallPercentage,
          dateRange: startDate && endDate ? { startDate, endDate } : null,
          studentStatistics: studentStatistics.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber))
        }
      });

    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve statistics'
      });
    }
  },

  // Get teacher's class history
  getClassHistory: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const teacher = await Teacher.findById(teacherId);
      const { page = 1, limit = 50 } = req.query;

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      // Get attendance records taken by this teacher with pagination
      const attendanceRecords = await Attendance.find({
        takenBy: teacherId
      })
      .populate('takenBy', 'name')
      .populate('batch', 'name')
      .populate('records.studentId', 'name rno email')
      .sort({ date: -1, classTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

      // Get total count for pagination
      const totalRecords = await Attendance.countDocuments({
        takenBy: teacherId
      });

      // Format the data
      const classHistory = attendanceRecords.map(record => {
        const presentCount = record.records.filter(r => r.status === 'present').length;
        const absentCount = record.records.filter(r => r.status === 'absent').length;
        const totalStudents = record.records.length;
        const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

        // Format student records with names
        const formattedRecords = record.records.map(studentRecord => ({
          studentId: studentRecord.studentId?._id || null,
          studentName: studentRecord.studentId?.name || 'Unknown Student',
          rollNumber: studentRecord.rollNumber || 'N/A',
          status: studentRecord.status
        }));

        return {
          id: record._id,
          date: record.date,
          classTime: record.classTime,
          duration: record.duration,
          subject: record.subject,
          batch: record.batch?.name || 'Unknown Batch',
          totalCount: totalStudents,
          presentCount,
          absentCount,
          attendancePercentage,
          takenBy: record.takenBy.name,
          records: formattedRecords,
          createdAt: record.createdAt
        };
      });

      res.status(200).json({
        success: true,
        message: 'Class history retrieved successfully',
        data: {
          classes: classHistory,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalRecords / limit),
            totalRecords,
            hasNext: page * limit < totalRecords,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get class history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve class history'
      });
    }
  },

  // Get attendance status for a specific date
  getAttendanceStatus: async (req, res) => {
    try {
      const teacherId = req.user.id;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date parameter is required'
        });
      }

      // Get all attendance records for this teacher on the specified date
      const attendanceRecords = await Attendance.find({
        takenBy: teacherId,
        date: {
          $gte: new Date(date),
          $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('batch', 'name');

      // Create a map of attendance status by subject-batch-time combination
      const attendanceStatus = {};
      attendanceRecords.forEach(record => {
        // Use the same key format as frontend: subject-batchId-startTime
        const key = `${record.subject}-${record.batch._id}-${record.classTime}`;
        attendanceStatus[key] = true;
      });

      res.status(200).json({
        success: true,
        message: 'Attendance status retrieved successfully',
        data: {
          attendanceStatus,
          totalClasses: attendanceRecords.length
        }
      });

    } catch (error) {
      console.error('Get attendance status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance status'
      });
    }
  }
};

// Student Controllers
const studentControllers = {
  // Get student's own attendance
  getMyAttendance: async (req, res) => {
    try {
      const studentId = req.user.id;
      const { subject, startDate, endDate } = req.query;

      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Build query for Attendance model
      let query = {
        'records.studentId': studentId
      };

      if (subject) {
        query.subject = subject;
      }

      if (startDate && endDate) {
        query.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      // Get attendance records from Attendance model
      const attendanceRecords = await Attendance.find(query)
        .populate('takenBy', 'name')
        .sort({ date: -1, classTime: -1 });

      // Process the records to get student-specific data
      const detailedRecords = [];
      attendanceRecords.forEach(record => {
        const studentRecord = record.records.find(r => r.studentId && r.studentId.toString() === studentId);
        if (studentRecord) {
          detailedRecords.push({
            id: record._id,
            subject: record.subject,
            date: record.date,
            classTime: record.classTime,
            status: studentRecord.status,
            markedBy: record.takenBy.name,
            createdAt: record.createdAt
          });
        }
      });

      // Calculate subject-wise summary from Attendance model
      const subjectSummary = await calculateStudentAttendanceSummary(studentId);

      res.status(200).json({
        success: true,
        message: 'Attendance retrieved successfully',
        data: {
          student: {
            name: student.name,
            rno: student.rno,
            email: student.email
          },
          subjectSummary,
          detailedRecords
        }
      });

    } catch (error) {
      console.error('Get student attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance'
      });
    }
  },

  // Get attendance summary by subject
  getAttendanceSummary: async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Calculate summary from Attendance model
      const summary = await calculateStudentAttendanceSummary(studentId);

      res.status(200).json({
        success: true,
        message: 'Attendance summary retrieved successfully',
        data: {
          student: {
            name: student.name,
            rno: student.rno
          },
          summary
        }
      });

    } catch (error) {
      console.error('Get attendance summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve attendance summary'
      });
    }
  }
};

// Helper function to update student attendance records
const updateStudentAttendanceRecords = async (records, subject, date, teacherId) => {
  try {
    for (const record of records) {
      const student = await Student.findById(record.studentId);
      if (student) {
        // Remove existing attendance record for the same date and subject
        student.attendance = student.attendance.filter(
          att => !(att.subject === subject && 
                  att.date.toDateString() === new Date(date).toDateString())
        );

        // Add new attendance record
        student.attendance.push({
          subject,
          date: new Date(date),
          status: record.status,
          markedBy: teacherId
        });

        await student.save();
      }
    }
  } catch (error) {
    console.error('Error updating student attendance records:', error);
    throw error;
  }
};

// Helper function to calculate student attendance summary from Attendance model
const calculateStudentAttendanceSummary = async (studentId) => {
  try {
    // Get all attendance records for this student
    const attendanceRecords = await Attendance.find({
      'records.studentId': studentId
    });

    // Group by subject
    const subjectStats = {};
    
    attendanceRecords.forEach(record => {
      const studentRecord = record.records.find(r => r.studentId && r.studentId.toString() === studentId);
      if (studentRecord) {
        const subject = record.subject;
        
        if (!subjectStats[subject]) {
          subjectStats[subject] = {
            totalClasses: 0,
            presentClasses: 0
          };
        }
        
        subjectStats[subject].totalClasses++;
        if (studentRecord.status === 'present') {
          subjectStats[subject].presentClasses++;
        }
      }
    });

    // Convert to array format
    const summary = Object.entries(subjectStats).map(([subject, stats]) => ({
      subject,
      totalClasses: stats.totalClasses,
      presentClasses: stats.presentClasses,
      percentage: stats.totalClasses > 0 ? Math.round((stats.presentClasses / stats.totalClasses) * 100) : 0
    }));

    return summary;
  } catch (error) {
    console.error('Error calculating student attendance summary:', error);
    return [];
  }
};

module.exports = {
  teacherControllers,
  studentControllers
};
