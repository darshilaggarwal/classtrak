require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to register schemas
require('./models/Subject');
require('./models/Teacher');
require('./models/Department');

const Subject = mongoose.model('Subject');
const Teacher = mongoose.model('Teacher');

async function fixAhsanSystemDesign() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find BTech AIML department
    const aimlDept = await mongoose.model('Department').findOne({ name: 'BTech AIML' });
    if (!aimlDept) {
      console.log('❌ BTech AIML department not found');
      return;
    }
    
    // Find System Design for BTech AIML Sem 5
    const systemDesignAIML5 = await Subject.findOne({
      name: 'System Design',
      department: aimlDept._id,
      semester: 5
    });
    
    if (!systemDesignAIML5) {
      console.log('❌ System Design for BTech AIML Sem 5 not found');
      return;
    }
    
    console.log(`✅ Found subject: ${systemDesignAIML5.name} (${systemDesignAIML5.code})`);
    
    // Find Ahsan Ahmed
    const ahsan = await Teacher.findOne({ username: 'mo.ahsan' });
    if (!ahsan) {
      console.log('❌ Ahsan Ahmed not found');
      return;
    }
    
    console.log(`✅ Found teacher: ${ahsan.name} (@${ahsan.username})`);
    
    // Check if Ahsan already has this subject
    if (ahsan.subjects.includes(systemDesignAIML5._id)) {
      console.log('ℹ️  Ahsan already has this subject assigned');
      return;
    }
    
    // Add the subject to Ahsan
    ahsan.subjects.push(systemDesignAIML5._id);
    await ahsan.save();
    
    console.log('✅ Successfully assigned System Design (BTech AIML Sem 5) to Ahsan Ahmed');
    
    // Verify the assignment
    const updatedAhsan = await Teacher.findById(ahsan._id)
      .populate({
        path: 'subjects',
        select: 'name code department semester',
        populate: {
          path: 'department',
          select: 'name code'
        }
      });
    
    console.log('\n📚 Ahsan\'s Updated Subjects:');
    updatedAhsan.subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} - ${subject.department.name} Sem ${subject.semester}`);
    });
    
    // Check if System Design for BTech AIML Sem 5 is now assigned
    const systemDesignAIML5Assigned = updatedAhsan.subjects.find(s => 
      s.name === 'System Design' && 
      s.department.name === 'BTech AIML' && 
      s.semester === 5
    );
    
    if (systemDesignAIML5Assigned) {
      console.log('\n✅ System Design for BTech AIML Sem 5: NOW ASSIGNED TO AHSAN');
    } else {
      console.log('\n❌ System Design for BTech AIML Sem 5: STILL MISSING');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAhsanSystemDesign();
