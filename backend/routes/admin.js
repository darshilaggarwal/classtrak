const express = require('express');
const router = express.Router();
const { authenticateAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// Apply admin authentication to all routes
router.use(authenticateAdmin);

// Dashboard Overview
router.get('/overview', adminController.getOverview);

// Department Management
router.get('/departments', adminController.getDepartments);
router.post('/departments', adminController.createDepartment);
router.put('/departments/:id', adminController.updateDepartment);
router.delete('/departments/:id', adminController.deleteDepartment);

// Batch Management
router.get('/batches', adminController.getBatches);
router.post('/batches', adminController.createBatch);
router.put('/batches/:id', adminController.updateBatch);
router.delete('/batches/:id', adminController.deleteBatch);

// Subject Management
router.get('/subjects', adminController.getSubjects);
router.post('/subjects', adminController.createSubject);
router.put('/subjects/:id', adminController.updateSubject);
router.delete('/subjects/:id', adminController.deleteSubject);

// Teacher Management
router.get('/teachers', adminController.getTeachers);
router.get('/teachers/:id', adminController.getTeacherDetails);
router.post('/teachers', adminController.createTeacher);
router.put('/teachers/:id', adminController.updateTeacher);
router.delete('/teachers/:id', adminController.deleteTeacher);

// Student Management
router.get('/students', adminController.getStudents);
router.post('/students', adminController.createStudent);
router.put('/students/:id', adminController.updateStudent);
router.delete('/students/:id', adminController.deleteStudent);
router.post('/students/bulk-import', adminController.bulkImportStudents);

// Timetable Management
router.get('/timetables', adminController.getTimetables);
router.post('/timetables', adminController.createTimetable);
router.put('/timetables/:id', adminController.updateTimetable);
router.delete('/timetables/:id', adminController.deleteTimetable);

// Attendance Analytics
router.get('/attendance/overview', adminController.getAttendanceOverview);
router.get('/attendance/all', adminController.getAllAttendance);
router.get('/attendance/students/matrix', adminController.getStudentAttendanceMatrix);
router.get('/attendance/pdf', adminController.generateAttendancePDF);
router.get('/attendance/department/:departmentId', adminController.getDepartmentAttendance);
router.get('/attendance/batch/:batchId', adminController.getBatchAttendance);
router.get('/attendance/subject/:subjectId', adminController.getSubjectAttendance);

// Reports
router.get('/reports/attendance', adminController.generateAttendanceReport);
router.get('/reports/students', adminController.generateStudentReport);
router.get('/reports/teachers', adminController.generateTeacherReport);

// Bulk import routes
router.post('/import/students', authenticateAdmin, adminController.importStudents);
router.post('/import/teachers', authenticateAdmin, adminController.importTeachers);
router.get('/import/template/:type', authenticateAdmin, adminController.downloadTemplate);

module.exports = router;
