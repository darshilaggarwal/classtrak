const express = require('express');
const router = express.Router();
const { authenticateTeacher } = require('../middleware/auth');
const teacherController = require('../controllers/teacherController');

// Apply teacher authentication to all routes
router.use(authenticateTeacher);

// Teacher Profile
router.get('/profile', teacherController.getMyProfile);

// Teacher's Batches
router.get('/batches', teacherController.getMyBatches);

// Teacher's Subjects
router.get('/subjects', teacherController.getMySubjects);

// Teacher's Schedule
router.get('/schedule/:teacherId', teacherController.getTeacherSchedule);

// Teacher's Batches by ID
router.get('/batches/:teacherId', teacherController.getTeacherBatches);

// Teacher's Subjects by ID
router.get('/subjects/:teacherId', teacherController.getTeacherSubjects);

module.exports = router;
