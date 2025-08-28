require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to register schemas
require('./models/Teacher');
require('./models/Subject');
require('./models/Department');

const Teacher = mongoose.model('Teacher');

async function checkSpecificTeachers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Check Ahsan Ahmed
    console.log('\n👨‍🏫 Checking Ahsan Ahmed:');
    const ahsan = await Teacher.findOne({ username: 'mo.ahsan' });
    if (ahsan) {
      console.log(`Name: ${ahsan.name}`);
      console.log(`Username: ${ahsan.username}`);
      console.log(`Total subjects: ${ahsan.subjects.length}`);
      
      // Get populated subjects
      const populatedAhsan = await Teacher.findById(ahsan._id)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        });
      
      console.log('\n📚 Ahsan\'s Subjects:');
      populatedAhsan.subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} - ${subject.department.name} Sem ${subject.semester}`);
      });
      
      // Check if System Design for BTech AIML Sem 5 exists
      const systemDesignAIML5 = populatedAhsan.subjects.find(s => 
        s.name === 'System Design' && 
        s.department.name === 'BTech AIML' && 
        s.semester === 5
      );
      
      if (systemDesignAIML5) {
        console.log('✅ System Design for BTech AIML Sem 5: FOUND');
      } else {
        console.log('❌ System Design for BTech AIML Sem 5: MISSING');
      }
    }
    
    // Check Chaman Kumar
    console.log('\n👨‍🏫 Checking Chaman Kumar:');
    const chaman = await Teacher.findOne({ username: 'chaman.kumar' });
    if (chaman) {
      console.log(`Name: ${chaman.name}`);
      console.log(`Username: ${chaman.username}`);
      console.log(`Total subjects: ${chaman.subjects.length}`);
      
      // Get populated subjects
      const populatedChaman = await Teacher.findById(chaman._id)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        });
      
      console.log('\n📚 Chaman\'s Subjects:');
      populatedChaman.subjects.forEach((subject, index) => {
        console.log(`${index + 1}. ${subject.name} - ${subject.department.name} Sem ${subject.semester}`);
      });
      
      // Check if Computer Networks for BTech AIML Sem 5 exists
      const computerNetworksAIML5 = populatedChaman.subjects.find(s => 
        s.name === 'Computer Networks' && 
        s.department.name === 'BTech AIML' && 
        s.semester === 5
      );
      
      if (computerNetworksAIML5) {
        console.log('✅ Computer Networks for BTech AIML Sem 5: FOUND');
      } else {
        console.log('❌ Computer Networks for BTech AIML Sem 5: MISSING');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkSpecificTeachers();
