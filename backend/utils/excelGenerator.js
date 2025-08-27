const ExcelJS = require('exceljs');

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

const generateExcelReport = async (reportData) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Monthly Attendance');
    
    // Add title
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `Monthly Attendance Report - ${getMonthName(reportData.month)} ${reportData.year}`;
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };
    
    // Add summary
    worksheet.getCell('A3').value = 'Summary';
    worksheet.getCell('A3').font = { bold: true, size: 14 };
    
    worksheet.getCell('A4').value = 'Total Students:';
    worksheet.getCell('B4').value = reportData.totalStudents;
    
    worksheet.getCell('A5').value = 'Total Subjects:';
    worksheet.getCell('B5').value = reportData.totalSubjects;
    
    // Add subject summary only if multiple subjects
    if (reportData.subjects.length > 1) {
      worksheet.getCell('A7').value = 'Subject Summary';
      worksheet.getCell('A7').font = { bold: true, size: 14 };
      
      worksheet.getCell('A8').value = 'Subject';
      worksheet.getCell('B8').value = 'Total Classes';
      worksheet.getCell('C8').value = 'Average Attendance %';
      worksheet.getCell('A8').font = { bold: true };
      worksheet.getCell('B8').font = { bold: true };
      worksheet.getCell('C8').font = { bold: true };
      
      let summaryRow = 9;
      reportData.subjects.forEach(subject => {
        worksheet.getCell(`A${summaryRow}`).value = subject;
        worksheet.getCell(`B${summaryRow}`).value = reportData.summary.totalClasses[subject];
        worksheet.getCell(`C${summaryRow}`).value = reportData.summary.averageAttendance[subject];
        summaryRow++;
      });
    }
    
    // Add main table headers
    const tableStartRow = reportData.subjects.length > 1 ? 12 : 8;
    worksheet.getCell(`A${tableStartRow}`).value = 'Student Name';
    worksheet.getCell(`B${tableStartRow}`).value = 'Roll Number';
    
    // Add subject headers with "Present/Total" format
    reportData.subjects.forEach((subject, index) => {
      const col = String.fromCharCode(67 + index); // C, D, E, etc.
      worksheet.getCell(`${col}${tableStartRow}`).value = `${subject} (Present/Total)`;
    });
    
    // Add overall attendance header
    const overallCol = String.fromCharCode(67 + reportData.subjects.length);
    worksheet.getCell(`${overallCol}${tableStartRow}`).value = 'Overall Attendance %';
    
    // Style headers
    for (let i = 0; i < reportData.subjects.length + 3; i++) {
      const col = String.fromCharCode(65 + i);
      worksheet.getCell(`${col}${tableStartRow}`).font = { bold: true };
      worksheet.getCell(`${col}${tableStartRow}`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    }
    
    // Add data rows
    reportData.students.forEach((student, rowIndex) => {
      const dataRow = tableStartRow + 1 + rowIndex;
      
      worksheet.getCell(`A${dataRow}`).value = student.name;
      worksheet.getCell(`B${dataRow}`).value = student.rollNumber;
      
      // Calculate overall attendance
      let totalClasses = 0;
      let totalPresent = 0;
      
      reportData.subjects.forEach((subject, colIndex) => {
        const col = String.fromCharCode(67 + colIndex);
        const attendance = student.subjects[subject];
        
        if (attendance.totalClasses > 0) {
          worksheet.getCell(`${col}${dataRow}`).value = `${attendance.presentClasses}/${attendance.totalClasses}`;
          
          // Add percentage in next row for better readability
          const percentageCol = String.fromCharCode(67 + colIndex);
          worksheet.getCell(`${percentageCol}${dataRow + 1}`).value = `${attendance.percentage}%`;
          worksheet.getCell(`${percentageCol}${dataRow + 1}`).font = { size: 10, color: { argb: 'FF666666' } };
          
          totalClasses += attendance.totalClasses;
          totalPresent += attendance.presentClasses;
        } else {
          worksheet.getCell(`${col}${dataRow}`).value = 'N/A';
        }
      });
      
      // Overall attendance percentage
      const overallCol = String.fromCharCode(67 + reportData.subjects.length);
      const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
      worksheet.getCell(`${overallCol}${dataRow}`).value = overallPercentage;
      worksheet.getCell(`${overallCol}${dataRow}`).font = { bold: true };
      
      // Color code overall percentage
      if (overallPercentage >= 85) {
        worksheet.getCell(`${overallCol}${dataRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8F5E8' } // Light green
        };
      } else if (overallPercentage >= 75) {
        worksheet.getCell(`${overallCol}${dataRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF8E1' } // Light yellow
        };
      } else {
        worksheet.getCell(`${overallCol}${dataRow}`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEBEE' } // Light red
        };
      }
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    
    // Add borders
    const tableEndRow = tableStartRow + reportData.students.length;
    const tableEndCol = String.fromCharCode(65 + reportData.subjects.length + 2);
    
    worksheet.getCell(`A${tableStartRow}:${tableEndCol}${tableEndRow}`).border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    
    // Add footer
    const footerRow = tableEndRow + 3;
    worksheet.mergeCells(`A${footerRow}:${tableEndCol}${footerRow}`);
    worksheet.getCell(`A${footerRow}`).value = `Report generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`;
    worksheet.getCell(`A${footerRow}`).alignment = { horizontal: 'center' };
    worksheet.getCell(`A${footerRow}`).font = { size: 10, color: { argb: 'FF666666' } };
    
    return await workbook.xlsx.writeBuffer();
  } catch (error) {
    console.error('Error generating Excel report:', error);
    throw error;
  }
};

module.exports = {
  generateExcelReport
};
