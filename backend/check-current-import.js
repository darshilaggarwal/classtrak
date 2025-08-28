require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');

async function checkCurrentData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check Ahsan's subjects
    const ahsan = await Teacher.findOne({ username: 'mo.ahsan' });
    if (ahsan) {
      console.log('\n👨‍🏫 Ahsan Ahmed Subjects:');
      console.log(`Total subjects: ${ahsan.subjects.length}`);
      ahsan.subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} - ${subject.course} Sem ${subject.semester} (Code: ${subject.code})`);
      });
    } else {
      console.log('\n❌ Ahsan Ahmed not found in database');
    }
    
    // Check Chaman's subjects
    const chaman = await Teacher.findOne({ username: 'chaman.kumar' });
    if (chaman) {
      console.log('\n👨‍🏫 Chaman Kumar Subjects:');
      console.log(`Total subjects: ${chaman.subjects.length}`);
      chaman.subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} - ${subject.course} Sem ${subject.semester} (Code: ${subject.code})`);
      });
    } else {
      console.log('\n❌ Chaman Kumar not found in database');
    }
    
    // Count total teachers
    const totalTeachers = await Teacher.countDocuments();
    console.log(`\n📊 Total Teachers: ${totalTeachers}`);
    
    // List all teachers
    const allTeachers = await Teacher.find({}).select('name username email');
    console.log('\n📋 All Teachers:');
    allTeachers.forEach((teacher, index) => {
      console.log(`${index + 1}. ${teacher.name} (${teacher.username}) - ${teacher.email}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkCurrentData();
