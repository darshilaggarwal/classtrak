require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to register schemas
require('./models/Subject');
require('./models/Teacher');
require('./models/Department');

const Subject = mongoose.model('Subject');
const Teacher = mongoose.model('Teacher');

async function checkAIMLSem5Subjects() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find BTech AIML department
    const aimlDept = await mongoose.model('Department').findOne({ name: 'BTech AIML' });
    if (!aimlDept) {
      console.log('❌ BTech AIML department not found');
      return;
    }
    
    console.log(`\n🏫 BTech AIML Department: ${aimlDept.name} (${aimlDept.code})`);
    
    // Find all subjects for BTech AIML Sem 5
    const sem5Subjects = await Subject.find({
      department: aimlDept._id,
      semester: 5
    });
    
    console.log(`\n📚 BTech AIML Sem 5 Subjects (${sem5Subjects.length}):`);
    sem5Subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} (Code: ${subject.code})`);
    });
    
    // Check which teachers are assigned to these subjects
    console.log('\n👨‍🏫 Teacher Assignments for BTech AIML Sem 5:');
    
    for (const subject of sem5Subjects) {
      const teachers = await Teacher.find({
        subjects: subject._id
      });
      
      if (teachers.length > 0) {
        console.log(`\n📖 ${subject.name}:`);
        teachers.forEach(teacher => {
          console.log(`   - ${teacher.name} (@${teacher.username})`);
        });
      } else {
        console.log(`\n📖 ${subject.name}: ❌ NO TEACHER ASSIGNED`);
      }
    }
    
    // Check if System Design exists for BTech AIML Sem 5
    const systemDesignAIML5 = await Subject.findOne({
      name: 'System Design',
      department: aimlDept._id,
      semester: 5
    });
    
    if (systemDesignAIML5) {
      console.log('\n✅ System Design for BTech AIML Sem 5: EXISTS');
      console.log(`   Subject ID: ${systemDesignAIML5._id}`);
      
      // Check which teachers have this subject
      const teachersWithSystemDesign = await Teacher.find({
        subjects: systemDesignAIML5._id
      });
      
      if (teachersWithSystemDesign.length > 0) {
        console.log('   Teachers assigned:');
        teachersWithSystemDesign.forEach(teacher => {
          console.log(`   - ${teacher.name} (@${teacher.username})`);
        });
      } else {
        console.log('   ❌ NO TEACHER ASSIGNED');
      }
    } else {
      console.log('\n❌ System Design for BTech AIML Sem 5: DOES NOT EXIST');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

checkAIMLSem5Subjects();
