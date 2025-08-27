const mongoose = require('mongoose');
const Teacher = require('./models/Teacher');
const Subject = require('./models/Subject');
const Department = require('./models/Department');
require('dotenv').config();

async function importTeachersStructured() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('\n🔧 Importing Teachers with Structured Data...\n');

    // Sample data - replace this with your actual JSON data
    const teacherData = {
      "teachers": [
        {
          "name": "Mr. Chaman Kumar",
          "email": "chaman.kumar@imaginxp.com",
          "username": "chaman.kumar",
          "phone": "9876543210",
          "subjects": [
            {
              "name": "Introduction to Machine Learning",
              "code": "INT",
              "course": "BTech AIML",
              "semester": 1
            },
            {
              "name": "Computer Networks",
              "code": "COM",
              "course": "BCA FSD",
              "semester": 5
            },
            {
              "name": "Lab - Computer Networks",
              "code": "LAB",
              "course": "BCA FSD",
              "semester": 5
            },
            {
              "name": "Lab - Introduction to Machine Learning",
              "code": "LAB",
              "course": "BTech AIML",
              "semester": 1
            }
          ]
        },
        {
          "name": "Mr. Keshav Gupta",
          "email": "keshav.gupta@imaginxp.com",
          "username": "keshav.gupta",
          "phone": "9876543211",
          "subjects": [
            {
              "name": "Data Mining and Prediction by Machines",
              "code": "DMP",
              "course": "BTech AIML",
              "semester": 5
            },
            {
              "name": "Theory of Automation",
              "code": "TOA",
              "course": "BCA FSD",
              "semester": 3
            },
            {
              "name": "Advance Java",
              "code": "AJV",
              "course": "BTech FSD",
              "semester": 5
            },
            {
              "name": "Lab - Advance Java",
              "code": "LAB",
              "course": "BTech FSD",
              "semester": 5
            }
          ]
        }
      ]
    };

    // Get all departments for mapping
    const departments = await Department.find();
    const deptMap = {};
    departments.forEach(dept => {
      deptMap[dept.name] = dept._id;
    });

    console.log('🎓 Available Departments:');
    Object.keys(deptMap).forEach(name => {
      console.log(`   - ${name}`);
    });

    let importedCount = 0;

    for (const teacherInfo of teacherData.teachers) {
      console.log(`\n👤 Processing: ${teacherInfo.name}`);
      
      // Check if teacher already exists
      const existingTeacher = await Teacher.findOne({ email: teacherInfo.email });
      if (existingTeacher) {
        console.log(`   ⚠️  Teacher already exists, skipping...`);
        continue;
      }

      // Process subjects and find/create them
      const subjectIds = [];
      const courseIds = new Set();

      for (const subjectInfo of teacherInfo.subjects) {
        console.log(`   📚 Processing subject: ${subjectInfo.name}`);
        
        // Find or create subject
        let subject = await Subject.findOne({ 
          name: subjectInfo.name,
          code: subjectInfo.code 
        });

        if (!subject) {
          // Create new subject
          const departmentId = deptMap[subjectInfo.course];
          if (!departmentId) {
            console.log(`   ❌ Course not found: ${subjectInfo.course}`);
            continue;
          }

          subject = new Subject({
            name: subjectInfo.name,
            code: subjectInfo.code,
            department: departmentId,
            semester: subjectInfo.semester,
            credits: 3
          });
          await subject.save();
          console.log(`   ✅ Created new subject: ${subjectInfo.name}`);
        } else {
          // Update existing subject if needed
          const departmentId = deptMap[subjectInfo.course];
          if (departmentId && subject.department.toString() !== departmentId.toString()) {
            subject.department = departmentId;
            subject.semester = subjectInfo.semester;
            await subject.save();
            console.log(`   🔄 Updated subject: ${subjectInfo.name}`);
          }
        }

        subjectIds.push(subject._id);
        courseIds.add(subject.department.toString());
      }

      // Create teacher
      const teacher = new Teacher({
        name: teacherInfo.name,
        email: teacherInfo.email,
        username: teacherInfo.username,
        phone: teacherInfo.phone,
        subjects: subjectIds,
        courses: Array.from(courseIds),
        isActive: true,
        isFirstLogin: true,
        emailVerified: false
      });

      await teacher.save();
      importedCount++;

      console.log(`   ✅ Created teacher: ${teacherInfo.name}`);
      console.log(`   📚 Subjects: ${subjectIds.length}`);
      console.log(`   🎓 Courses: ${courseIds.size}`);
    }

    console.log(`\n🎉 Successfully imported ${importedCount} teachers`);

    // Verify the import
    console.log('\n🔍 Verification:');
    const teachers = await Teacher.find().populate('subjects').populate('courses');
    teachers.forEach(teacher => {
      console.log(`\n👤 ${teacher.name}:`);
      console.log(`   📚 Subjects: ${teacher.subjects.length}`);
      teacher.subjects.forEach(subject => {
        console.log(`      - ${subject.name} (${subject.department})`);
      });
      console.log(`   🎓 Courses: ${teacher.courses.length}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

importTeachersStructured();
