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

module.exports = router;
