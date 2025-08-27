const PDFDocument = require('pdfkit');

const getMonthName = (month) => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
};

const splitSubjectName = (subjectName) => {
  const words = subjectName.split(' ');
  if (words.length === 1) {
    return { top: subjectName, bottom: '' };
  } else if (words.length === 2) {
    return { top: words[0], bottom: words[1] };
  } else {
    // For longer names, split more intelligently
    const mid = Math.ceil(words.length / 2);
    return { 
      top: words.slice(0, mid).join(' '), 
      bottom: words.slice(mid).join(' ') 
    };
  }
};

// Function to draw headers on any page
const drawTableHeaders = (doc, reportData, currentY, studentColWidth, rollColWidth, subjectColWidth, overallColWidth, pageWidth) => {
  // Draw main table border with increased height for better subject name fit
  const headerHeight = 45; // Increased from 35 to 45 for better fit
  doc.rect(20, currentY - 5, pageWidth, headerHeight).stroke();
  
  // Student Name header
  doc.rect(20, currentY - 5, studentColWidth, headerHeight).stroke();
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#000000');
  doc.text('Student Name', 25, currentY, { width: studentColWidth - 10, align: 'center' });
  
  // Roll Number header
  doc.rect(20 + studentColWidth, currentY - 5, rollColWidth, headerHeight).stroke();
  doc.text('Roll No.', 25 + studentColWidth, currentY, { width: rollColWidth - 10, align: 'center' });
  
  // Subject headers with increased space
  reportData.subjects.forEach((subject, index) => {
    const x = 20 + studentColWidth + rollColWidth + (index * subjectColWidth);
    const splitName = splitSubjectName(subject);
    
    // Draw subject header border
    doc.rect(x, currentY - 5, subjectColWidth, headerHeight).stroke();
    
    // Subject name background - increased height
    doc.rect(x, currentY - 5, subjectColWidth, 30).fill('#f8f9fa');
    doc.rect(x, currentY - 5, subjectColWidth, 30).stroke();
    
    // Add subject name with better spacing
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#000000');
    doc.text(splitName.top, x + 2, currentY + 2, { width: subjectColWidth - 4, align: 'center' });
    if (splitName.bottom) {
      doc.fontSize(9).font('Helvetica-Bold').text(splitName.bottom, x + 2, currentY + 12, { width: subjectColWidth - 4, align: 'center' });
    }
    
    // Add "Present/Total" label with more space
    doc.fontSize(7).font('Helvetica').fillColor('#666666');
    doc.text('Present/Total', x + 2, currentY + 28, { width: subjectColWidth - 4, align: 'center' });
  });
  
  // Overall header with increased height
  const overallX = 20 + studentColWidth + rollColWidth + (reportData.subjects.length * subjectColWidth);
  doc.rect(overallX, currentY - 5, overallColWidth, headerHeight).stroke();
  
  // Overall header background - increased height
  doc.rect(overallX, currentY - 5, overallColWidth, 30).fill('#2196f3');
  doc.rect(overallX, currentY - 5, overallColWidth, 30).stroke();
  
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#ffffff');
  doc.text('Overall', overallX + 2, currentY + 2, { width: overallColWidth - 4, align: 'center' });
  doc.fontSize(8).font('Helvetica-Bold').text('Attendance %', overallX + 2, currentY + 12, { width: overallColWidth - 4, align: 'center' });
  
  doc.fontSize(7).font('Helvetica').fillColor('#ffffff');
  doc.text('Combined', overallX + 2, currentY + 28, { width: overallColWidth - 4, align: 'center' });
};

const generatePDFReport = async (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 20,
        size: 'A4'
      });
      const chunks = [];
      
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Professional header
      doc.fontSize(24).font('Helvetica-Bold').fillColor('#1a1a1a').text('Monthly Attendance Report', { align: 'center' });
      doc.fontSize(16).font('Helvetica').fillColor('#666666').text(`${getMonthName(reportData.month)} ${reportData.year}`, { align: 'center' });
      doc.moveDown(0.5);
      
      // Calculate page dimensions for better layout
      const pageWidth = doc.page.width - 40;
      const studentColWidth = 120;
      const rollColWidth = 80;
      const overallColWidth = 100;
      const remainingWidth = pageWidth - studentColWidth - rollColWidth - overallColWidth;
      const subjectColWidth = remainingWidth / reportData.subjects.length;
      
      let currentY = doc.y + 15;
      const rowHeight = 35; // Increased row height for better spacing
      
      // Draw initial headers
      drawTableHeaders(doc, reportData, currentY, studentColWidth, rollColWidth, subjectColWidth, overallColWidth, pageWidth);
      currentY += 50; // Increased from 40 to 50 to account for larger header
      
      // Table data with professional styling
      doc.fontSize(9).font('Helvetica');
      
      reportData.students.forEach((student, rowIndex) => {
        // Check if we need a new page
        if (currentY > doc.page.height - 120) {
          doc.addPage();
          currentY = 30;
          
          // Redraw headers for new page
          drawTableHeaders(doc, reportData, currentY, studentColWidth, rollColWidth, subjectColWidth, overallColWidth, pageWidth);
          currentY += 50; // Increased from 40 to 50
        }
        
        // Draw row border
        doc.rect(20, currentY - 2, pageWidth, rowHeight).stroke();
        
        // Alternate row background for better readability
        if (rowIndex % 2 === 0) {
          doc.rect(20, currentY - 2, pageWidth, rowHeight).fill('#f8f9fa');
        }
        
        // Draw column separators
        doc.rect(20, currentY - 2, pageWidth, rowHeight).stroke();
        doc.rect(20 + studentColWidth, currentY - 2, rollColWidth, rowHeight).stroke();
        
        reportData.subjects.forEach((subject, colIndex) => {
          const x = 20 + studentColWidth + rollColWidth + (colIndex * subjectColWidth);
          doc.rect(x, currentY - 2, subjectColWidth, rowHeight).stroke();
        });
        
        doc.rect(20 + studentColWidth + rollColWidth + (reportData.subjects.length * subjectColWidth), currentY - 2, overallColWidth, rowHeight).stroke();
        
        // Student name
        const studentName = student.name.length > 18 ? student.name.substring(0, 18) + '...' : student.name;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text(studentName, 25, currentY + 5, { width: studentColWidth - 10, align: 'left' });
        
        // Roll number
        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        doc.text(student.rollNumber, 25 + studentColWidth, currentY + 5, { width: rollColWidth - 10, align: 'center' });
        
        // Calculate overall attendance
        let totalClasses = 0;
        let totalPresent = 0;
        
        // Subject attendance details
        reportData.subjects.forEach((subject, colIndex) => {
          const attendance = student.subjects[subject];
          const x = 20 + studentColWidth + rollColWidth + (colIndex * subjectColWidth);
          
          if (attendance.totalClasses > 0) {
            // Show "Present/Total" format
            const attendanceText = `${attendance.presentClasses}/${attendance.totalClasses}`;
            doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
            doc.text(attendanceText, x + 2, currentY + 5, { width: subjectColWidth - 4, align: 'center' });
            
            // Add percentage below with color coding
            doc.fontSize(8).font('Helvetica');
            const percentage = attendance.percentage;
            let color = '#1a1a1a';
            if (percentage >= 85) color = '#2e7d32'; // Green
            else if (percentage >= 75) color = '#f57c00'; // Orange
            else color = '#d32f2f'; // Red
            
            doc.fillColor(color).text(`${percentage}%`, x + 2, currentY + 18, { width: subjectColWidth - 4, align: 'center' });
            
            totalClasses += attendance.totalClasses;
            totalPresent += attendance.presentClasses;
          } else {
            doc.fontSize(8).font('Helvetica').fillColor('#999999');
            doc.text('N/A', x + 2, currentY + 10, { width: subjectColWidth - 4, align: 'center' });
          }
        });
        
        // Overall attendance
        const overallX = 20 + studentColWidth + rollColWidth + (reportData.subjects.length * subjectColWidth);
        const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
        
        // Color code overall percentage
        let overallColor = '#1a1a1a';
        if (overallPercentage >= 85) overallColor = '#2e7d32';
        else if (overallPercentage >= 75) overallColor = '#f57c00';
        else overallColor = '#d32f2f';
        
        // Show overall attendance
        const overallText = `${totalPresent}/${totalClasses}`;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1a1a1a');
        doc.text(overallText, overallX + 2, currentY + 5, { width: overallColWidth - 4, align: 'center' });
        
        // Show overall percentage
        doc.fontSize(10).font('Helvetica-Bold').fillColor(overallColor);
        doc.text(`${overallPercentage}%`, overallX + 2, currentY + 18, { width: overallColWidth - 4, align: 'center' });
        
        currentY += rowHeight;
      });
      
      // Add summary section on a new page at the end
      doc.addPage();
      
      // Professional summary header
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text('Report Summary', { align: 'center' });
      doc.moveDown(1);
      
      // Add summary section with better styling
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('General Summary', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica').fillColor('#333333');
      doc.text(`Total Students: ${reportData.totalStudents}`, { indent: 20 });
      doc.text(`Total Subjects: ${reportData.totalSubjects}`, { indent: 20 });
      doc.moveDown(1);
      
      // Add subject summary if multiple subjects
      if (reportData.subjects.length > 1) {
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#1a1a1a').text('Subject-wise Summary', { underline: true });
        doc.moveDown(0.5);
        
        reportData.subjects.forEach(subject => {
          const totalClasses = reportData.summary.totalClasses[subject];
          const avgAttendance = reportData.summary.averageAttendance[subject];
          
          doc.fontSize(11).font('Helvetica-Bold').fillColor('#1a1a1a').text(`${subject}:`, { indent: 20 });
          doc.fontSize(10).font('Helvetica').fillColor('#333333');
          doc.text(`  • Total Classes: ${totalClasses}`, { indent: 30 });
          doc.text(`  • Average Attendance: ${avgAttendance}%`, { indent: 30 });
          doc.moveDown(0.3);
        });
      }
      
      // Add professional footer
      doc.fontSize(8).font('Helvetica').fillColor('#666666');
      doc.text(
        `Report generated on ${new Date().toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })} at ${new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`,
        20, doc.page.height - 30, { align: 'center' }
      );
      
      doc.end();
    } catch (error) {
      console.error('Error generating PDF:', error);
      reject(error);
    }
  });
};

module.exports = {
  generatePDFReport
};
