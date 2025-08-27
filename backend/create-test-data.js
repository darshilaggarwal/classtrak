const mongoose = require('mongoose');
require('dotenv').config();

const createTestData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const Attendance = require('./models/Attendance');
    const Student = require('./models/Student');
    const Teacher = require('./models/Teacher');

    // Get students and teachers
    const students = await Student.find({});
    const teachers = await Teacher.find({});
    
    console.log(`Found ${students.length} students and ${teachers.length} teachers`);

    // Define subjects and their teachers
    const subjects = [
      { name: 'Software Engineering', teacher: teachers.find(t => t.subject === 'Software Engineering') },
      { name: 'Neural Networks', teacher: teachers.find(t => t.subject === 'Neural Networks') },
      { name: 'Compiler Design', teacher: teachers.find(t => t.subject === 'Compiler Design') },
      { name: 'Deep Learning', teacher: teachers.find(t => t.subject === 'Deep Learning') },
      { name: 'Database System', teacher: teachers.find(t => t.subject === 'Database System') },
      { name: 'Soft Computing', teacher: teachers.find(t => t.subject === 'Soft Computing') }
    ];

    // Define class times for each subject
    const classTimes = [
      '09:00', // Software Engineering
      '10:00', // Neural Networks
      '11:00', // Compiler Design
      '12:00', // Deep Learning
      '14:00', // Database System
      '15:00'  // Soft Computing
    ];

    let addedRecords = 0;
    const startDate = new Date(2025, 7, 15); // August 15, 2025
    const endDate = new Date(2025, 7, 31);   // August 31, 2025

    // Generate records for each day from August 15 to 31
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      // Skip Sundays (day 0)
      if (date.getDay() === 0) {
        console.log(`⏭️ Skipping Sunday: ${date.toDateString()}`);
        continue;
      }

      console.log(`📅 Creating records for: ${date.toDateString()}`);

      // Create 6 classes for each day (one for each subject)
      for (let i = 0; i < 6; i++) {
        const subjectInfo = subjects[i];
        const classTime = classTimes[i];

        if (!subjectInfo.teacher) {
          console.log(`⚠️ No teacher found for ${subjectInfo.name}, skipping...`);
          continue;
        }

        // Generate random attendance records for each student
        const records = students.map(student => ({
          rollNumber: student.rno,
          studentId: student._id,
          // Random attendance: 70-95% attendance rate
          status: Math.random() > 0.25 ? 'present' : 'absent'
        }));

        const attendanceRecord = new Attendance({
          date: new Date(date),
          subject: subjectInfo.name,
          classTime: classTime,
          duration: 60,
          takenBy: subjectInfo.teacher._id,
          records: records,
          month: date.getMonth() + 1,
          year: date.getFullYear()
        });

        await attendanceRecord.save();
        addedRecords++;
        console.log(`✅ Added ${subjectInfo.name} class at ${classTime} on ${date.toDateString()}`);
      }
    }

    console.log(`\n🎉 Successfully created ${addedRecords} attendance records!`);
    console.log(`📊 Data covers: ${startDate.toDateString()} to ${endDate.toDateString()}`);
    console.log(`📚 Subjects: ${subjects.length} (${subjects.map(s => s.name).join(', ')})`);
    console.log(`👥 Students: ${students.length}`);
    console.log(`📅 Classes per day: 6 (excluding Sundays)`);
    
    // Calculate total days
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    const sundays = Math.floor(totalDays / 7);
    const workingDays = totalDays - sundays;
    console.log(`📅 Total working days: ${workingDays} (${totalDays} total days - ${sundays} Sundays)`);
    console.log(`📊 Expected total classes: ${workingDays * 6} classes`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    process.exit(1);
  }
};

createTestData();
