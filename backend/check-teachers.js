require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');

async function checkTeachers() {
  try {
    console.log('🔍 Checking teachers in database...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find all teachers
    const teachers = await Teacher.find({}).select('name email username isFirstLogin password');
    
    console.log(`📊 Found ${teachers.length} teachers:`);
    console.log('=====================================');
    
    teachers.forEach((teacher, index) => {
      console.log(`${index + 1}. Name: ${teacher.name}`);
      console.log(`   Email: ${teacher.email}`);
      console.log(`   Username: ${teacher.username}`);
      console.log(`   Has Password: ${teacher.password ? 'Yes' : 'No'}`);
      console.log(`   First Login: ${teacher.isFirstLogin}`);
      console.log('   ---');
    });
    
    if (teachers.length === 0) {
      console.log('❌ No teachers found in database');
      console.log('💡 You need to import teachers first using the admin portal');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

checkTeachers();
