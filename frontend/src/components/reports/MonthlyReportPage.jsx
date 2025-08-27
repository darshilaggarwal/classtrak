import React, { useState, useEffect } from 'react';
import { Calendar, Download, FileText, BarChart3, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { attendanceAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const MonthlyReportPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await attendanceAPI.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      toast.error('Failed to fetch subjects');
    }
  };

  const generateReport = async () => {
    try {
      setIsLoading(true);
      const response = await attendanceAPI.getMonthlyReport({
        month: selectedMonth,
        year: selectedYear,
        subject: selectedSubject === 'all' ? null : selectedSubject
      });
      
      if (response.success) {
        setReportData(response.data);
        toast.success('Report generated successfully!');
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReport = async (format) => {
    try {
      setIsDownloading(true);
      const response = await attendanceAPI.downloadMonthlyReport({
        month: selectedMonth,
        year: selectedYear,
        subject: selectedSubject === 'all' ? null : selectedSubject,
        format
      });
      
      // Create download link
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${selectedMonth}-${selectedYear}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} report downloaded!`);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };

  const getMonthName = (month) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1];
  };

  // Calculate overall attendance for a student
  const calculateOverallAttendance = (student) => {
    let totalClasses = 0;
    let totalPresent = 0;
    
    reportData.subjects.forEach(subject => {
      const attendance = student.subjects[subject];
      if (attendance.totalClasses > 0) {
        totalClasses += attendance.totalClasses;
        totalPresent += attendance.presentClasses;
      }
    });
    
    const percentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
    return { totalClasses, totalPresent, percentage };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl p-6 shadow-soft mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="text-neutral-600 hover:text-neutral-900">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-neutral-900">Monthly Attendance Report</h1>
                <p className="text-neutral-600">Generate comprehensive monthly attendance reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        {/* Report Controls */}
        <div className="bg-white rounded-xl p-6 shadow-soft mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Month</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                  <option key={month} value={month}>{getMonthName(month)}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Subject</label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={generateReport} disabled={isLoading} className="w-full" icon={BarChart3}>
                {isLoading ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>

          {/* Download Options */}
          {reportData && (
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-neutral-700">Download as:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport('pdf')}
                disabled={isDownloading}
                icon={FileText}
              >
                {isDownloading ? 'Downloading...' : 'PDF'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadReport('excel')}
                disabled={isDownloading}
                icon={Download}
              >
                {isDownloading ? 'Downloading...' : 'Excel'}
              </Button>
            </div>
          )}
        </div>

        {/* Report Display */}
        {reportData && (
          <div className="bg-white rounded-xl shadow-soft overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <h2 className="text-xl font-bold text-neutral-900">
                Attendance Report - {getMonthName(selectedMonth)} {selectedYear}
              </h2>
              <p className="text-sm text-neutral-600">
                {reportData.totalStudents} students • {reportData.totalSubjects} subjects
              </p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                      Student
                    </th>
                    {reportData.subjects.map(subject => (
                      <th key={subject} className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        {subject}
                      </th>
                    ))}
                    {/* Overall Column Header */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-blue-600 uppercase tracking-wider bg-blue-50 border-l-2 border-blue-200">
                      <div className="text-center">
                        <div className="font-bold">Overall</div>
                        <div className="text-xs text-blue-500">Attendance </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {reportData.students.map(student => {
                    const overall = calculateOverallAttendance(student);
                    return (
                      <tr key={student.id} className="hover:bg-neutral-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-neutral-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-neutral-500">
                              {student.rollNumber}
                            </div>
                          </div>
                        </td>
                        {reportData.subjects.map(subject => {
                          const attendance = student.subjects[subject];
                          return (
                            <td key={subject} className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-neutral-900">
                                {attendance.presentClasses}/{attendance.totalClasses}
                              </div>
                              <div className={`text-sm font-medium ${
                                attendance.percentage >= 85 ? 'text-green-600' :
                                attendance.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {attendance.percentage}%
                              </div>
                            </td>
                          );
                        })}
                        {/* Overall Column Data */}
                        <td className="px-6 py-4 whitespace-nowrap bg-blue-50 border-l-2 border-blue-200">
                          <div className="text-center">
                            <div className="text-sm font-bold text-neutral-900">
                              {overall.totalPresent}/{overall.totalClasses}
                            </div>
                            <div className={`text-sm font-bold ${
                              overall.percentage >= 85 ? 'text-green-600' :
                              overall.percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {overall.percentage}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MonthlyReportPage;
