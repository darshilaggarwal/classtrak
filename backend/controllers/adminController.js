const Department = require('../models/Department');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Timetable = require('../models/Timetable');
const Attendance = require('../models/Attendance');
const bcrypt = require('bcryptjs');

// Helper function to ensure ONLY the correct running batches exist (15 exact batches)
const ensureRequiredBatchesExist = async () => {
  // EXACT running batches in your university (odd semester)
  const runningBatches = [
    // BTech AIML - sem 1,3,5,7
    { name: 'BTech AIML 1st Sem (2025-29)', course: 'BTech AIML', year: 2025 },
    { name: 'BTech AIML 3rd Sem (2024-28)', course: 'BTech AIML', year: 2024 },
    { name: 'BTech AIML 5th Sem (2023-27)', course: 'BTech AIML', year: 2023 },
    { name: 'BTech AIML 7th Sem (2022-26)', course: 'BTech AIML', year: 2022 },
    // BTech FSD - sem 5 ONLY
    { name: 'BTech FSD 5th Sem (2023-27)', course: 'BTech FSD', year: 2023 },
    // BCA FSD - sem 1,3,5
    { name: 'BCA FSD 1st Sem (2025-28)', course: 'BCA FSD', year: 2025 },
    { name: 'BCA FSD 3rd Sem (2024-27)', course: 'BCA FSD', year: 2024 },
    { name: 'BCA FSD 5th Sem (2023-26)', course: 'BCA FSD', year: 2023 },
    // BBA DM - sem 1,3,5C,5D
    { name: 'BBA DM 1st Sem (2025-28)', course: 'BBA DM', year: 2025 },
    { name: 'BBA DM 3rd Sem (2024-27)', course: 'BBA DM', year: 2024 },
    { name: 'BBA DM 5th Sem C (2023-26)', course: 'BBA DM', year: 2023 },
    { name: 'BBA DM 5th Sem D (2023-26)', course: 'BBA DM', year: 2023 },
    // BDes - sem 1,5,7
    { name: 'BDes 1st Sem (2025-28)', course: 'BDes', year: 2025 },
    { name: 'BDes 5th Sem (2023-26)', course: 'BDes', year: 2023 },
    { name: 'BDes 7th Sem (2022-25)', course: 'BDes', year: 2022 }
  ];

  const departments = await Department.find({ isActive: true });
  const deptMap = {};
  departments.forEach(dept => { deptMap[dept.name] = dept._id; });

  for (const batchData of runningBatches) {
    const exists = await Batch.findOne({ name: batchData.name });
    if (!exists && deptMap[batchData.course]) {
      await new Batch({ 
        name: batchData.name, 
        department: deptMap[batchData.course], 
        year: batchData.year, 
        isActive: true 
      }).save();
      console.log(`📚 Auto-created batch: ${batchData.name}`);
    }
  }
};

const adminController = {
  // Dashboard Overview
  getOverview: async (req, res) => {
    try {
      const [
        totalStudents,
        totalTeachers,
        totalSubjects,
        totalDepartments,
        totalBatches,
        todayAttendance
      ] = await Promise.all([
        Student.countDocuments({ isActive: true }),
        Teacher.countDocuments({ isActive: true }),
        Subject.countDocuments({ isActive: true }),
        Department.countDocuments({ isActive: true }),
        Batch.countDocuments({ isActive: true }),
        Attendance.countDocuments({ 
          date: { 
            $gte: new Date().setHours(0, 0, 0, 0),
            $lt: new Date().setHours(23, 59, 59, 999)
          }
        })
      ]);

      // Get department-wise breakdown
      const departments = await Department.find({ isActive: true });
      const departmentStats = await Promise.all(
        departments.map(async (dept) => {
          const studentCount = await Student.countDocuments({ 
            department: dept._id, 
            isActive: true 
          });
          const batchCount = await Batch.countDocuments({ 
            department: dept._id, 
            isActive: true 
          });
          return {
            name: dept.name,
            students: studentCount,
            batches: batchCount
          };
        })
      );

      res.status(200).json({
        success: true,
        data: {
          totalStudents,
          totalTeachers,
          totalSubjects,
          totalDepartments,
          totalBatches,
          todayAttendance,
          departmentStats
        }
      });
    } catch (error) {
      console.error('Admin overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overview data'
      });
    }
  },

  // Department Management
  getDepartments: async (req, res) => {
    try {
      const departments = await Department.find({ isActive: true });
      
      // Calculate real-time counts for each department
      const departmentsWithCounts = await Promise.all(
        departments.map(async (dept) => {
          const [totalStudents, totalBatches, totalTeachers] = await Promise.all([
            Student.countDocuments({ 
              department: dept._id, 
              isActive: true 
            }),
            Batch.countDocuments({ 
              department: dept._id, 
              isActive: true 
            }),
            Teacher.countDocuments({ 
              courses: dept._id, 
              isActive: true 
            })
          ]);

          return {
            ...dept.toObject(),
            totalStudents,
            totalBatches,
            totalTeachers
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: departmentsWithCounts
      });
    } catch (error) {
      console.error('Get departments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch departments'
      });
    }
  },

  createDepartment: async (req, res) => {
    try {
      const { name, code, description } = req.body;
      
      const department = new Department({
        name,
        code: code.toUpperCase(),
        description
      });

      await department.save();

      res.status(201).json({
        success: true,
        message: 'Department created successfully',
        data: department
      });
    } catch (error) {
      console.error('Create department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create department'
      });
    }
  },

  updateDepartment: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const department = await Department.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Department updated successfully',
        data: department
      });
    } catch (error) {
      console.error('Update department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update department'
      });
    }
  },

  deleteDepartment: async (req, res) => {
    try {
      const { id } = req.params;

      const department = await Department.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!department) {
        return res.status(404).json({
          success: false,
          message: 'Department not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Department deleted successfully'
      });
    } catch (error) {
      console.error('Delete department error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete department'
      });
    }
  },

  // Batch Management
  getBatches: async (req, res) => {
    try {
      const batches = await Batch.find({ isActive: true })
        .populate('department', 'name code');
      
      // Calculate real-time student counts for each batch
      const batchesWithCounts = await Promise.all(
        batches.map(async (batch) => {
          const totalStudents = await Student.countDocuments({ 
            batch: batch._id, 
            isActive: true 
          });

          return {
            ...batch.toObject(),
            totalStudents
          };
        })
      );
      
      res.status(200).json({
        success: true,
        data: batchesWithCounts
      });
    } catch (error) {
      console.error('Get batches error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batches'
      });
    }
  },

  createBatch: async (req, res) => {
    try {
      const { name, year, department, description } = req.body;
      
      const batch = new Batch({
        name,
        year,
        department,
        description
      });

      await batch.save();

      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        data: batch
      });
    } catch (error) {
      console.error('Create batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create batch'
      });
    }
  },

  updateBatch: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const batch = await Batch.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Batch updated successfully',
        data: batch
      });
    } catch (error) {
      console.error('Update batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update batch'
      });
    }
  },

  deleteBatch: async (req, res) => {
    try {
      const { id } = req.params;

      const batch = await Batch.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Batch not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Batch deleted successfully'
      });
    } catch (error) {
      console.error('Delete batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete batch'
      });
    }
  },

  // Subject Management
  getSubjects: async (req, res) => {
    try {
      const subjects = await Subject.find({ isActive: true })
        .populate('department', 'name code')
        .populate('batches', 'name');
      
      res.status(200).json({
        success: true,
        data: subjects
      });
    } catch (error) {
      console.error('Get subjects error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects'
      });
    }
  },

  createSubject: async (req, res) => {
    try {
      const { name, code, department, semester, credits, description } = req.body;
      
      const subject = new Subject({
        name,
        code: code.toUpperCase(),
        department,
        semester,
        credits,
        description
      });

      await subject.save();

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: subject
      });
    } catch (error) {
      console.error('Create subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subject'
      });
    }
  },

  updateSubject: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const subject = await Subject.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Subject updated successfully',
        data: subject
      });
    } catch (error) {
      console.error('Update subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subject'
      });
    }
  },

  deleteSubject: async (req, res) => {
    try {
      const { id } = req.params;

      const subject = await Subject.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Delete subject error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject'
      });
    }
  },

  // Teacher Management
  getTeachers: async (req, res) => {
    try {
      const teachers = await Teacher.find({ isActive: true })
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        })
        .populate('courses', 'name code')
        .select('-password');

      // Get all batches for reference
      const Batch = require('../models/Batch');
      const allBatches = await Batch.find().populate('department', 'name');
      
      // Add batch information to each teacher's subjects
      const teachersWithBatches = teachers.map(teacher => {
        const teacherObj = teacher.toObject();
        
        if (teacherObj.subjects) {
          teacherObj.subjects = teacherObj.subjects.map(subject => {
            // Find batches that match this subject's department and semester
            const matchingBatches = allBatches.filter(batch => {
              // Check if department matches
              const deptMatches = batch.department._id.toString() === subject.department._id.toString();
              
              // Extract semester from batch name (e.g., "1st Sem", "3rd Sem", "5th Sem")
              const semesterMatch = batch.name.match(/(\d+)(?:st|nd|rd|th)\s+Sem/);
              const batchSemester = semesterMatch ? parseInt(semesterMatch[1]) : null;
              
              return deptMatches && batchSemester === subject.semester;
            });
            
            return {
              ...subject,
              batches: matchingBatches.map(batch => ({
                _id: batch._id,
                name: batch.name,
                year: batch.year
              }))
            };
          });
        }
        
        return teacherObj;
      });
      
      res.status(200).json({
        success: true,
        data: teachersWithBatches
      });
    } catch (error) {
      console.error('Get teachers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teachers'
      });
    }
  },

  getTeacherDetails: async (req, res) => {
    try {
      const { id } = req.params;
      
      const teacher = await Teacher.findById(id)
        .populate('subjects', 'name code')
        .populate('courses', 'name code')
        .select('-password');
      
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
      console.error('Get teacher details error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch teacher details'
      });
    }
  },

  createTeacher: async (req, res) => {
    try {
      const { name, email, username, phone, subjects, course, password } = req.body;
      
      const teacher = new Teacher({
        name,
        email,
        username: username.toLowerCase(),
        phone,
        subjects,
        course,
        password,
        isFirstLogin: false,
        emailVerified: true
      });

      await teacher.save();

      res.status(201).json({
        success: true,
        message: 'Teacher created successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Create teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create teacher'
      });
    }
  },

  updateTeacher: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const teacher = await Teacher.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Teacher updated successfully',
        data: teacher
      });
    } catch (error) {
      console.error('Update teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update teacher'
      });
    }
  },

  deleteTeacher: async (req, res) => {
    try {
      const { id } = req.params;

      const teacher = await Teacher.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: 'Teacher not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Teacher deleted successfully'
      });
    } catch (error) {
      console.error('Delete teacher error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete teacher'
      });
    }
  },

  // Student Management
  getStudents: async (req, res) => {
    try {
      const { page = 1, limit = 50, department, batch, search } = req.query;
      
      console.log('🔍 Student search request:', { page, limit, department, batch, search });
      
      let query = { isActive: true };
      
      if (department) query.department = department;
      if (batch) query.batch = batch;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { rno: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      console.log('🔍 Final query:', JSON.stringify(query, null, 2));

      const students = await Student.find(query)
        .populate('department', 'name code')
        .populate('batch', 'name year')
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });

      const total = await Student.countDocuments(query);

      console.log(`🔍 Found ${students.length} students out of ${total} total`);

      res.status(200).json({
        success: true,
        data: {
          students,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
          total
        }
      });
    } catch (error) {
      console.error('Get students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch students'
      });
    }
  },

  createStudent: async (req, res) => {
    try {
      const { 
        name, 
        email, 
        rno, 
        phone, 
        courseName, 
        courseDuration, 
        batch, 
        department, 
        semester 
      } = req.body;
      
      // Check if student with same email or roll number already exists
      const existingStudent = await Student.findOne({
        $or: [{ email }, { rno }]
      });

      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: existingStudent.email === email 
            ? 'Student with this email already exists' 
            : 'Student with this enrollment number already exists'
        });
      }

      const student = new Student({
        name,
        email,
        rno,
        phone,
        courseName,
        courseDuration,
        batch,
        department,
        semester,
        isFirstLogin: true,
        emailVerified: false
      });

      await student.save();

      res.status(201).json({
        success: true,
        message: 'Student created successfully',
        data: student
      });
    } catch (error) {
      console.error('Create student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create student'
      });
    }
  },

  updateStudent: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const student = await Student.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).select('-password');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Student updated successfully',
        data: student
      });
    } catch (error) {
      console.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update student'
      });
    }
  },

  deleteStudent: async (req, res) => {
    try {
      const { id } = req.params;

      const student = await Student.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      console.error('Delete student error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete student'
      });
    }
  },

  bulkImportStudents: async (req, res) => {
    try {
      const { students } = req.body;
      
      const createdStudents = [];
      const errors = [];

      for (const studentData of students) {
        try {
          const student = new Student({
            ...studentData,
            isFirstLogin: true,
            emailVerified: false
          });
          await student.save();
          createdStudents.push(student);
        } catch (error) {
          errors.push({
            student: studentData,
            error: error.message
          });
        }
      }

      res.status(201).json({
        success: true,
        message: `Successfully created ${createdStudents.length} students`,
        data: {
          created: createdStudents.length,
          errors: errors.length,
          errorDetails: errors
        }
      });
    } catch (error) {
      console.error('Bulk import students error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import students'
      });
    }
  },

  // Timetable Management
  getTimetables: async (req, res) => {
    try {
      const timetables = await Timetable.find({ isActive: true })
        .populate('department', 'name code')
        .populate('batch', 'name year')
        .populate('createdBy', 'name');
      
      res.status(200).json({
        success: true,
        data: timetables
      });
    } catch (error) {
      console.error('Get timetables error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch timetables'
      });
    }
  },

  createTimetable: async (req, res) => {
    try {
      const { name, department, batch, semester, academicYear, entries } = req.body;
      
      const timetable = new Timetable({
        name,
        department,
        batch,
        semester,
        academicYear,
        entries,
        createdBy: req.user.id
      });

      await timetable.save();

      res.status(201).json({
        success: true,
        message: 'Timetable created successfully',
        data: timetable
      });
    } catch (error) {
      console.error('Create timetable error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create timetable'
      });
    }
  },

  updateTimetable: async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const timetable = await Timetable.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: 'Timetable not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Timetable updated successfully',
        data: timetable
      });
    } catch (error) {
      console.error('Update timetable error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update timetable'
      });
    }
  },

  deleteTimetable: async (req, res) => {
    try {
      const { id } = req.params;

      const timetable = await Timetable.findByIdAndUpdate(
        id,
        { isActive: false },
        { new: true }
      );

      if (!timetable) {
        return res.status(404).json({
          success: false,
          message: 'Timetable not found'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Timetable deleted successfully'
      });
    } catch (error) {
      console.error('Delete timetable error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete timetable'
      });
    }
  },

  // Attendance Analytics
  getAttendanceOverview: async (req, res) => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
      const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));

      const [monthlyAttendance, weeklyAttendance, totalClasses, averageAttendance, totalStudents] = await Promise.all([
        Attendance.countDocuments({
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Attendance.countDocuments({
          date: { $gte: startOfWeek, $lte: endOfWeek }
        }),
        Attendance.countDocuments(),
        Attendance.aggregate([
          {
            $group: {
              _id: null,
              avgAttendance: { $avg: { $size: "$records" } }
            }
          }
        ]),
        Student.countDocuments({ isActive: true })
      ]);

      res.status(200).json({
        success: true,
        data: {
          monthlyAttendance,
          weeklyAttendance,
          totalClasses,
          averageAttendance: Math.round(averageAttendance[0]?.avgAttendance || 0),
          totalStudents
        }
      });
    } catch (error) {
      console.error('Attendance overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance overview'
      });
    }
  },

  // Get all attendance records for admin view
  getAllAttendance: async (req, res) => {
    try {
      const { startDate, endDate, departmentId, batchId } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      let query = { ...dateFilter };
      
      // If department filter is applied
      if (departmentId) {
        const students = await Student.find({ department: departmentId }).select('_id');
        const studentIds = students.map(s => s._id);
        query['records.studentId'] = { $in: studentIds };
      }

      // If batch filter is applied
      if (batchId) {
        const students = await Student.find({ batch: batchId }).select('_id');
        const studentIds = students.map(s => s._id);
        query['records.studentId'] = { $in: studentIds };
      }

      const attendance = await Attendance.find(query)
        .populate('batch', 'name')
        .populate('takenBy', 'name')
        .populate('records.studentId', 'name rno')
        .sort({ date: -1, classTime: -1 })
        .limit(100);

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Get all attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch attendance records'
      });
    }
  },

  getDepartmentAttendance: async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      // Get students in this department
      const students = await Student.find({ department: departmentId }).select('_id');
      const studentIds = students.map(s => s._id);

      const attendance = await Attendance.find({
        ...dateFilter,
        'records.studentId': { $in: studentIds }
      })
      .populate('batch', 'name')
      .populate('takenBy', 'name')
      .populate('records.studentId', 'name rno')
      .sort({ date: -1, classTime: -1 });

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Department attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department attendance'
      });
    }
  },

  getBatchAttendance: async (req, res) => {
    try {
      const { batchId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      // Get students in this batch
      const students = await Student.find({ batch: batchId }).select('_id');
      const studentIds = students.map(s => s._id);

      const attendance = await Attendance.find({
        ...dateFilter,
        'records.studentId': { $in: studentIds }
      })
      .populate('batch', 'name')
      .populate('takenBy', 'name')
      .populate('records.studentId', 'name rno')
      .sort({ date: -1, classTime: -1 });

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Batch attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch batch attendance'
      });
    }
  },

  getSubjectAttendance: async (req, res) => {
    try {
      const { subjectId } = req.params;
      const { startDate, endDate } = req.query;

      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      const attendance = await Attendance.find({
        subject: subjectId,
        ...dateFilter
      }).populate('records.studentId', 'name rno');

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Subject attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject attendance'
      });
    }
  },

  // Reports
  generateAttendanceReport: async (req, res) => {
    try {
      const { startDate, endDate, department, batch, subject } = req.query;

      let query = {};
      if (startDate && endDate) {
        query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
      }
      if (subject) query.subject = subject;

      const attendance = await Attendance.find(query)
        .populate('records.studentId', 'name rno')
        .populate('takenBy', 'name');

      res.status(200).json({
        success: true,
        data: attendance
      });
    } catch (error) {
      console.error('Generate attendance report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate attendance report'
      });
    }
  },

  generateStudentReport: async (req, res) => {
    try {
      const { department, batch, semester } = req.query;

      let query = { isActive: true };
      if (department) query.department = department;
      if (batch) query.batch = batch;
      if (semester) query.semester = semester;

      const students = await Student.find(query)
        .populate('department', 'name code')
        .populate('batch', 'name year')
        .select('-password');

      res.status(200).json({
        success: true,
        data: students
      });
    } catch (error) {
      console.error('Generate student report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate student report'
      });
    }
  },

  generateTeacherReport: async (req, res) => {
    try {
      const { department } = req.query;

      let query = { isActive: true };
      if (department) query.departments = department;

      const teachers = await Teacher.find(query)
        .populate('subjects', 'name code')
        .populate('departments', 'name code')
        .select('-password');

      res.status(200).json({
        success: true,
        data: teachers
      });
    } catch (error) {
      console.error('Generate teacher report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate teacher report'
      });
    }
  },

  // Get student-wise attendance matrix
  getStudentAttendanceMatrix: async (req, res) => {
    try {
      const { startDate, endDate, departmentId, batchId } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      // Get all students with filters
      let studentQuery = { isActive: true };
      if (departmentId) {
        studentQuery.department = departmentId;
      }
      if (batchId) {
        studentQuery.batch = batchId;
      }

      const students = await Student.find(studentQuery)
        .populate('department', 'name')
        .populate('batch', 'name')
        .sort({ name: 1 });

      // Get all attendance records in the date range
      const attendanceRecords = await Attendance.find(dateFilter)
        .populate('batch', 'name')
        .populate('records.studentId', 'name rno')
        .sort({ date: 1 });

      // Get all unique subjects
      const subjects = [...new Set(attendanceRecords.map(record => record.subject))].sort();

      // Create student attendance matrix
      const studentMatrix = students.map(student => {
        const studentData = {
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rno,
          department: student.department?.name || 'N/A',
          batch: student.batch?.name || 'N/A',
          subjects: {},
          totalClasses: 0,
          totalPresent: 0,
          overallPercentage: 0
        };

        // Initialize subject attendance
        subjects.forEach(subject => {
          studentData.subjects[subject] = {
            totalClasses: 0,
            presentClasses: 0,
            percentage: 0
          };
        });

        // Calculate attendance for each subject
        attendanceRecords.forEach(record => {
          const studentRecord = record.records.find(r => {
            // Handle different types of studentId storage
            let studentIdStr;
            if (typeof r.studentId === 'object' && r.studentId !== null) {
              // If it's an ObjectId object, extract the actual ID
                          if (r.studentId && r.studentId.toString().includes('ObjectId')) {
              // Extract the ID from "new ObjectId('...')" format
              const match = r.studentId.toString().match(/ObjectId\('([^']+)'\)/);
              studentIdStr = match ? match[1] : r.studentId.toString();
              } else {
                studentIdStr = r.studentId.toString();
              }
            } else if (typeof r.studentId === 'string') {
              // Try to parse as JSON object first
              try {
                const parsed = JSON.parse(r.studentId);
                studentIdStr = parsed._id || r.studentId;
              } catch (e) {
                // If not JSON, use as is
                studentIdStr = r.studentId;
              }
            } else if (r.studentId !== null && r.studentId !== undefined) {
              studentIdStr = r.studentId.toString();
            } else {
              // Skip this record if studentId is null or undefined
              return false;
            }
            
            return studentIdStr === student._id.toString();
          });
          
          if (studentRecord) {
            const subject = record.subject;
            if (studentData.subjects[subject]) {
              studentData.subjects[subject].totalClasses++;
              if (studentRecord.status === 'present') {
                studentData.subjects[subject].presentClasses++;
              }
            }
          }
        });

        // Calculate percentages for each subject
        subjects.forEach(subject => {
          const subjectData = studentData.subjects[subject];
          subjectData.percentage = subjectData.totalClasses > 0 
            ? Math.round((subjectData.presentClasses / subjectData.totalClasses) * 100) 
            : 0;
        });

        // Calculate overall attendance
        const totalClasses = Object.values(studentData.subjects)
          .reduce((sum, subject) => sum + subject.totalClasses, 0);
        const totalPresent = Object.values(studentData.subjects)
          .reduce((sum, subject) => sum + subject.presentClasses, 0);

        studentData.totalClasses = totalClasses;
        studentData.totalPresent = totalPresent;
        studentData.overallPercentage = totalClasses > 0 
          ? Math.round((totalPresent / totalClasses) * 100) 
          : 0;

        return studentData;
      });

      res.status(200).json({
        success: true,
        data: {
          students: studentMatrix,
          subjects: subjects,
          totalStudents: students.length,
          dateRange: { startDate, endDate }
        }
      });
    } catch (error) {
      console.error('Student attendance matrix error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch student attendance matrix'
      });
    }
  },

  // Generate PDF data for student attendance matrix
  generateAttendancePDF: async (req, res) => {
    try {
      const { startDate, endDate, departmentId, batchId } = req.query;
      
      let dateFilter = {};
      if (startDate && endDate) {
        dateFilter = {
          date: { $gte: new Date(startDate), $lte: new Date(endDate) }
        };
      }

      // Get all students with filters
      let studentQuery = { isActive: true };
      if (departmentId) {
        studentQuery.department = departmentId;
      }
      if (batchId) {
        studentQuery.batch = batchId;
      }

      const students = await Student.find(studentQuery)
        .populate('department', 'name')
        .populate('batch', 'name')
        .sort({ name: 1 });

      // Get all attendance records in the date range
      const attendanceRecords = await Attendance.find(dateFilter)
        .populate('batch', 'name')
        .populate('records.studentId', 'name rno')
        .sort({ date: 1 });

      // Get all unique subjects
      const subjects = [...new Set(attendanceRecords.map(record => record.subject))].sort();

      // Create student attendance matrix (same logic as above)
      const studentMatrix = students.map(student => {
        const studentData = {
          studentId: student._id,
          studentName: student.name,
          rollNumber: student.rno,
          department: student.department?.name || 'N/A',
          batch: student.batch?.name || 'N/A',
          subjects: {},
          totalClasses: 0,
          totalPresent: 0,
          overallPercentage: 0
        };

        // Initialize subject attendance
        subjects.forEach(subject => {
          studentData.subjects[subject] = {
            totalClasses: 0,
            presentClasses: 0,
            percentage: 0
          };
        });

        // Calculate attendance for each subject
        attendanceRecords.forEach(record => {
          const studentRecord = record.records.find(r => {
            // Handle different types of studentId storage
            let studentIdStr;
            if (typeof r.studentId === 'object' && r.studentId !== null) {
              // If it's an ObjectId object, extract the actual ID
                          if (r.studentId && r.studentId.toString().includes('ObjectId')) {
              // Extract the ID from "new ObjectId('...')" format
              const match = r.studentId.toString().match(/ObjectId\('([^']+)'\)/);
              studentIdStr = match ? match[1] : r.studentId.toString();
              } else {
                studentIdStr = r.studentId.toString();
              }
            } else if (typeof r.studentId === 'string') {
              // Try to parse as JSON object first
              try {
                const parsed = JSON.parse(r.studentId);
                studentIdStr = parsed._id || r.studentId;
              } catch (e) {
                // If not JSON, use as is
                studentIdStr = r.studentId;
              }
            } else if (r.studentId !== null && r.studentId !== undefined) {
              studentIdStr = r.studentId.toString();
            } else {
              // Skip this record if studentId is null or undefined
              return false;
            }
            
            return studentIdStr === student._id.toString();
          });
          
          if (studentRecord) {
            const subject = record.subject;
            if (studentData.subjects[subject]) {
              studentData.subjects[subject].totalClasses++;
              if (studentRecord.status === 'present') {
                studentData.subjects[subject].presentClasses++;
              }
            }
          }
        });

        // Calculate percentages for each subject
        subjects.forEach(subject => {
          const subjectData = studentData.subjects[subject];
          subjectData.percentage = subjectData.totalClasses > 0 
            ? Math.round((subjectData.presentClasses / subjectData.totalClasses) * 100) 
            : 0;
        });

        // Calculate overall attendance
        const totalClasses = Object.values(studentData.subjects)
          .reduce((sum, subject) => sum + subject.totalClasses, 0);
        const totalPresent = Object.values(studentData.subjects)
          .reduce((sum, subject) => sum + subject.presentClasses, 0);

        studentData.totalClasses = totalClasses;
        studentData.totalPresent = totalPresent;
        studentData.overallPercentage = totalClasses > 0 
          ? Math.round((totalPresent / totalClasses) * 100) 
          : 0;

        return studentData;
      });

      // Calculate summary statistics
      const totalStudents = students.length;
      const totalClasses = attendanceRecords.length;
      const averageAttendance = studentMatrix.length > 0 
        ? Math.round(studentMatrix.reduce((sum, student) => sum + student.overallPercentage, 0) / studentMatrix.length)
        : 0;

      // Generate PDF data
      const pdfData = {
        title: 'Student Attendance Matrix Report',
        dateRange: `${startDate || 'All Time'} to ${endDate || 'Present'}`,
        generatedAt: new Date().toLocaleDateString(),
        summary: {
          totalStudents,
          totalClasses,
          averageAttendance,
          totalSubjects: subjects.length
        },
        students: studentMatrix,
        subjects: subjects
      };

      res.status(200).json({
        success: true,
        data: pdfData
      });
    } catch (error) {
      console.error('Generate PDF error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF data'
      });
    }
  }
};

// Bulk Import Functions
const importStudents = async (req, res) => {
  try {
    const { students } = req.body;
    
    if (!students || !Array.isArray(students)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of students.'
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Helper function to map year to semester based on course duration
    const mapYearToSemester = (year, courseName) => {
      // Determine course duration based on course name
      const normalizedCourse = courseName.toLowerCase().trim();
      let maxSemesters = 8; // Default for 4-year courses
      let courseDuration = '4 years';
      
      // Course duration mapping for your university's programs
      if (normalizedCourse.includes('btech aiml') || 
          normalizedCourse.includes('btech fsd')) {
        // 4-year BTech programs
        maxSemesters = 8;
        courseDuration = '4 years';
      }
      else if (normalizedCourse.includes('bca fsd') || 
               normalizedCourse.includes('bba dm')) {
        // 3-year programs
        maxSemesters = 6;
        courseDuration = '3 years';
      }
      else if (normalizedCourse.includes('bdesign')) {
        // Design program (typically 4 years)
        maxSemesters = 8;
        courseDuration = '4 years';
      }
      
      if (typeof year === 'number') {
        // If year is a number (2023, 2024, 2025, etc.)
        const currentYear = new Date().getFullYear();
        const yearDiff = currentYear - year;
        
        // If year is current year or future year, it's 1st year (semester 1)
        if (yearDiff <= 0) {
          return { semester: 1, courseDuration };
        }
        
        // Calculate semester based on year difference
        const semester = Math.max(1, Math.min(maxSemesters, yearDiff * 2 + 1));
        return { semester, courseDuration };
      } else if (typeof year === 'string') {
        // If year is a string ("1st Year", "2nd Year", etc.)
        const yearMatch = year.match(/(\d+)/);
        if (yearMatch) {
          const yearNum = parseInt(yearMatch[1]);
          const semester = Math.max(1, Math.min(maxSemesters, yearNum * 2 - 1));
          return { semester, courseDuration };
        }
      }
      return { semester: 1, courseDuration }; // Default to semester 1
    };

    // Pre-process: Create departments and batches in bulk
    const departmentMap = new Map();
    const batchMap = new Map();
    
    // Your 5 courses - direct mapping
    const validCourses = [
      'BTech AIML',
      'BTech FSD', 
      'BCA FSD',
      'BBA DM',
      'BDesign'
    ];

    // Pre-create all needed courses and batches
    for (const studentData of students) {
      if (studentData.course) {
        // Validate course name
        if (validCourses.includes(studentData.course)) {
          const batchName = `${studentData.course} ${studentData.year}`;
          
          if (!departmentMap.has(studentData.course)) {
            departmentMap.set(studentData.course, null);
          }
          if (!batchMap.has(batchName)) {
            batchMap.set(batchName, { course: studentData.course, year: studentData.year });
          }
        }
      }
    }

    // Create courses as departments
    for (const [courseName] of departmentMap) {
      try {
        let department = await Department.findOne({ 
          name: courseName 
        });

        if (!department) {
          // Generate unique code based on course name
          let code;
          switch(courseName) {
            case 'BTech AIML':
              code = 'BTAIML';
              break;
            case 'BTech FSD':
              code = 'BTFSD';
              break;
            case 'BCA FSD':
              code = 'BCAFSD';
              break;
            case 'BBA DM':
              code = 'BBADM';
              break;
            case 'BDesign':
              code = 'BDES';
              break;
            default:
              code = courseName.substring(0, 6).toUpperCase();
          }
          
          department = new Department({
            name: courseName,
            code: code,
            description: `${courseName} Course`,
            isActive: true
          });
          await department.save();
        }
        departmentMap.set(courseName, department._id);
      } catch (error) {
        console.error(`Failed to create course: ${courseName}`, error);
      }
    }

    // Create batches
    for (const [batchName, batchInfo] of batchMap) {
      try {
        const departmentId = departmentMap.get(batchInfo.course);
        if (!departmentId) continue;

        let batch = await Batch.findOne({ 
          name: batchName 
        });

        if (!batch) {
          batch = new Batch({
            name: batchName,
            department: departmentId,
            year: batchInfo.year,
            description: `${batchName} Batch`,
            isActive: true
          });
          await batch.save();
        }
        batchMap.set(batchName, batch._id);
      } catch (error) {
        console.error(`Failed to create batch: ${batchName}`, error);
      }
    }

    // Process students
    for (const studentData of students) {
      try {
        // Validate required fields
        if (!studentData.name || !studentData.email || !studentData.rno) {
          results.failed++;
          const missingFields = [];
          if (!studentData.name) missingFields.push('name');
          if (!studentData.email) missingFields.push('email');
          if (!studentData.rno) missingFields.push('rno');
          results.errors.push(`Student ${studentData.name || 'Unknown'}: Missing required fields (${missingFields.join(', ')})`);
          continue;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentData.email)) {
          results.failed++;
          results.errors.push(`Student ${studentData.name}: Invalid email format (${studentData.email})`);
          continue;
        }

        // Check if student already exists
        const existingStudent = await Student.findOne({ 
          $or: [{ email: studentData.email }, { rno: studentData.rno }] 
        });

        if (existingStudent) {
          results.failed++;
          const duplicateField = existingStudent.email === studentData.email ? 'email' : 'enrollment number';
          results.errors.push(`Student ${studentData.name}: Already exists (duplicate ${duplicateField}: ${studentData.email || studentData.rno})`);
          continue;
        }

        // Validate course name
        if (!studentData.course) {
          results.failed++;
          results.errors.push(`Student ${studentData.name}: Missing course name`);
          continue;
        }

        // Get pre-created course and batch IDs
        const batchName = `${studentData.course} ${studentData.year}`;
        
        const departmentId = departmentMap.get(studentData.course);
        const batchId = batchMap.get(batchName);

        if (!departmentId || !batchId) {
          results.failed++;
          results.errors.push(`Student ${studentData.name}: Failed to map course to department/batch`);
          continue;
        }

        // Auto-map year to semester
        const semesterData = mapYearToSemester(studentData.year, studentData.course);

        // Hash password
        const hashedPassword = await bcrypt.hash('student123', 12);

        // Create student with mapped data
        const student = new Student({
          name: studentData.name,
          email: studentData.email,
          rno: studentData.rno,
          phone: studentData.phone || '',
          password: hashedPassword,
          courseName: studentData.course,
          courseDuration: semesterData.courseDuration,
          department: departmentId,
          batch: batchId,
          semester: semesterData.semester,
          isActive: true,
          isFirstLogin: true,
          emailVerified: false
        });

        await student.save();
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Student ${studentData.name || 'Unknown'}: ${error.message}`);
      }
    }

    // Create a detailed summary
    const summary = {
      total: students.length,
      successful: results.success,
      failed: results.failed,
      successRate: Math.round((results.success / students.length) * 100)
    };

    res.json({
      success: true,
      message: `Import completed. ${results.success} successful, ${results.failed} failed.`,
      summary,
      results
    });

  } catch (error) {
    console.error('Error importing students:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import students'
    });
  }
};

const importTeachers = async (req, res) => {
  try {
    const { teachers } = req.body;
    
    if (!teachers || !Array.isArray(teachers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of teachers.'
      });
    }

    // Ensure all required batches exist before importing
    await ensureRequiredBatchesExist();
    console.log('✅ Verified all required batches exist');

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Pre-process: Create departments and subjects in bulk
    const departmentMap = new Map();
    const subjectMap = new Map();
    
    // Your 5 courses - work directly with courses, no department mapping needed
    const validCourses = [
      'BTech AIML',
      'BTech FSD', 
      'BCA FSD',
      'BBA DM',
      'BDes'
    ];

    // Pre-create all needed courses as departments
    for (const teacherData of teachers) {
      // Handle both 'department' (singular) and 'departments' (plural) - but treat them as courses
      const courses = teacherData.departments || (teacherData.department ? [teacherData.department] : []);
      
      for (const course of courses) {
        // Validate against your 5 courses
        if (validCourses.includes(course)) {
          if (!departmentMap.has(course)) {
            departmentMap.set(course, null);
          }
        }
      }
      
      // Pre-create subjects if provided
      if (teacherData.subjects && Array.isArray(teacherData.subjects)) {
        for (const subjectData of teacherData.subjects) {
          // Handle both string subjects and object subjects
          const subjectName = typeof subjectData === 'string' ? subjectData : subjectData.name;
          if (!subjectMap.has(subjectName)) {
            subjectMap.set(subjectName, null);
          }
        }
      }
    }

    // Create courses as departments
    for (const [courseName] of departmentMap) {
      try {
        let department = await Department.findOne({ 
          name: courseName 
        });

        if (!department) {
          // Generate unique code based on course name
          let code;
          switch(courseName) {
            case 'BTech AIML':
              code = 'BTECH_AIML';
              break;
            case 'BTech FSD':
              code = 'BTECH_FSD';
              break;
            case 'BCA FSD':
              code = 'BCA_FSD';
              break;
            case 'BBA DM':
              code = 'BBA_DM';
              break;
            case 'BDes':
              code = 'BDES';
              break;
            default:
              code = courseName.substring(0, 6).toUpperCase();
          }
          
          department = new Department({
            name: courseName,
            code: code,
            description: `${courseName} Course`,
            isActive: true
          });
          await department.save();
          console.log(`✅ Created course: ${courseName} (${code})`);
        } else {
          console.log(`ℹ️  Found existing course: ${courseName} (${department.code})`);
        }
        departmentMap.set(courseName, department._id);
      } catch (error) {
        console.error(`Failed to create course: ${courseName}`, error);
      }
    }

    // Create subjects with proper course-semester mapping
    for (const teacherData of teachers) {
      if (teacherData.subjects && Array.isArray(teacherData.subjects)) {
        for (const subjectData of teacherData.subjects) {
          // Handle object subjects with course and semester mapping
          if (typeof subjectData === 'object' && subjectData.name && subjectData.course && subjectData.semester) {
            const subjectName = subjectData.name;
            const courseName = subjectData.course;
            const semester = subjectData.semester;
            
            try {
              let subject = await Subject.findOne({ 
                name: subjectName,
                code: subjectData.code || 'N/A'
              });

              if (!subject) {
                // Get the department ID for this course
                const departmentId = departmentMap.get(courseName);
                
                if (departmentId) {
                  // Generate subject code if not provided
                  let subjectCode = subjectData.code || 'N/A';
                  if (subjectCode === 'N/A' || subjectCode === '') {
                    if (subjectName.startsWith('Lab - ')) {
                      const mainSubject = subjectName.replace('Lab - ', '');
                      subjectCode = 'LAB_' + mainSubject.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 5);
                    } else {
                      subjectCode = subjectName.split(' ').map(word => word[0]).join('').toUpperCase().substring(0, 8);
                    }
                  }
                  
                  subject = new Subject({
                    name: subjectName,
                    code: subjectCode,
                    description: `${subjectName} Subject`,
                    department: departmentId,
                    semester: semester,
                    credits: 3,
                    isActive: true
                  });
                  await subject.save();
                  console.log(`✅ Created subject: ${subjectName} (${courseName} Sem ${semester})`);
                } else {
                  console.error(`❌ Course not found: ${courseName} for subject: ${subjectName}`);
                }
              } else {
                // Update existing subject if needed
                const departmentId = departmentMap.get(courseName);
                if (departmentId && subject.department.toString() !== departmentId.toString()) {
                  subject.department = departmentId;
                  subject.semester = semester;
                  await subject.save();
                  console.log(`🔄 Updated subject: ${subjectName} (${courseName} Sem ${semester})`);
                }
              }
              
              // Store subject ID for teacher mapping with unique key
              const uniqueKey = `${subjectName}_${courseName}_${semester}`;
              subjectMap.set(uniqueKey, subject._id);
            } catch (error) {
              console.error(`Failed to create subject: ${subjectName}`, error);
            }
          }
        }
      }
    }

    // Process teachers
    for (const teacherData of teachers) {
      try {
        // Validate required fields
        if (!teacherData.name || !teacherData.username) {
          results.failed++;
          const missingFields = [];
          if (!teacherData.name) missingFields.push('name');
          if (!teacherData.username) missingFields.push('username');
          results.errors.push(`Teacher ${teacherData.name || 'Unknown'}: Missing required fields (${missingFields.join(', ')})`);
          continue;
        }

        // Auto-generate email if not provided
        const email = teacherData.email || `${teacherData.username}@university.edu`;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed++;
          results.errors.push(`Teacher ${teacherData.name}: Invalid email format (${email})`);
          continue;
        }

        // Check if teacher already exists
        const existingTeacher = await Teacher.findOne({ 
          $or: [{ email: email }, { username: teacherData.username }] 
        });

        if (existingTeacher) {
          results.failed++;
          const duplicateField = existingTeacher.email === email ? 'email' : 'username';
          results.errors.push(`Teacher ${teacherData.name}: Already exists (duplicate ${duplicateField}: ${email || teacherData.username})`);
          continue;
        }

        // Map subjects and extract courses from subjects
        let departmentIds = new Set();
        let subjectIds = new Set(); // Use Set to prevent duplicates

        if (teacherData.subjects && Array.isArray(teacherData.subjects)) {
          for (const subjectData of teacherData.subjects) {
            // Handle object subjects with course and semester mapping
            if (typeof subjectData === 'object' && subjectData.name && subjectData.course && subjectData.semester) {
              const subjectName = subjectData.name;
              const courseName = subjectData.course;
              
              const uniqueKey = `${subjectName}_${courseName}_${semester}`;
              const subjectId = subjectMap.get(uniqueKey);
              if (subjectId) {
                subjectIds.add(subjectId.toString()); // Use add() to prevent duplicates
                
                // Add course to teacher's courses
                const departmentId = departmentMap.get(courseName);
                if (departmentId) {
                  departmentIds.add(departmentId.toString());
                }
              }
            }
          }
        }

        // Don't set password initially - teachers will set it during OTP signup
        // const hashedPassword = await bcrypt.hash('teacher123', 12);

        // Create teacher
        const teacher = new Teacher({
          name: teacherData.name,
          email: email,
          username: teacherData.username,
          // password: hashedPassword, // No password initially - will be set during OTP signup
          phone: teacherData.phone || '+91-0000000000', // Default phone if not provided
          subjects: Array.from(subjectIds), // Convert Set back to array
          courses: Array.from(departmentIds),
          isActive: true,
          isFirstLogin: true
        });

        await teacher.save();
        results.success++;

      } catch (error) {
        results.failed++;
        results.errors.push(`Teacher ${teacherData.name || 'Unknown'}: ${error.message}`);
      }
    }

    // Create a detailed summary
    const summary = {
      total: teachers.length,
      successful: results.success,
      failed: results.failed,
      successRate: Math.round((results.success / teachers.length) * 100)
    };

    res.json({
      success: true,
      message: `Import completed. ${results.success} successful, ${results.failed} failed.`,
      summary,
      results
    });

  } catch (error) {
    console.error('Error importing teachers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import teachers'
    });
  }
};

const downloadTemplate = async (req, res) => {
  try {
    const { type } = req.params;
    
    if (type === 'students') {
      const template = {
        students: [
          {
            name: 'Student Full Name',
            rno: 'Roll Number',
            email: 'email@domain.com',
            phone: '+91-9876543210',
            course: 'BTech AIML',
            year: 2023,
            batch: 'BTech AIML 5th Sem (2023-27)'
          }
        ]
      };
      
      res.json({
        success: true,
        template,
        headers: ['name', 'rno', 'email', 'phone', 'course', 'year', 'batch']
      });
    } else if (type === 'teachers') {
      const template = [
        {
          name: 'Dr. Jane Smith',
          email: 'jane.smith@university.edu',
          username: 'jane.smith',
          phone: '+91-9876543210',
          subjects: ['Computer Science', 'Data Structures'],
          departments: ['Computer Science']
        }
      ];
      
      res.json({
        success: true,
        template,
        headers: ['name', 'email', 'username', 'phone', 'subjects', 'departments']
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid template type. Use "students" or "teachers".'
      });
    }

  } catch (error) {
    console.error('Error downloading template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download template'
    });
  }
};

module.exports = {
  ...adminController,
  importStudents,
  importTeachers,
  downloadTemplate
};
