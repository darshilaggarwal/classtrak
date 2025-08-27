const mongoose = require('mongoose');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Batch = require('../models/Batch');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

const fixStudentData = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting Student Data Fix...\n');

    // Get all departments and batches
    const departments = await Department.find({});
    const batches = await Batch.find({});
    const students = await Student.find({});

    console.log(`📚 Found ${departments.length} departments, ${batches.length} batches, ${students.length} students`);

    // Create mapping based on roll number patterns
    const departmentMapping = {
      '021323': 'BTech Artificial Intelligence & Machine Learning', // BTech CS AIML
      '021324': 'BTech Full Stack Development',
      '021325': 'BCA Full Stack Development',
      '021326': 'BBA Digital Marketing',
      '021327': 'B Des',
      '021723': 'BTech Artificial Intelligence & Machine Learning', // Different pattern
      'BTECH_AIML25': 'BTech Artificial Intelligence & Machine Learning',
      'BTECH_AIML24': 'BTech Artificial Intelligence & Machine Learning',
      'BTECH_AIML22': 'BTech Artificial Intelligence & Machine Learning',
      'BTECH_FSD23': 'BTech Full Stack Development',
      'BCA_FSD25': 'BCA Full Stack Development',
      'BCA_FSD24': 'BCA Full Stack Development',
      'BCA_FSD23': 'BCA Full Stack Development',
      'BBA_DM25': 'BBA Digital Marketing',
      'BBA_DM24': 'BBA Digital Marketing',
      'BBA_DM23': 'BBA Digital Marketing',
      'B_DES25': 'B Des',
      'B_DES23': 'B Des',
      'B_DES22': 'B Des'
    };

    const batchMapping = {
      '021323': 'BTech AIML 2023', // Semester 5
      '021324': 'BTech FSD 2023',
      '021325': 'BCA FSD 2023',
      '021326': 'BBA DM 2023',
      '021327': 'B Des 2023',
      '021723': 'BTech AIML 2023', // Different pattern
      'BTECH_AIML25': 'BTech AIML 2025',
      'BTECH_AIML24': 'BTech AIML 2024',
      'BTECH_AIML22': 'BTech AIML 2022',
      'BTECH_FSD23': 'BTech FSD 2023',
      'BCA_FSD25': 'BCA FSD 2025',
      'BCA_FSD24': 'BCA FSD 2024',
      'BCA_FSD23': 'BCA FSD 2023',
      'BBA_DM25': 'BBA DM 2025',
      'BBA_DM24': 'BBA DM 2024',
      'BBA_DM23': 'BBA DM 2023',
      'B_DES25': 'B Des 2025',
      'B_DES23': 'B Des 2023',
      'B_DES22': 'B Des 2022'
    };

    let updatedCount = 0;

         for (const student of students) {
       let rnoPrefix;
       
       // Handle different roll number patterns
       if (student.rno.startsWith('BTECH_AIML')) {
         // Extract year from BTECH_AIML25001 -> BTECH_AIML25
         const match = student.rno.match(/^(BTECH_AIML\d{2})/);
         rnoPrefix = match ? match[1] : student.rno.substring(0, 11);
       } else if (student.rno.startsWith('BTECH_FSD')) {
         // Extract year from BTECH_FSD23001 -> BTECH_FSD23
         const match = student.rno.match(/^(BTECH_FSD\d{2})/);
         rnoPrefix = match ? match[1] : student.rno.substring(0, 11);
       } else if (student.rno.startsWith('BCA_FSD')) {
         // Extract year from BCA_FSD25001 -> BCA_FSD25
         const match = student.rno.match(/^(BCA_FSD\d{2})/);
         rnoPrefix = match ? match[1] : student.rno.substring(0, 8);
       } else if (student.rno.startsWith('BBA_DM')) {
         // Extract year from BBA_DM25001 -> BBA_DM25
         const match = student.rno.match(/^(BBA_DM\d{2})/);
         rnoPrefix = match ? match[1] : student.rno.substring(0, 7);
       } else if (student.rno.startsWith('B_DES')) {
         // Extract year from B_DES25001 -> B_DES25
         const match = student.rno.match(/^(B_DES\d{2})/);
         rnoPrefix = match ? match[1] : student.rno.substring(0, 6);
       } else if (/^\d{6}/.test(student.rno)) {
         // For numeric roll numbers starting with 6 digits (like 021323, 021723)
         rnoPrefix = student.rno.substring(0, 6);
       } else {
         console.log(`⚠️  Unknown roll number pattern: ${student.rno}`);
         continue;
       }
       
       // Debug: Log the prefix for unmapped students
       if (!departmentMapping[rnoPrefix]) {
         console.log(`🔍 Debug: Student ${student.name} (${student.rno}) -> Prefix: "${rnoPrefix}"`);
       }
       
       // Find department
       const deptName = departmentMapping[rnoPrefix];
       const department = departments.find(d => d.name === deptName);
       
       // Find batch
       const batchName = batchMapping[rnoPrefix];
       const batch = batches.find(b => b.name === batchName);

      if (department && batch) {
        // Update student
        student.department = department._id;
        student.batch = batch._id;
        
                 // Set semester based on batch year
         if (batchName.includes('2025')) {
           student.semester = 1; // First year
         } else if (batchName.includes('2024')) {
           student.semester = 3; // Second year
         } else if (batchName.includes('2023')) {
           student.semester = 5; // Third year
         } else if (batchName.includes('2022')) {
           student.semester = 7; // Fourth year
         }

        await student.save();
        updatedCount++;
        console.log(`✅ Updated: ${student.name} (${student.rno}) -> ${deptName} / ${batchName}`);
      } else {
        console.log(`⚠️  Could not map: ${student.name} (${student.rno}) - Dept: ${deptName}, Batch: ${batchName}`);
      }
    }

    console.log(`\n🎉 Student Data Fix Completed!`);
    console.log(`📊 Updated ${updatedCount} out of ${students.length} students`);

    // Verify the fix
    const sampleStudents = await Student.find({})
      .populate('department', 'name')
      .populate('batch', 'name')
      .limit(5);

    console.log('\n📋 Sample updated students:');
    sampleStudents.forEach(s => {
      console.log(`- ${s.name} (${s.rno}) -> ${s.department?.name || 'N/A'} / ${s.batch?.name || 'N/A'} (Sem: ${s.semester})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing student data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  fixStudentData();
}

module.exports = { fixStudentData };
