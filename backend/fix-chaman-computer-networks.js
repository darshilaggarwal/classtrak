require('dotenv').config();
const mongoose = require('mongoose');

// Import all models to register schemas
require('./models/Subject');
require('./models/Teacher');
require('./models/Department');

const Subject = mongoose.model('Subject');
const Teacher = mongoose.model('Teacher');

async function fixChamanComputerNetworks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Find BCA FSD department
    const bcaFsdDept = await mongoose.model('Department').findOne({ name: 'BCA FSD' });
    if (!bcaFsdDept) {
      console.log('❌ BCA FSD department not found');
      return;
    }
    
    // Find BTech AIML department
    const aimlDept = await mongoose.model('Department').findOne({ name: 'BTech AIML' });
    if (!aimlDept) {
      console.log('❌ BTech AIML department not found');
      return;
    }
    
    // Find Computer Networks for BCA FSD Sem 5
    const computerNetworksBCA5 = await Subject.findOne({
      name: 'Computer Networks',
      department: bcaFsdDept._id,
      semester: 5
    });
    
    if (!computerNetworksBCA5) {
      console.log('❌ Computer Networks for BCA FSD Sem 5 not found');
      return;
    }
    
    // Find Lab - Computer Networks for BCA FSD Sem 5
    const labComputerNetworksBCA5 = await Subject.findOne({
      name: 'Lab - Computer Networks',
      department: bcaFsdDept._id,
      semester: 5
    });
    
    if (!labComputerNetworksBCA5) {
      console.log('❌ Lab - Computer Networks for BCA FSD Sem 5 not found');
      return;
    }
    
    // Find Computer Networks for BTech AIML Sem 5
    const computerNetworksAIML5 = await Subject.findOne({
      name: 'Computer Networks',
      department: aimlDept._id,
      semester: 5
    });
    
    if (!computerNetworksAIML5) {
      console.log('❌ Computer Networks for BTech AIML Sem 5 not found');
      return;
    }
    
    // Find Lab - Computer Networks for BTech AIML Sem 5
    const labComputerNetworksAIML5 = await Subject.findOne({
      name: 'Lab - Computer Networks',
      department: aimlDept._id,
      semester: 5
    });
    
    if (!labComputerNetworksAIML5) {
      console.log('❌ Lab - Computer Networks for BTech AIML Sem 5 not found');
      return;
    }
    
    console.log(`✅ Found Computer Networks for BCA FSD Sem 5: ${computerNetworksBCA5.name} (${computerNetworksBCA5.code})`);
    console.log(`✅ Found Lab - Computer Networks for BCA FSD Sem 5: ${labComputerNetworksBCA5.name} (${labComputerNetworksBCA5.code})`);
    console.log(`✅ Found Computer Networks for BTech AIML Sem 5: ${computerNetworksAIML5.name} (${computerNetworksAIML5.code})`);
    console.log(`✅ Found Lab - Computer Networks for BTech AIML Sem 5: ${labComputerNetworksAIML5.name} (${labComputerNetworksAIML5.code})`);
    
    // Find Chaman Kumar
    const chaman = await Teacher.findOne({ username: 'chaman.kumar' });
    if (!chaman) {
      console.log('❌ Chaman Kumar not found');
      return;
    }
    
    console.log(`✅ Found teacher: ${chaman.name} (@${chaman.username})`);
    
    // Remove Computer Networks for BTech AIML Sem 5 from Chaman
    if (chaman.subjects.includes(computerNetworksAIML5._id)) {
      chaman.subjects = chaman.subjects.filter(id => !id.equals(computerNetworksAIML5._id));
      console.log('✅ Removed Computer Networks (BTech AIML Sem 5) from Chaman');
    }
    
    // Remove Lab - Computer Networks for BTech AIML Sem 5 from Chaman
    if (chaman.subjects.includes(labComputerNetworksAIML5._id)) {
      chaman.subjects = chaman.subjects.filter(id => !id.equals(labComputerNetworksAIML5._id));
      console.log('✅ Removed Lab - Computer Networks (BTech AIML Sem 5) from Chaman');
    }
    
    // Add Computer Networks for BCA FSD Sem 5 to Chaman (if not already there)
    if (!chaman.subjects.includes(computerNetworksBCA5._id)) {
      chaman.subjects.push(computerNetworksBCA5._id);
      console.log('✅ Added Computer Networks (BCA FSD Sem 5) to Chaman');
    }
    
    // Add Lab - Computer Networks for BCA FSD Sem 5 to Chaman (if not already there)
    if (!chaman.subjects.includes(labComputerNetworksBCA5._id)) {
      chaman.subjects.push(labComputerNetworksBCA5._id);
      console.log('✅ Added Lab - Computer Networks (BCA FSD Sem 5) to Chaman');
    }
    
    // Save changes
    await chaman.save();
    
    // Verify the changes
    const updatedChaman = await Teacher.findById(chaman._id)
      .populate({
        path: 'subjects',
        select: 'name code department semester',
        populate: {
          path: 'department',
          select: 'name code'
        }
      });
    
    console.log('\n📚 Chaman\'s Updated Subjects:');
    updatedChaman.subjects.forEach((subject, index) => {
      console.log(`${index + 1}. ${subject.name} - ${subject.department.name} Sem ${subject.semester}`);
    });
    
    // Verify Rupam still has Computer Networks for BTech AIML Sem 5
    const rupam = await Teacher.findOne({ username: 'rupam.sarmah' });
    if (rupam) {
      const rupamWithSubjects = await Teacher.findById(rupam._id)
        .populate({
          path: 'subjects',
          select: 'name code department semester',
          populate: {
            path: 'department',
            select: 'name code'
          }
        });
      
      const computerNetworksAIML5InRupam = rupamWithSubjects.subjects.find(s => 
        s.name === 'Computer Networks' && 
        s.department.name === 'BTech AIML' && 
        s.semester === 5
      );
      
      if (computerNetworksAIML5InRupam) {
        console.log('\n✅ Rupam still has Computer Networks (BTech AIML Sem 5)');
      } else {
        console.log('\n❌ Rupam is missing Computer Networks (BTech AIML Sem 5)');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

fixChamanComputerNetworks();
