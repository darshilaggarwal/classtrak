const { verifyToken } = require('../utils/jwt');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Admin = require('../models/Admin'); // Added Admin model import
const jwt = require('jsonwebtoken'); // Added jwt import

// General authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Student authentication middleware
const authenticateStudent = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Student role required.'
      });
    }

    const student = await Student.findById(decoded.id);
    if (!student) {
      return res.status(401).json({
        success: false,
        message: 'Student not found'
      });
    }

    req.user = decoded;
    req.student = student;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Teacher authentication middleware
const authenticateTeacher = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);
    
    if (decoded.role !== 'teacher') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Teacher role required.'
      });
    }

    const teacher = await Teacher.findById(decoded.id).populate('subjects', 'name');
    if (!teacher) {
      return res.status(401).json({
        success: false,
        message: 'Teacher not found'
      });
    }

    req.user = decoded;
    req.teacher = teacher;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Subject authorization middleware for teachers
const authorizeSubject = async (req, res, next) => {
  // Get subject from request body
  const requestSubject = req.body.subject;
  const requestDate = req.body.date;
  const requestBatch = req.body.batch;
  
  if (!requestSubject) {
    return res.status(400).json({
      success: false,
      message: 'Subject is required in request body.'
    });
  }
  
  // Get teacher's subjects (populate if needed)
  const teacherSubjects = req.teacher.subjects || [];
  const subjectNames = teacherSubjects.map(sub => 
    typeof sub === 'string' ? sub : sub.name
  );
  
  console.log(`🔐 Subject Authorization Check:`);
  console.log(`   Request Subject: ${requestSubject}`);
  console.log(`   Request Date: ${requestDate}`);
  console.log(`   Request Batch: ${requestBatch}`);
  console.log(`   Teacher Subjects: ${subjectNames.join(', ')}`);
  console.log(`   Teacher: ${req.teacher.name}`);
  
  // Check if teacher can teach this subject
  const canTeachSubject = subjectNames.includes(requestSubject);
  
  // If teacher can't teach the subject, check for substitution rights
  if (!canTeachSubject) {
    if (requestDate && requestBatch) {
      const Substitution = require('../models/Substitution');
      const substitutionRights = await Substitution.findOne({
        substituteTeacher: req.teacher._id,
        date: new Date(requestDate),
        batch: requestBatch,
        status: 'approved'
      }).populate('subject');
      
      const hasSubstitutionRights = substitutionRights && substitutionRights.subject.name === requestSubject;
      
      console.log(`🔄 Substitution check:`, {
        hasSubstitutionRights,
        substitutionSubject: substitutionRights?.subject?.name,
        substitutionDate: substitutionRights?.date
      });
      
      if (hasSubstitutionRights) {
        console.log(`🔐 Subject Authorization: Teacher ${req.teacher.name} authorized for ${requestSubject} via substitution`);
        return next();
      }
    }
    
    return res.status(403).json({
      success: false,
      message: `Access denied. You can only mark attendance for your assigned subjects: ${subjectNames.join(', ')}`
    });
  }
  
  console.log(`🔐 Subject Authorization: Teacher ${req.teacher.name} authorized for ${requestSubject}`);
  
  next();
};

// Admin authentication middleware
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Admin not found or inactive.'
      });
    }

    req.user = admin;
    req.userType = 'admin';
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

module.exports = {
  authenticate,
  authenticateStudent,
  authenticateTeacher,
  authorizeSubject,
  authenticateAdmin
};
