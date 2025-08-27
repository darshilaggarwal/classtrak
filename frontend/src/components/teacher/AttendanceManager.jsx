import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { 
  Users, 
  Calendar, 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Save,
  Eye,
  ChevronDown,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import toast from 'react-hot-toast';

const AttendanceManager = ({ selectedBatch: initialBatch, selectedSubject: initialSubject, onBackToSchedule, onAttendanceMarked }) => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(initialBatch || '');
  const [students, setStudents] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSubject, setSelectedSubject] = useState(initialSubject || '');
  const [attendance, setAttendance] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAttendanceForm, setShowAttendanceForm] = useState(false);

  useEffect(() => {
    fetchTeacherBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsForBatch();
    }
  }, [selectedBatch]);

  // Auto-show attendance form if coming from schedule with pre-selected data
  useEffect(() => {
    if (initialBatch && initialSubject && students.length > 0) {
      setShowAttendanceForm(true);
    }
  }, [initialBatch, initialSubject, students.length]);

  const fetchTeacherBatches = async () => {
    try {
      setIsLoading(true);
      const response = await attendanceAPI.teacher.getBatches();
      
      if (response.success) {
        setBatches(response.data);
        console.log('✅ Batches loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStudentsForBatch = async () => {
    try {
      setIsLoading(true);
      const response = await attendanceAPI.teacher.getStudentsForBatchByName(selectedBatch);
      
      if (response.success) {
        setStudents(response.data);
        // Initialize attendance as present for all students
        const initialAttendance = {};
        response.data.forEach(student => {
          initialAttendance[student._id] = 'present';
        });
        setAttendance(initialAttendance);
        console.log('✅ Students loaded:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching students:', error);
      toast.error('Failed to load students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return;
    }

    if (!selectedBatch) {
      toast.error('Please select a batch');
      return;
    }

    if (Object.keys(attendance).length === 0) {
      toast.error('Please mark attendance for at least one student');
      return;
    }

    // Check if selected date is today or in the future
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate < today) {
      toast.error('You can only mark attendance for today or future dates');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const selectedBatchObj = batches.find(b => b.name === selectedBatch);
      if (!selectedBatchObj) {
        toast.error('Please select a valid batch');
        return;
      }

      const attendanceData = {
        date: new Date(selectedDate).toISOString(), // Convert to ISO format
        subject: selectedSubject,
        batch: selectedBatchObj._id, // Use batch ID, not name
        records: Object.entries(attendance).map(([studentId, status]) => ({
          studentId,
          rollNumber: students.find(s => s._id === studentId)?.rno,
          status
        })),
        classTime: '09:30', // Default time
        duration: 60
      };

      console.log('📝 Submitting attendance data:', attendanceData);
      console.log('🔍 Selected subject:', selectedSubject);
      console.log('🔍 Selected batch:', selectedBatch);
      console.log('🔍 Batch ID:', selectedBatchObj._id);
      console.log('🔍 Available subjects in batch:', getSubjectsForBatch());
      console.log('🔍 Teacher subjects from batches:', batches.find(b => b.name === selectedBatch)?.subjects);
      console.log('🔍 Attendance records count:', Object.keys(attendance).length);

      const response = await attendanceAPI.teacher.markAttendance(attendanceData);
      
      if (response.success) {
        toast.success('Attendance marked successfully!');
        setShowAttendanceForm(false);
        
        // Call callback to refresh history and schedule
        if (onAttendanceMarked) {
          onAttendanceMarked();
        }
        
        // Reset form
        setAttendance({});
        setSelectedDate(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      console.error('❌ Error marking attendance:', error);
      
      if (error.response?.status === 409) {
        toast.error('Attendance has already been marked for this class. You cannot mark attendance twice.');
      } else {
        toast.error('Failed to mark attendance');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSubjectsForBatch = () => {
    const batch = batches.find(b => b.name === selectedBatch);
    console.log('🔍 Getting subjects for batch:', selectedBatch);
    console.log('🔍 Found batch:', batch);
    console.log('🔍 Batch subjects:', batch?.subjects);
    return batch?.subjects || [];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          {onBackToSchedule && (
            <button
              onClick={onBackToSchedule}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              <ChevronRight size={20} className="rotate-180 mr-2" />
              Back to Schedule
            </button>
          )}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Attendance Manager</h2>
          </div>
        </div>
        <button
          onClick={() => setShowAttendanceForm(!showAttendanceForm)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showAttendanceForm ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
          {showAttendanceForm ? 'Hide Form' : 'Take Attendance'}
        </button>
      </div>

      {/* Batch Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Batch
        </label>
        <select
          value={selectedBatch}
          onChange={(e) => setSelectedBatch(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Choose a batch...</option>
          {batches.map((batch) => (
            <option key={batch._id} value={batch.name}>
              {batch.name} ({batch.timetableDays} days, {batch.subjects?.length || 0} subjects)
            </option>
          ))}
        </select>
      </div>

      {/* Quick Info */}
      {selectedBatch && students.length > 0 && (
        <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  {selectedBatch}
                </h3>
                <p className="text-sm text-blue-700">
                  {students.length} students • Ready for attendance
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{students.length}</div>
              <div className="text-xs text-blue-500 font-medium">Students</div>
            </div>
          </div>
          
          {/* Date validation indicator */}
          {(() => {
            const today = new Date().toISOString().split('T')[0];
            const isToday = selectedDate === today;
            const isPastDate = selectedDate < today;
            
            if (isPastDate) {
              return (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-red-600">⚠️</span>
                    <span className="text-sm text-red-700">
                      You can only mark attendance for today or future dates. 
                      For past dates, please check the History tab.
                    </span>
                  </div>
                </div>
              );
            } else if (!isToday) {
              return (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <span className="text-yellow-600">ℹ️</span>
                    <span className="text-sm text-yellow-700">
                      You're marking attendance for a future date.
                    </span>
                  </div>
                </div>
              );
            }
            return null;
          })()}
        </div>
      )}

      {/* Attendance Form */}
      {showAttendanceForm && selectedBatch && students.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <Users className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-lg font-medium text-blue-900">
              Mark Attendance for {selectedDate}
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select subject...</option>
                {getSubjectsForBatch().map((subject, index) => (
                  <option key={index} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Students
              </label>
              <div className="px-3 py-2 bg-gray-100 rounded-lg text-center font-medium">
                {students.length}
              </div>
            </div>
          </div>

          {/* Attendance Grid */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Mark Attendance:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {students.map((student) => (
                <div key={student._id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div>
                    <span className="font-medium text-gray-900">{student.name}</span>
                    <span className="text-sm text-gray-600 ml-2">({student.rno})</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAttendanceChange(student._id, 'present')}
                      className={`p-2 rounded-lg ${
                        attendance[student._id] === 'present'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <CheckCircle size={16} />
                    </button>
                    <button
                      onClick={() => handleAttendanceChange(student._id, 'absent')}
                      className={`p-2 rounded-lg ${
                        attendance[student._id] === 'absent'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const isPastDate = selectedDate < today;
              
              return (
                <button
                  onClick={handleSubmitAttendance}
                  disabled={isSubmitting || !selectedSubject || isPastDate}
                  className={`flex items-center px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    isPastDate 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Save size={20} className="mr-2" />
                  {isSubmitting ? 'Saving...' : isPastDate ? 'Cannot Mark Past Attendance' : 'Save Attendance'}
                </button>
              );
            })()}
          </div>
        </div>
      )}

      {/* No Students Message */}
      {selectedBatch && students.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
          <p>No students are currently enrolled in this batch.</p>
        </div>
      )}

      {/* No Batch Selected */}
      {!selectedBatch && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Batch</h3>
          <p>Choose a batch from the dropdown above to view students and take attendance.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceManager;
