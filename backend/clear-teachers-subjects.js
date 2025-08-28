require('dotenv').config();
const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');

async function clearData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Clear teachers
    const teacherResult = await Teacher.deleteMany({});
    console.log(`🗑️ Cleared ${teacherResult.deletedCount} teachers`);
    
    // Clear subjects  
    const subjectResult = await Subject.deleteMany({});
    console.log(`🗑️ Cleared ${subjectResult.deletedCount} subjects`);
    
    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

clearData();
