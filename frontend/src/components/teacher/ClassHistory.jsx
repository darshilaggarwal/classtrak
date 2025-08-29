import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Users, 
  BookOpen, 
  MapPin, 
  Filter,
  ChevronDown,
  ChevronUp,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  CalendarDays,
  GraduationCap,
  Building2,
  User,
  X,
  ChevronRight
} from 'lucide-react';
import { attendanceAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ClassHistory = ({ onRefresh }) => {
  const [classHistory, setClassHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchClassHistory();
    fetchSubjects();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [classHistory, selectedDate, selectedSubject]);

  const fetchClassHistory = async () => {
    try {
      setLoading(true);
      const response = await attendanceAPI.teacher.getClassHistory({ limit: 100 });
      
      if (response.success) {
        // Handle the nested structure: { classes: [...], pagination: {...} }
        const historyData = response.data?.classes || response.data || [];
        const finalData = Array.isArray(historyData) ? historyData : [];
        setClassHistory(finalData);
        console.log('📜 Class history loaded:', finalData.length, 'records');
      } else {
        console.log('📜 No class history data received');
        setClassHistory([]);
      }
    } catch (error) {
      console.error('❌ Error fetching class history:', error);
      toast.error('Failed to load class history');
      setClassHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await attendanceAPI.getSubjects();
      if (response.success) {
        setSubjects(response.data || []);
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
    }
  };

  const filterHistory = () => {
    // Ensure classHistory is an array
    if (!Array.isArray(classHistory)) {
      setFilteredHistory([]);
      return;
    }

    let filtered = [...classHistory];

    if (selectedDate) {
      filtered = filtered.filter(record => 
        new Date(record.date).toISOString().split('T')[0] === selectedDate
      );
    }

    if (selectedSubject) {
      filtered = filtered.filter(record => 
        record.subject === selectedSubject
      );
    }

    setFilteredHistory(filtered);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    if (!time) return 'N/A';
    
    // Handle different time formats
    if (typeof time === 'string') {
      if (time.includes(':')) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
      } else {
        // If it's a timestamp or other format, try to parse it
        try {
          const date = new Date(time);
          return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
          });
        } catch (error) {
          return 'N/A';
        }
      }
    }
    
    return 'N/A';
  };

  const formatTimeFromDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getAttendanceStats = (record) => {
    // Use the new format from backend which includes calculated stats
    return {
      total: record.totalCount || 0,
      present: record.presentCount || 0,
      absent: record.absentCount || 0,
      percentage: record.attendancePercentage || 0
    };
  };

  const groupByDate = (records) => {
    const grouped = {};
    records.forEach(record => {
      const date = new Date(record.date).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    return grouped;
  };

  const groupedHistory = groupByDate(filteredHistory);

  const handleCardClick = (record) => {
    setSelectedRecord(record);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading class history...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Class History</h2>
            <p className="text-sm text-gray-600">View your past classes and attendance records</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {onRefresh && (
            <button
              onClick={() => {
                fetchClassHistory();
                if (onRefresh) onRefresh();
              }}
              className="flex items-center px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors"
              title="Refresh history"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 border border-gray-200 transition-colors"
          >
            <Filter size={16} className="mr-2" />
            Filters
            {showFilters ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">All Subjects</option>
                {subjects.map((subject, index) => (
                  <option key={index} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setSelectedDate('');
                setSelectedSubject('');
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}



      {/* Class History by Date */}
      {Object.keys(groupedHistory).length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Class History</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {filteredHistory.length === 0 ? 
              "You haven't taken any classes yet. Your attendance history will appear here once you start marking attendance." : 
              "No classes found with the selected filters. Try adjusting your search criteria."
            }
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedHistory)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, records]) => (
              <div key={date} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {formatDate(date)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {records.length} class{records.length !== 1 ? 'es' : ''} • {records.length} attendance record{records.length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Marked at: {records.map(r => formatTimeFromDate(r.createdAt)).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                   {records.map((record, index) => {
                     const stats = getAttendanceStats(record);
                     return (
                       <div 
                         key={index} 
                         className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 hover:border-blue-300 cursor-pointer"
                         onClick={() => handleCardClick(record)}
                       >
                         <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center space-x-2">
                             <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                               <Clock className="w-4 h-4 text-blue-600" />
                             </div>
                             <div className="text-left">
                               <span className="text-sm font-medium text-gray-900 block">
                                 {formatTimeFromDate(record.createdAt)}
                               </span>
                               <span className="text-xs text-gray-500">
                                 Scheduled: {formatTime(record.classTime)}
                               </span>
                             </div>
                           </div>
                           <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                             stats.percentage >= 85 ? 'bg-green-100 text-green-800 border border-green-200' :
                             stats.percentage >= 75 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                             'bg-red-100 text-red-800 border border-red-200'
                           }`}>
                             {stats.percentage}%
                           </div>
                         </div>
                         
                         <div className="space-y-3">
                           <div className="flex items-center space-x-3">
                             <div className="h-6 w-6 bg-blue-100 rounded flex items-center justify-center">
                               <BookOpen className="w-3 h-3 text-blue-600" />
                             </div>
                             <span className="text-sm font-medium text-gray-900">
                               {record.subject}
                             </span>
                             {record.isSubstitution && (
                               <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                                 <User className="w-3 h-3" />
                                 <span>Substitution</span>
                               </div>
                             )}
                           </div>
                           
                           <div className="flex items-center space-x-3">
                             <div className="h-6 w-6 bg-green-100 rounded flex items-center justify-center">
                               <Users className="w-3 h-3 text-green-600" />
                             </div>
                             <span className="text-sm text-gray-600">
                               {record.batch}
                             </span>
                           </div>
                           
                           <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                             <span className="font-medium">Total: {stats.total}</span>
                             <div className="flex space-x-3">
                               <div className="flex items-center space-x-1">
                                 <CheckCircle className="w-3 h-3 text-green-600" />
                                 <span className="text-green-600 font-medium">{stats.present}</span>
                               </div>
                               <div className="flex items-center space-x-1">
                                 <XCircle className="w-3 h-3 text-red-600" />
                                 <span className="text-red-600 font-medium">{stats.absent}</span>
                               </div>
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-center pt-2">
                             <div className="flex items-center space-x-1 text-blue-600 text-xs font-medium">
                               <Eye className="w-3 h-3" />
                               <span>Click to view details</span>
                               <ChevronRight className="w-3 h-3" />
                             </div>
                           </div>
                         </div>
                       </div>
                     );
                   })}
                 </div>
              </div>
            ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Attendance Details</h3>
                  <p className="text-sm text-gray-600">
                    {selectedRecord.subject} • {selectedRecord.batch} • {formatDate(selectedRecord.date)}
                  </p>
                  {selectedRecord.isSubstitution && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
                        <User className="w-3 h-3" />
                        <span>Substitution Class</span>
                      </div>
                      {selectedRecord.originalTeacher && (
                        <span className="text-xs text-gray-500">
                          Original: {selectedRecord.originalTeacher}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="h-8 w-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="h-4 w-4 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Class Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Time</span>
                  </div>
                  <p className="text-lg font-semibold text-blue-900">
                    {formatTime(selectedRecord.classTime)} (Scheduled)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Marked at: {formatTimeFromDate(selectedRecord.createdAt)}
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">Present</span>
                  </div>
                  <p className="text-lg font-semibold text-green-900">{selectedRecord.presentCount}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-900">Absent</span>
                  </div>
                  <p className="text-lg font-semibold text-red-900">{selectedRecord.absentCount}</p>
                </div>
              </div>

              {/* Student Lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Present Students */}
                <div className="bg-green-50 rounded-lg border border-green-200 p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-green-900">Present Students ({selectedRecord.presentCount})</h4>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedRecord.records && selectedRecord.records.filter(r => r.status === 'present').map((student, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-green-200">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName || `Student ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                        </div>
                        <CheckCircle className="w-4 h-4 text-green-600 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Absent Students */}
                <div className="bg-red-50 rounded-lg border border-red-200 p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-900">Absent Students ({selectedRecord.absentCount})</h4>
                  </div>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {selectedRecord.records && selectedRecord.records.filter(r => r.status === 'absent').map((student, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white p-3 rounded-lg border border-red-200">
                        <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.studentName || `Student ${index + 1}`}</p>
                          <p className="text-sm text-gray-600">Roll: {student.rollNumber}</p>
                        </div>
                        <XCircle className="w-4 h-4 text-red-600 ml-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Attendance Percentage</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedRecord.attendancePercentage}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedRecord.totalCount}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassHistory;
