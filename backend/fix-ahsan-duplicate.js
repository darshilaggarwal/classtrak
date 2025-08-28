require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to register schemas
require('./models/Subject');
require('./models/Teacher');
require('./models/Department');

const Subject = mongoose.model('Subject');
const Teacher = mongoose.model('Teacher');

async function fixAhsanDuplicate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find BTech FSD department
    const btechFsdDept = await mongoose.model('Department').findOne({ name: 'BTech FSD' });
    if (!btechFsdDept) {
      console.log('❌ BTech FSD department not found');
      return;
    }
    
    // Find System Design for BTech FSD Sem 5
    const systemDesignFSD5 = await Subject.findOne({
      name: 'System Design',
      department: btechFsdDept._id,
      semester: 5
    });
    
    if (!systemDesignFSD5) {
      console.log('❌ System Design for BTech FSD Sem 5 not found');
      return;
    }
    
    console.log(`✅ Found subject: ${systemDesignFSD5.name} (${systemDesignFSD5.code})`);
    
    // Find Ahsan Ahmed
    const ahsan = await Teacher.findOne({ username: 'mo.ahsan' });
    if (!ahsan) {
      console.log('❌ Ahsan Ahmed not found');
      return;
    }
    
    console.log(`✅ Found teacher: ${ahsan.name} (@${ahsan.username})`);
    
    // Count how many times this subject appears
    const subjectCount = ahsan.subjects.filter(id => id.equals(systemDesignFSD5._id)).length;
    console.log(`📊 System Design (BTech FSD Sem 5) appears ${subjectCount} times in Ahsan's subjects`);
    
    if (subjectCount > 1) {
      // Remove all instances and add back only one
      ahsan.subjects = ahsan.subjects.filter(id => !id.equals(systemDesignFSD5._id));
      ahsan.subjects.push(systemDesignFSD5._id);
      console.log('✅ Removed duplicate System Design (BTech FSD Sem 5) from Ahsan');
      
      await ahsan.save();
    } else {
      console.log('ℹ️  No duplicates found for System Design (BTech FSD Sem 5)');
    }
    
    // Verify the changes
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
    
    // Check for any remaining duplicates
    const subjectNames = updatedAhsan.subjects.map(s => `${s.name}_${s.department.name}_${s.semester}`);
    const uniqueSubjects = new Set(subjectNames);
    
    if (subjectNames.length === uniqueSubjects.size) {
      console.log('\n✅ No more duplicates found!');
    } else {
      console.log('\n❌ Still have duplicates!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixAhsanDuplicate();
