const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const Student = require('../models/Student');
const Department = require('../models/Department');
const Batch = require('../models/Batch');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/classtrack', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Simple data generator (no real data)
const generateStudentData = (departments, batches) => {
  const students = [];
  let studentCounter = 1;

  // Generate 10 students per batch
  batches.forEach(batch => {
    const dept = departments.find(d => d._id.equals(batch.department));
    const deptCode = dept?.code || 'CS';
    const batchYear = batch.year || '2023';
    
    for (let i = 1; i <= 10; i++) {
      const studentNumber = String(studentCounter).padStart(3, '0');
      const rollNumber = `${deptCode}${batchYear}${studentNumber}`;
      
      students.push({
        name: `Student ${studentCounter}`,
        email: `student${studentCounter}@university.edu`,
        rno: rollNumber,
        department: batch.department,
        batch: batch._id,
        semester: batch.semester || 3,
        phone: `+91-98765${String(studentCounter).padStart(5, '0')}`,
        isActive: true,
        isFirstLogin: true
      });
      
      studentCounter++;
    }
  });

  return students;
};

const seedStudentData = async () => {
  try {
    console.log('🌱 Starting to seed student data...');

    // Clear existing students
    await Student.deleteMany({});
    console.log('✅ Cleared existing students');

    // Get department and batch references
    const departments = await Department.find({});
    const batches = await Batch.find({});

    if (departments.length === 0) {
      console.log('⚠️ No departments found. Please seed departments first.');
      return;
    }

    if (batches.length === 0) {
      console.log('⚠️ No batches found. Please seed batches first.');
      return;
    }

    // Generate student data
    const studentData = generateStudentData(departments, batches);
    console.log(`📝 Generated ${studentData.length} student records`);

    // Hash passwords and create students
    const studentsToCreate = [];
    for (const studentInfo of studentData) {
      const hashedPassword = await bcrypt.hash('student123', 12);
      const student = new Student({
        ...studentInfo,
        password: hashedPassword
      });
      studentsToCreate.push(student);
    }

    // Insert all students
    const createdStudents = await Student.insertMany(studentsToCreate);
    console.log(`✅ Successfully created ${createdStudents.length} students`);

    // Update department and batch student counts
    for (const dept of departments) {
      const studentCount = await Student.countDocuments({ department: dept._id });
      await Department.findByIdAndUpdate(dept._id, { totalStudents: studentCount });
    }

    for (const batch of batches) {
      const studentCount = await Student.countDocuments({ batch: batch._id });
      await Batch.findByIdAndUpdate(batch._id, { totalStudents: studentCount });
    }

    console.log('✅ Updated department and batch student counts');

    // Display summary
    console.log('\n📊 Student Seeding Summary:');
    console.log('============================');
    
    const deptSummary = {};
    const batchSummary = {};

    for (const student of createdStudents) {
      const deptName = departments.find(d => d._id.equals(student.department))?.name;
      const batchName = batches.find(b => b._id.equals(student.batch))?.name;

      if (deptName) {
        deptSummary[deptName] = (deptSummary[deptName] || 0) + 1;
      }
      if (batchName) {
        batchSummary[batchName] = (batchSummary[batchName] || 0) + 1;
      }
    }

    console.log('\n📚 By Department:');
    Object.entries(deptSummary).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count} students`);
    });

    console.log('\n🎓 By Batch:');
    Object.entries(batchSummary).forEach(([batch, count]) => {
      console.log(`   ${batch}: ${count} students`);
    });

    console.log('\n🔑 Default Login Credentials:');
    console.log('   Username: Email address');
    console.log('   Password: student123');
    console.log('   Note: Students will be prompted to change password on first login');

    console.log('\n✅ Student data seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding student data:', error);
  } finally {
    mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding function
seedStudentData(); 