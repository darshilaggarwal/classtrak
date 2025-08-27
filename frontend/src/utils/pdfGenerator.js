// PDF and CSV generators for attendance reports
export const downloadAttendancePDF = async (params = {}) => {
  try {
    // Import the API function dynamically to avoid circular dependencies
    const { adminAPI } = await import('../services/api');
    
    const response = await adminAPI.generateAttendancePDF(params);
    
    if (response.success) {
      // For now, create a simple CSV export (will be enhanced with jsPDF)
      const { students, subjects, summary, dateRange, generatedAt } = response.data;
      
      // Create CSV content
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      // Add header
      csvContent += 'Student Attendance Matrix Report\n';
      csvContent += `Date Range: ${dateRange}\n`;
      csvContent += `Generated on: ${generatedAt}\n\n`;
      
      // Add summary
      csvContent += 'Summary\n';
      csvContent += `Total Students,${summary.totalStudents}\n`;
      csvContent += `Total Classes,${summary.totalClasses}\n`;
      csvContent += `Total Subjects,${summary.totalSubjects}\n`;
      csvContent += `Average Attendance,${summary.averageAttendance}%\n\n`;
      
      // Add table headers
      const headers = ['Student Name', 'Roll No', 'Department', 'Batch'];
      subjects.forEach(subject => {
        headers.push(subject);
      });
      headers.push('Overall');
      csvContent += headers.join(',') + '\n';
      
      // Add student data
      students.forEach(student => {
        const row = [
          student.studentName,
          student.rollNumber,
          student.department,
          student.batch
        ];
        
        // Add subject columns
        subjects.forEach(subject => {
          const subjectData = student.subjects[subject];
          if (subjectData.totalClasses > 0) {
            row.push(`${subjectData.percentage}% (${subjectData.presentClasses}/${subjectData.totalClasses})`);
          } else {
            row.push('N/A');
          }
        });
        
        // Add overall column
        row.push(`${student.overallPercentage}% (${student.totalPresent}/${student.totalClasses})`);
        
        csvContent += row.join(',') + '\n';
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `attendance_matrix_${date}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, filename };
    } else {
      throw new Error(response.message || 'Failed to generate PDF data');
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};

// Separate function for CSV download
export const downloadAttendanceCSV = async (params = {}) => {
  try {
    // Import the API function dynamically to avoid circular dependencies
    const { adminAPI } = await import('../services/api');
    
    const response = await adminAPI.generateAttendancePDF(params);
    
    if (response.success) {
      const { students, subjects, summary, dateRange, generatedAt } = response.data;
      
      // Create CSV content
      let csvContent = 'data:text/csv;charset=utf-8,';
      
      // Add header
      csvContent += 'Student Attendance Matrix Report\n';
      csvContent += `Date Range: ${dateRange}\n`;
      csvContent += `Generated on: ${generatedAt}\n\n`;
      
      // Add summary
      csvContent += 'Summary\n';
      csvContent += `Total Students,${summary.totalStudents}\n`;
      csvContent += `Total Classes,${summary.totalClasses}\n`;
      csvContent += `Total Subjects,${summary.totalSubjects}\n`;
      csvContent += `Average Attendance,${summary.averageAttendance}%\n\n`;
      
      // Add table headers
      const headers = ['Student Name', 'Roll No', 'Department', 'Batch'];
      subjects.forEach(subject => {
        headers.push(subject);
      });
      headers.push('Overall');
      csvContent += headers.join(',') + '\n';
      
      // Add student data
      students.forEach(student => {
        const row = [
          student.studentName,
          student.rollNumber,
          student.department,
          student.batch
        ];
        
        // Add subject columns
        subjects.forEach(subject => {
          const subjectData = student.subjects[subject];
          if (subjectData.totalClasses > 0) {
            row.push(`${subjectData.percentage}% (${subjectData.presentClasses}/${subjectData.totalClasses})`);
          } else {
            row.push('N/A');
          }
        });
        
        // Add overall column
        row.push(`${student.overallPercentage}% (${student.totalPresent}/${student.totalClasses})`);
        
        csvContent += row.join(',') + '\n';
      });
      
      // Create download link
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      
      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      const filename = `attendance_matrix_${date}.csv`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, filename };
    } else {
      throw new Error(response.message || 'Failed to generate CSV data');
    }
  } catch (error) {
    console.error('CSV generation error:', error);
    throw error;
  }
};

// Enhanced PDF generation with jsPDF (will be used when dependencies are installed)
export const generateAttendancePDF = async (params = {}) => {
  try {
    // For now, just return a message that PDF generation requires dependencies
    console.log('PDF generation requires jsPDF dependencies. Please run: npm install jspdf jspdf-autotable');
    
    // Fall back to CSV for now
    return await downloadAttendanceCSV(params);
  } catch (error) {
    console.error('PDF generation error:', error);
    throw error;
  }
};
