const mongoose = require('mongoose');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding...');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

// Real students data
const sampleStudents = [
  {"name": "Aashima", "email": "aashimabhatia2005@gmail.com", "rno": "021323001"},
  {"name": "Amit Kumar", "email": "shoyamato3607646@gmail.com", "rno": "021323002"},
  {"name": "Ansh Rathi", "email": "sonurathicisf78@gmail.com", "rno": "021323004"},
  {"name": "Aryan Raj", "email": "aryanraj194005@gmail.com", "rno": "021323005"},
  {"name": "Charvi Aggarwal", "email": "charviaggarwal2005@gmail.com", "rno": "021323006"},
  {"name": "Chhaya", "email": "chhayashukla427@gmail.com", "rno": "021323007"},
  {"name": "Darshil Aggarwal", "email": "darshilaggarwal11@gmail.com", "rno": "021323008"},
  {"name": "Diksha", "email": "chauhandiksha624@gmail.com", "rno": "021323009"},
  {"name": "Divyansh Kashyap", "email": "divyanshkashyap009@gmail.com", "rno": "021323010"},
  {"name": "Divye Raj Sharma", "email": "Sumansharmagjk@gmail.com", "rno": "021323011"},
  {"name": "Harsh Bardhan", "email": "harshbardhan274@gmail.com", "rno": "021323012"},
  {"name": "Harsh Das", "email": "harsh95hd@gmail.com", "rno": "021323013"},
  {"name": "Harsh Sharma", "email": "harsh12356789sharma@gmail.com", "rno": "021323014"},
  {"name": "Himanshu", "email": "hvats290@gmail.com", "rno": "021323015"},
  {"name": "Hriday Luthra", "email": "Vikasluthra3079@gmail.com", "rno": "021323016"},
  {"name": "Ishika Verma", "email": "ishika.soni2424@gmail.com", "rno": "021323017"},
  {"name": "Lakshita", "email": "lakshitas358@gmail.com", "rno": "021323018"},
  {"name": "Mahi Kashyap", "email": "Kashyapraju306@gmail.com", "rno": "021323019"},
  {"name": "Manpreet Singh", "email": "mannusingh90523@gmail.com", "rno": "021323020"},
  {"name": "Meenakshi Kumari", "email": "Mkmeenakshi24@gmail.com", "rno": "021323022"},
  {"name": "Mehak Tyagi", "email": "tyagimehak488@gmail.com", "rno": "021323023"},
  {"name": "Mohak Jain", "email": "mmmk.jain@gmail.com", "rno": "021323024"},
  {"name": "Nandini Thapliyal", "email": "nandinithapliyal8@gmail.com", "rno": "021323025"},
  {"name": "Nishant Yadav", "email": "Yadavnishant83739@gmail.com", "rno": "021323026"},
  {"name": "Nitin", "email": "nitin122020@gmail.com", "rno": "021323027"},
  {"name": "Paritosh Bhardwaj", "email": "paritoshbhardwaj499@gmail.com", "rno": "021323028"},
  {"name": "Parth Talwar", "email": "talwarparth7@gmail.com", "rno": "021323029"},
  {"name": "Rahul Kumar Prajapati", "email": "rahulkumarprajapati9681@gmail.com", "rno": "021323030"},
  {"name": "Rajveer Singh", "email": "rajveersingh26103@gmail.com", "rno": "021323031"},
  {"name": "Riddhi Gupta", "email": "sgupta73332@gmail.com", "rno": "021323032"},
  {"name": "Sakshi Bisht", "email": "sakshibisht0201@gmail.com", "rno": "021323034"},
  {"name": "Saral Pandey", "email": "anshupandey46331@gmail.com", "rno": "021323035"},
  {"name": "Satyam Kumar Jha", "email": "jhasatyam.official@gmail.com", "rno": "021323036"},
  {"name": "Shreyansh Jain", "email": "Shreyanshj690@gmail.com", "rno": "021323037"},
  {"name": "Sintu Kumar", "email": "seenukp38@gmail.com", "rno": "021323038"},
  {"name": "Tia Panwar", "email": "Tira00416@gmail.com", "rno": "021323039"},
  {"name": "Yashraj Lamba", "email": "lambaneetu17@gmail.com", "rno": "021323040"},
  {"name": "Yug Sharma", "email": "yugsharma180@gmail.com", "rno": "021323041"},
  {"name": "Abhishek Saxena", "email": "itzabhishekjazz@gmail.com", "rno": "021723001"},
  {"name": "Pujeet Gupta", "email": "Pujeetgupta3695@gmail.com", "rno": "021723004"},
  {"name": "Vaibhav Mishra", "email": "vvaibhav.mishra.2.0.0.1@gmail.com", "rno": "021723009"},
  {"name": "Aditya Gupta", "email": "10b28aditya@gmail.com", "rno": "021723002"},
  {"name": "Deepanshu Yadav", "email": "raodeepanshu5000@gmail.com", "rno": "021723003"},
  {"name": "Rohit", "email": "rohitsharma11055@gmail.com", "rno": "021723005"},
  {"name": "Ronit Budhwar", "email": "ronitbudhwar946@gmail.com", "rno": "021723006"},
  {"name": "Siddharth", "email": "siddharth220605@gmail.com", "rno": "021723007"}
];

// Sample teachers data
// Note: Teachers are now imported through admin interface
// No hardcoded teacher data needed
const sampleTeachers = [];

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await Student.deleteMany({});
    await Teacher.deleteMany({});
    console.log('Cleared existing data...');

    // Insert students
    const students = await Student.insertMany(sampleStudents);
    console.log(`Inserted ${students.length} students`);

    // Note: Teachers are now imported through admin interface
    console.log('Teachers will be imported through admin dashboard');

    console.log('\n=== SEED DATA SUMMARY ===');
    console.log('\nStudents:');
    students.forEach(student => {
      console.log(`- ${student.name} (${student.rno}) - ${student.email}`);
    });

    console.log('\nTeachers:');
    console.log('- Teachers will be imported through admin dashboard');

    console.log('\n=== NEXT STEPS ===');
    console.log('1. Students can login using their roll number (e.g., CS001)');
    console.log('2. Import teachers through admin dashboard');
    console.log('3. Teachers can login using their email address');
    console.log('4. Both will receive OTP on first login to set up password');
    console.log('5. Make sure to configure your email settings in .env file');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedData();
}

module.exports = { seedData, sampleStudents, sampleTeachers };
