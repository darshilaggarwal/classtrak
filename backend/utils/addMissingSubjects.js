const mongoose = require('mongoose');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Missing departments to add
const missingDepartments = [
  {
    name: 'B.Tech CS AIML',
    code: 'BTECH_CS_AIML',
    description: 'Bachelor of Technology in Computer Science with Artificial Intelligence & Machine Learning'
  },
  {
    name: 'B.Tech FSD',
    code: 'BTECH_FSD',
    description: 'Bachelor of Technology in Full Stack Development'
  },
  {
    name: 'B.Design',
    code: 'BDESIGN',
    description: 'Bachelor of Design'
  }
];

// Missing subjects to add
const missingSubjects = [
  // BBA DM Subjects
  {
    name: 'Principles of Management',
    code: 'POM',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 3
  },
  {
    name: 'Human Resource Management',
    code: 'HRM',
    department: 'BBA Digital Marketing',
    semester: 3,
    credits: 3
  },
  {
    name: 'Micro Economics',
    code: 'MICRO_ECO',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 3
  },
  {
    name: 'Environmental Studies',
    code: 'ENV_STUDIES',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 2
  },
  {
    name: 'Lead Generation & Funnel Management',
    code: 'LEAD_GEN',
    department: 'BBA Digital Marketing',
    semester: 3,
    credits: 3
  },
  {
    name: 'Influencer Marketing',
    code: 'INFLUENCER_MKT',
    department: 'BBA Digital Marketing',
    semester: 5,
    credits: 3
  },
  {
    name: 'Email Marketing & Optimisation',
    code: 'EMAIL_MKT',
    department: 'BBA Digital Marketing',
    semester: 5,
    credits: 3
  },
  {
    name: 'Search Engine Marketing',
    code: 'SEM',
    department: 'BBA Digital Marketing',
    semester: 3,
    credits: 3
  },
  {
    name: 'Legal Aspects of Business',
    code: 'LEGAL_BUS',
    department: 'BBA Digital Marketing',
    semester: 3,
    credits: 3
  },
  {
    name: 'Critical Thinking',
    code: 'CRITICAL_THINK',
    department: 'BCA Full Stack Development',
    semester: 5,
    credits: 3
  },

  // B.Tech CS AIML Subjects
  {
    name: 'Constitutional Values and Fundamental Rights & Duties',
    code: 'CONST_VALUES',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 2
  },
  {
    name: 'Software Testing',
    code: 'SOFTWARE_TEST',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 3
  },
  {
    name: 'Algorithm Analysis and Design',
    code: 'ALGO_ANALYSIS',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 4
  },
  {
    name: 'Lab - Algorithm Analysis and Design',
    code: 'LAB_ALGO',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 1
  },
  {
    name: 'Lab - Software Testing',
    code: 'LAB_SOFTWARE_TEST',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 1
  },
  {
    name: 'Blockchain Technology',
    code: 'BLOCKCHAIN',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 3
  },
  {
    name: 'Lab - Operating System',
    code: 'LAB_OS',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 1
  },
  {
    name: 'Introduction to Machine Learning',
    code: 'INTRO_ML',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 4
  },
  {
    name: 'Lab - Introduction to Machine Learning',
    code: 'LAB_ML',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 1
  },
  {
    name: 'Human Computer Interaction',
    code: 'HCI',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 3
  },
  {
    name: 'Data Mining and Prediction by Machines',
    code: 'DATA_MINING',
    department: 'B.Tech CS AIML',
    semester: 5,
    credits: 3
  },
  {
    name: 'Lab - Data Visualization using Power BI',
    code: 'LAB_POWERBI',
    department: 'B.Tech CS AIML',
    semester: 1,
    credits: 1
  },
  {
    name: 'Software Product Management',
    code: 'SOFTWARE_PM',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 3
  },
  {
    name: 'Lab - Computer Networks',
    code: 'LAB_CN',
    department: 'B.Tech CS AIML',
    semester: 5,
    credits: 1
  },
  {
    name: 'Lab - Human Machine Interface',
    code: 'LAB_HMI',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 1
  },
  {
    name: 'Modern Web Development',
    code: 'MODERN_WEB',
    department: 'B.Tech CS AIML',
    semester: 7,
    credits: 3
  },
  {
    name: 'Lab - Data and Visual Analytics in AI',
    code: 'LAB_DATA_ANALYTICS',
    department: 'B.Tech CS AIML',
    semester: 5,
    credits: 1
  },
  {
    name: 'Lab - Natural Language Processing',
    code: 'LAB_NLP',
    department: 'B.Tech CS AIML',
    semester: 5,
    credits: 1
  },
  {
    name: 'Natural Language Processing (NLP) and Text Analysis',
    code: 'NLP_TEXT',
    department: 'B.Tech CS AIML',
    semester: 5,
    credits: 3
  },
  {
    name: 'Lab - Programming Fundamentals using C',
    code: 'LAB_C_PROG',
    department: 'B.Tech CS AIML',
    semester: 1,
    credits: 1
  },
  {
    name: 'Programming Fundamentals using C',
    code: 'C_PROGRAMMING',
    department: 'B.Tech CS AIML',
    semester: 1,
    credits: 4
  },
  {
    name: 'Theory of Computation',
    code: 'THEORY_COMP',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 3
  },
  {
    name: 'Engineering Mathematics - I',
    code: 'ENG_MATH_1',
    department: 'B.Tech CS AIML',
    semester: 1,
    credits: 4
  },
  {
    name: 'Discrete Mathematics',
    code: 'DISCRETE_MATH',
    department: 'B.Tech CS AIML',
    semester: 3,
    credits: 3
  },
  {
    name: 'Modern Computer Architecture',
    code: 'MODERN_COMP_ARCH',
    department: 'BTech AIML',
    semester: 3,
    credits: 3
  },

  // BCA FSD Subjects
  {
    name: 'Digital Empowerment',
    code: 'DIGITAL_EMP',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 3
  },
  {
    name: 'Data Structures using C',
    code: 'DS_C',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 4
  },
  {
    name: 'Lab - Data Structures using C',
    code: 'LAB_DS_C',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 1
  },
  {
    name: 'Theory of Automation',
    code: 'THEORY_AUTO',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 3
  },
  {
    name: 'Advance Java',
    code: 'ADV_JAVA',
    department: 'BCA Full Stack Development',
    semester: 5,
    credits: 4
  },
  {
    name: 'Lab - Advance Java',
    code: 'LAB_ADV_JAVA',
    department: 'BCA Full Stack Development',
    semester: 5,
    credits: 1
  },
  {
    name: 'Procedure Oriented Programming Using C',
    code: 'POP_C',
    department: 'BCA Full Stack Development',
    semester: 1,
    credits: 4
  },
  {
    name: 'Lab - Procedure Oriented Programming Using C',
    code: 'LAB_POP_C',
    department: 'BCA Full Stack Development',
    semester: 1,
    credits: 1
  },
  {
    name: 'Software Engineering',
    code: 'SOFTWARE_ENG',
    department: 'BCA Full Stack Development',
    semester: 5,
    credits: 3
  },
  {
    name: 'Computer Organization and Architecture',
    code: 'COA',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 3
  },
  {
    name: 'Lab - Full Stack Development',
    code: 'LAB_FSD',
    department: 'BCA Full Stack Development',
    semester: 5,
    credits: 1
  },
  {
    name: 'Lab - Procedure Oriented Programming Using C',
    code: 'LAB_POP_C_FSD',
    department: 'B.Tech FSD',
    semester: 1,
    credits: 1
  },
  {
    name: 'Introduction of Web Design and Development',
    code: 'WEB_DESIGN_DEV',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 3
  },
  {
    name: 'Lab - Introduction of Web Design and Development',
    code: 'LAB_WEB_DESIGN',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 1
  },
  {
    name: 'Lab - Front-End Web Development',
    code: 'LAB_FRONTEND',
    department: 'BCA Full Stack Development',
    semester: 3,
    credits: 1
  },
  {
    name: 'Lab - Computer Fundamentals and Applications',
    code: 'LAB_CFA',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 1
  },
  {
    name: 'English and Communication Skills',
    code: 'ENG_COMM',
    department: 'BBA Digital Marketing',
    semester: 1,
    credits: 3
  },
  {
    name: 'Introduction to Visual Design',
    code: 'INTRO_VISUAL',
    department: 'B.Tech CS AIML',
    semester: 1,
    credits: 3
  },

  // B.Design Subjects
  {
    name: 'Gamification and UX Design',
    code: 'GAMIFICATION_UX',
    department: 'B.Design',
    semester: 7,
    credits: 3
  },
  {
    name: 'Discipline Centric Elective',
    code: 'DISC_ELECTIVE',
    department: 'B.Design',
    semester: 7,
    credits: 3
  },
  {
    name: 'Wireframing and Prototyping',
    code: 'WIREFRAMING',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Sketching and Drawing',
    code: 'SKETCHING',
    department: 'B.Design',
    semester: 1,
    credits: 3
  },
  {
    name: 'Innovation Management',
    code: 'INNOVATION_MGT',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Design Philosophy',
    code: 'DESIGN_PHIL',
    department: 'B.Design',
    semester: 1,
    credits: 3
  },
  {
    name: 'Sustainable Design',
    code: 'SUSTAINABLE_DESIGN',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'UX And Digitization',
    code: 'UX_DIGITIZATION',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Introduction to Design Thinking and UX',
    code: 'INTRO_DT_UX',
    department: 'B.Design',
    semester: 1,
    credits: 3
  },
  {
    name: 'Designing for IOT',
    code: 'DESIGN_IOT',
    department: 'B.Design',
    semester: 7,
    credits: 3
  },
  {
    name: 'Human Machine Interface',
    code: 'HMI',
    department: 'B.Design',
    semester: 7,
    credits: 3
  },
  {
    name: 'Fundamental of Design',
    code: 'FUND_DESIGN',
    department: 'B.Design',
    semester: 1,
    credits: 3
  },
  {
    name: 'Usability Testing',
    code: 'USABILITY_TEST',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Product Design and Lifecycle Management',
    code: 'PRODUCT_DESIGN',
    department: 'B.Design',
    semester: 7,
    credits: 3
  },
  {
    name: 'Visual Design Tools & Advance',
    code: 'VISUAL_TOOLS',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Technology in Experience Design Advance',
    code: 'TECH_EXP_DESIGN',
    department: 'B.Design',
    semester: 5,
    credits: 3
  },
  {
    name: 'Design Communication and Visualizing Ideas',
    code: 'DESIGN_COMM',
    department: 'B.Design',
    semester: 1,
    credits: 3
  },

  // B.Tech FSD Subjects
  {
    name: 'Full Stack Development',
    code: 'FSD',
    department: 'B.Tech FSD',
    semester: 5,
    credits: 4
  },
  {
    name: 'Lab - Full Stack Development',
    code: 'LAB_FSD_BTECH',
    department: 'B.Tech FSD',
    semester: 5,
    credits: 1
  }
];

const addMissingData = async () => {
  try {
    await connectDB();
    console.log('🔄 Starting to add missing departments and subjects...\n');

    // Add missing departments
    console.log('📚 Adding missing departments...');
    for (const deptData of missingDepartments) {
      const existingDept = await Department.findOne({ code: deptData.code });
      if (!existingDept) {
        const dept = new Department(deptData);
        await dept.save();
        console.log(`  ✅ Added department: ${dept.name} (${dept.code})`);
      } else {
        console.log(`  ⏭️  Department already exists: ${deptData.name}`);
      }
    }

    // Get all departments for mapping
    const allDepartments = await Department.find({});
    console.log(`\n📖 Found ${allDepartments.length} departments total`);

    // Add missing subjects
    console.log('\n📚 Adding missing subjects...');
    for (const subjectData of missingSubjects) {
      const existingSubject = await Subject.findOne({ code: subjectData.code });
      if (!existingSubject) {
        // Find department
        const dept = allDepartments.find(d => d.name === subjectData.department);
        if (dept) {
          const subject = new Subject({
            name: subjectData.name,
            code: subjectData.code,
            department: dept._id,
            semester: subjectData.semester,
            credits: subjectData.credits,
            description: `${subjectData.name} - Semester ${subjectData.semester}`
          });
          await subject.save();
          console.log(`  ✅ Added subject: ${subject.name} (${subject.code}) - ${dept.name}`);
        } else {
          console.log(`  ⚠️  Department not found for subject: ${subjectData.name} - ${subjectData.department}`);
        }
      } else {
        console.log(`  ⏭️  Subject already exists: ${subjectData.name}`);
      }
    }

    console.log('\n🎉 Missing data addition completed!');
    
    // Display final summary
    const finalDeptCount = await Department.countDocuments();
    const finalSubjectCount = await Subject.countDocuments();
    console.log(`\n📊 Final Summary:`);
    console.log(`   Total Departments: ${finalDeptCount}`);
    console.log(`   Total Subjects: ${finalSubjectCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding missing data:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  addMissingData();
}

module.exports = { addMissingData, missingDepartments, missingSubjects };
