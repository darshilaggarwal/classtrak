const express = require('express');
const router = express.Router();
const timetableController = require('../controllers/timetableController');
const { authenticateAdmin, authenticateTeacher, authenticate } = require('../middleware/auth');

// Admin routes (temporarily without auth for testing)
router.get('/admin/all', timetableController.getAllTimetables);
router.post('/admin/import', timetableController.importTimetables);
router.post('/admin/save', timetableController.createOrUpdateTimetable);
router.delete('/admin/batch/:batchName', timetableController.deleteTimetablesByBatch);
router.delete('/admin/:batchId/:dayOfWeek', timetableController.deleteTimetable);
router.put('/admin/edit-slot', timetableController.editTimeSlot);
router.get('/admin/batch/:batchId/subjects', timetableController.getBatchSubjects);

// Teacher routes
router.get('/teacher/:teacherId/schedule', authenticateTeacher, timetableController.getTeacherDailySchedule);

// Common routes
router.get('/batch/:batchId/day/:dayOfWeek', authenticate, timetableController.getTimetableByBatchAndDay);
router.get('/batch/:batchId/:dayOfWeek', authenticate, timetableController.getTimetableByBatchAndDay);

module.exports = router;
