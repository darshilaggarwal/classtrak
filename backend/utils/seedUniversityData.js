const mongoose = require('mongoose');
const Department = require('../models/Department');
const Batch = require('../models/Batch');
const Subject = require('../models/Subject');
const Teacher = require('../models/Teacher');
const Student = require('../models/Student');
const Admin = require('../models/Admin');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for university data seeding...');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Sample university data structure
const universityData = {
  departments: [
    {
      name: 'Computer Science & Engineering',
      code: 'CSE',
      description: 'Computer Science and Engineering Department'
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Information Technology Department'
    },
    {
      name: 'Electronics & Communication',
      code: 'ECE',
      description: 'Electronics and Communication Engineering Department'
    },
    {
      name: 'Mechanical Engineering',
      code: 'ME',
      description: 'Mechanical Engineering Department'
    }
  ],
  
  batches: [
    // CSE Batches
    { name: 'CSE 2023', year: 2023, department: 'CSE', description: 'Computer Science 2023 Batch' },
    { name: 'CSE 2022', year: 2022, department: 'CSE', description: 'Computer Science 2022 Batch' },
    { name: 'CSE 2021', year: 2021, department: 'CSE', description: 'Computer Science 2021 Batch' },
    
    // IT Batches
    { name: 'IT 2023', year: 2023, department: 'IT', description: 'Information Technology 2023 Batch' },
    { name: 'IT 2022', year: 2022, department: 'IT', description: 'Information Technology 2022 Batch' },
    
    // ECE Batches
    { name: 'ECE 2023', year: 2023, department: 'ECE', description: 'Electronics 2023 Batch' },
    { name: 'ECE 2022', year: 2022, department: 'ECE', description: 'Electronics 2022 Batch' },
    
    // ME Batches
    { name: 'ME 2023', year: 2023, department: 'ME', description: 'Mechanical 2023 Batch' }
  ],
  
  subjects: [
    // CSE Subjects
    { name: 'Data Structures', code: 'CS201', department: 'CSE', semester: 3, credits: 4 },
    { name: 'Object Oriented Programming', code: 'CS202', department: 'CSE', semester: 3, credits: 4 },
    { name: 'Database Management System', code: 'CS301', department: 'CSE', semester: 4, credits: 4 },
    { name: 'Computer Networks', code: 'CS401', department: 'CSE', semester: 5, credits: 4 },
    { name: 'Software Engineering', code: 'CS501', department: 'CSE', semester: 6, credits: 4 },
    { name: 'Artificial Intelligence', code: 'CS601', department: 'CSE', semester: 7, credits: 4 },
    
    // IT Subjects
    { name: 'Web Technologies', code: 'IT201', department: 'IT', semester: 3, credits: 4 },
    { name: 'Data Structures & Algorithms', code: 'IT202', department: 'IT', semester: 3, credits: 4 },
    { name: 'Database Systems', code: 'IT301', department: 'IT', semester: 4, credits: 4 },
    { name: 'Computer Networks', code: 'IT401', department: 'IT', semester: 5, credits: 4 },
    
    // ECE Subjects
    { name: 'Digital Electronics', code: 'EC201', department: 'ECE', semester: 3, credits: 4 },
    { name: 'Signals & Systems', code: 'EC301', department: 'ECE', semester: 4, credits: 4 },
    { name: 'Communication Systems', code: 'EC401', department: 'ECE', semester: 5, credits: 4 },
    
    // ME Subjects
    { name: 'Engineering Mechanics', code: 'ME201', department: 'ME', semester: 3, credits: 4 },
    { name: 'Thermodynamics', code: 'ME301', department: 'ME', semester: 4, credits: 4 },
    { name: 'Machine Design', code: 'ME401', department: 'ME', semester: 5, credits: 4 }
  ],
  
  // Note: Teachers are now imported through admin interface
  teachers: [],
  
  admins: [
    {
      name: 'System Administrator',
      email: 'admin@university.edu',
      username: 'admin',
      password: 'admin123456',
      role: 'super_admin',
      permissions: [
        'manage_departments',
        'manage_batches',
        'manage_subjects',
        'manage_teachers',
        'manage_students',
        'manage_timetables',
        'view_reports',
        'manage_admins'
      ]
    }
  ]
};

const seedUniversityData = async () => {
  try {
    await connectDB();

    console.log('🏫 Starting University Data Seeding...\n');

    // Clear existing data
    await Department.deleteMany({});
    await Batch.deleteMany({});
    await Subject.deleteMany({});
    await Teacher.deleteMany({});
    await Admin.deleteMany({});
    console.log('🗑️ Cleared existing data...\n');

    // 1. Create Departments
    console.log('📚 Creating Departments...');
    const departments = await Department.insertMany(universityData.departments);
    console.log(`✅ Created ${departments.length} departments\n`);

    // 2. Create Batches
    console.log('👥 Creating Batches...');
    const batchData = universityData.batches.map(batch => ({
      ...batch,
      department: departments.find(d => d.code === batch.department)._id
    }));
    const batches = await Batch.insertMany(batchData);
    console.log(`✅ Created ${batches.length} batches\n`);

    // 3. Create Subjects
    console.log('📖 Creating Subjects...');
    const subjectData = universityData.subjects.map(subject => ({
      ...subject,
      department: departments.find(d => d.code === subject.department)._id,
      batches: batches.filter(b => b.department.toString() === departments.find(d => d.code === subject.department)._id.toString())
    }));
    const subjects = await Subject.insertMany(subjectData);
    console.log(`✅ Created ${subjects.length} subjects\n`);

    // 4. Teachers (imported through admin interface)
    console.log('👨‍🏫 Teachers will be imported through admin dashboard\n');
    const teachers = [];

    // 5. Create Admin
    console.log('👨‍💼 Creating Admin...');
    const adminData = universityData.admins.map(admin => ({
      ...admin,
      isActive: true
    }));
    const admins = await Admin.insertMany(adminData);
    console.log(`✅ Created ${admins.length} admin\n`);

    // 6. Generate Sample Students (500+ as requested)
    console.log('🎓 Generating Sample Students...');
    const sampleStudents = [];
    
    departments.forEach(dept => {
      const deptBatches = batches.filter(b => b.department.toString() === dept._id.toString());
      
      deptBatches.forEach(batch => {
        const studentCount = Math.floor(Math.random() * 50) + 30; // 30-80 students per batch
        
        for (let i = 1; i <= studentCount; i++) {
          const studentNumber = i.toString().padStart(3, '0');
          const year = batch.year.toString().slice(-2);
          const rno = `${dept.code}${year}${studentNumber}`;
          
          sampleStudents.push({
            name: `Student ${i} ${dept.name}`,
            email: `student${i}.${dept.code.toLowerCase()}${year}@university.edu`,
            rno: rno,
            batch: batch._id,
            department: dept._id,
            semester: Math.floor(Math.random() * 4) + 3, // 3-6 semester
            isFirstLogin: true,
            emailVerified: false
          });
        }
      });
    });

    await Student.insertMany(sampleStudents);
    console.log(`✅ Created ${sampleStudents.length} students\n`);

    // Update department statistics
    console.log('📊 Updating Department Statistics...');
    for (const dept of departments) {
      const deptBatches = batches.filter(b => b.department.toString() === dept._id.toString());
      const deptStudents = sampleStudents.filter(s => s.department.toString() === dept._id.toString());
      const deptTeachers = teachers.filter(t => t.departments.some(d => d.toString() === dept._id.toString()));
      
      await Department.findByIdAndUpdate(dept._id, {
        totalBatches: deptBatches.length,
        totalStudents: deptStudents.length,
        totalTeachers: deptTeachers.length
      });
    }
    console.log('✅ Updated department statistics\n');

    console.log('🎉 University Data Seeding Completed Successfully!\n');
    
    console.log('📋 SUMMARY:');
    console.log(`📚 Departments: ${departments.length}`);
    console.log(`👥 Batches: ${batches.length}`);
    console.log(`📖 Subjects: ${subjects.length}`);
    console.log(`👨‍🏫 Teachers: ${teachers.length}`);
    console.log(`🎓 Students: ${sampleStudents.length}`);
    console.log(`👨‍💼 Admins: ${admins.length}\n`);

    console.log('🔑 ADMIN LOGIN:');
    console.log('Username: admin');
    console.log('Password: admin123456\n');

    console.log('👨‍🏫 TEACHER LOGINS:');
    console.log('Teachers will be imported through admin dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedUniversityData();
}

module.exports = { seedUniversityData, universityData };
