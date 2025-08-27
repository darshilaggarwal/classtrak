const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

// Get distinct subjects from attendance records
const getDistinctSubjects = async () => {
  try {
    const subjects = await Attendance.distinct('subject');
    return subjects.sort();
  } catch (error) {
    console.error('Error getting distinct subjects:', error);
    return [];
  }
};

// Generate monthly attendance report
const generateMonthlyReport = async (month, year, subject = null) => {
  try {
    console.log(`Generating monthly report for ${month}/${year}, subject: ${subject || 'all'}`);
    
    // Get all students
    const students = await Student.find({}).sort({ rno: 1 });
    console.log(`Found ${students.length} students`);
    
    // Get all subjects (if not specified)
    const subjects = subject ? [subject] : await getDistinctSubjects();
    console.log(`Processing ${subjects.length} subjects:`, subjects);
    
    // Get attendance data for the month (don't filter by subject if 'all' is selected)
    const attendanceData = await Attendance.find({
      month: parseInt(month),
      year: parseInt(year)
    }).populate('records.studentId', 'name rno');
    
    console.log(`Found ${attendanceData.length} attendance records for ${month}/${year}`);
    
    // Calculate attendance for each student-subject combination
    const reportData = {
      month: parseInt(month),
      year: parseInt(year),
      totalStudents: students.length,
      totalSubjects: subjects.length,
      students: [],
      subjects: subjects,
      summary: {
        totalClasses: {},
        averageAttendance: {}
      }
    };
    
    // Process each student
    for (const student of students) {
      const studentData = {
        id: student._id,
        name: student.name,
        rollNumber: student.rno,
        subjects: {}
      };
      
      // Calculate attendance for each subject
      for (const subjectName of subjects) {
        const subjectAttendance = attendanceData.filter(
          record => record.subject === subjectName
        );
        
        const totalClasses = subjectAttendance.length;
        const presentClasses = subjectAttendance.reduce((count, record) => {
          const studentRecord = record.records.find(r => 
            r.studentId && r.studentId._id.toString() === student._id.toString()
          );
          return count + (studentRecord && studentRecord.status === 'present' ? 1 : 0);
        }, 0);
        
        const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
        
        studentData.subjects[subjectName] = {
          totalClasses,
          presentClasses,
          absentClasses: totalClasses - presentClasses,
          percentage
        };
      }
      
      reportData.students.push(studentData);
    }
    
    // Calculate summary statistics
    for (const subjectName of subjects) {
      const subjectData = reportData.students.map(s => s.subjects[subjectName]);
      const totalClasses = Math.max(...subjectData.map(d => d.totalClasses));
      const averagePercentage = subjectData.length > 0 ? 
        Math.round(subjectData.reduce((sum, d) => sum + d.percentage, 0) / subjectData.length) : 0;
      
      reportData.summary.totalClasses[subjectName] = totalClasses;
      reportData.summary.averageAttendance[subjectName] = averagePercentage;
    }
    
    console.log(`Monthly report generated successfully for ${month}/${year}`);
    return reportData;
  } catch (error) {
    console.error('Error generating monthly report:', error);
    throw error;
  }
};

module.exports = {
  generateMonthlyReport,
  getDistinctSubjects
};
