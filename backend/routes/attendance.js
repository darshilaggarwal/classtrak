const express = require('express');
const router = express.Router();
const { teacherControllers, studentControllers } = require('../controllers/attendanceController');
const { authenticateTeacher, authenticateStudent, authorizeSubject } = require('../middleware/auth');
const { attendanceValidation } = require('../middleware/validation');
const { generateMonthlyReport } = require('../services/reportService');
const { generatePDFReport } = require('../utils/pdfGenerator');
const { generateExcelReport } = require('../utils/excelGenerator');

// Teacher Routes
router.get(
  '/teacher/students',
  authenticateTeacher,
  teacherControllers.getStudentsForAttendance
);

router.get(
  '/teacher/students/:batchId',
  authenticateTeacher,
  teacherControllers.getStudentsForBatch
);

router.get(
  '/teacher/students/batch/:batchName',
  authenticateTeacher,
  teacherControllers.getStudentsForBatchByName
);

router.get(
  '/teacher/batches',
  authenticateTeacher,
  teacherControllers.getTeacherBatches
);

router.post(
  '/teacher/mark',
  authenticateTeacher,
  attendanceValidation.markAttendance,
  authorizeSubject,
  teacherControllers.markAttendance
);

router.get(
  '/teacher/records',
  authenticateTeacher,
  teacherControllers.getAttendanceByDate
);

router.get(
  '/teacher/statistics',
  authenticateTeacher,
  teacherControllers.getAttendanceStatistics
);

router.get(
  '/teacher/history',
  authenticateTeacher,
  teacherControllers.getClassHistory
);

router.get(
  '/teacher/status',
  authenticateTeacher,
  teacherControllers.getAttendanceStatus
);

// Monthly Report Routes (Teacher Only)
router.get(
  '/teacher/reports/monthly',
  authenticateTeacher,
  async (req, res) => {
    try {
      const { month, year, subject, format = 'json' } = req.query;
      
      // Validate inputs
      if (!month || !year) {
        return res.status(400).json({
          success: false,
          message: 'Month and year are required'
        });
      }

      console.log(`Teacher ${req.teacher.name} requesting monthly report for ${month}/${year}, subject: ${subject || 'all'}`);

      const reportData = await generateMonthlyReport(month, year, subject);
      
      if (format === 'pdf') {
        const pdfBuffer = await generatePDFReport(reportData);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${month}-${year}.pdf`);
        return res.send(pdfBuffer);
      }
      
      if (format === 'excel') {
        const excelBuffer = await generateExcelReport(reportData);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance-${month}-${year}.xlsx`);
        return res.send(excelBuffer);
      }
      
      res.json({
        success: true,
        data: reportData
      });
    } catch (error) {
      console.error('Monthly report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate monthly report'
      });
    }
  }
);

// Get distinct subjects (Teacher Only)
router.get(
  '/teacher/subjects',
  authenticateTeacher,
  async (req, res) => {
    try {
      const Attendance = require('../models/Attendance');
      const subjects = await Attendance.distinct('subject');
      
      res.json({
        success: true,
        data: subjects.sort()
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects'
      });
    }
  }
);

// Student Routes
router.get(
  '/student/my-attendance',
  authenticateStudent,
  studentControllers.getMyAttendance
);

router.get(
  '/student/summary',
  authenticateStudent,
  studentControllers.getAttendanceSummary
);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attendance service is healthy',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
