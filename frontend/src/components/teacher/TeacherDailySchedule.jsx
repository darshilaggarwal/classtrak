import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, MapPin, ChevronRight, CheckCircle, RefreshCw, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAuthToken } from '../../services/api';

const TeacherDailySchedule = ({ onAttendanceClick, onAttendanceMarked }) => {
  const { getUserInfo } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayOfWeek, setDayOfWeek] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState({}); // Track attendance status for each class
  const user = getUserInfo();

  useEffect(() => {
    if (selectedDate && user?.id) {
      fetchTeacherSchedule();
      checkAttendanceStatus();
    }
  }, [selectedDate, user?.id]);

  // Check if attendance has been marked for each class
  const checkAttendanceStatus = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5001/api/attendance/teacher/status?date=${selectedDate}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAttendanceStatus(data.data?.attendanceStatus || {});
      }
    } catch (error) {
      console.error('Error checking attendance status:', error);
    }
  };

  const fetchTeacherSchedule = async () => {
    setLoading(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`http://localhost:5001/api/timetable/teacher/${user.id}/schedule?date=${selectedDate}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSchedule(data.schedule || []);
        setDayOfWeek(data.dayOfWeek || '');
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCurrentTimeStatus = (startTime, endTime, selectedDate) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // If it's not today, determine status based on date
    if (selectedDate !== today) {
      const selectedDateObj = new Date(selectedDate);
      if (selectedDateObj < now) {
        return 'completed'; // Past date
      } else if (selectedDateObj > now) {
        return 'upcoming'; // Future date
      }
    }
    
    // For today's classes, check time
    if (currentTime >= startTime && currentTime <= endTime) {
      return 'ongoing';
    } else if (currentTime < startTime) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'ongoing':
        return 'border-green-400 bg-green-50 shadow-lg shadow-green-100';
      case 'upcoming':
        return 'border-blue-400 bg-blue-50 shadow-sm';
      case 'completed':
        return 'border-gray-300 bg-gray-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ongoing':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ongoing</span>;
      case 'upcoming':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">Upcoming</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">Completed</span>;
      default:
        return null;
    }
  };

  const getSubstitutionBadge = (slot) => {
    if (slot.isSubstitutionClass) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full flex items-center space-x-1">
          <UserCheck className="w-3 h-3" />
          <span>Substitution</span>
        </span>
      );
    }
    if (slot.isSubstitutedOut) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full flex items-center space-x-1">
          <RefreshCw className="w-3 h-3" />
          <span>Substituted Out</span>
        </span>
      );
    }
    return null;
  };

  const getSubstitutionStyles = (slot) => {
    if (slot.isSubstitutionClass) {
      return 'border-purple-400 bg-purple-50 shadow-lg shadow-purple-100';
    }
    if (slot.isSubstitutedOut) {
      return 'border-orange-400 bg-orange-50 shadow-sm';
    }
    return '';
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Schedule</h1>
              <p className="text-sm text-gray-600">View your classes and manage attendance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const yesterday = new Date(selectedDate);
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Previous day"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              
              <button
                onClick={() => {
                  const tomorrow = new Date(selectedDate);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setSelectedDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                title="Next day"
              >
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isToday 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today
            </button>
          </div>
        </div>

        {/* Date Info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  {new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </h3>
                <p className="text-blue-700">
                  {isToday ? 'Today' : dayOfWeek} • {schedule.length} {schedule.length === 1 ? 'class' : 'classes'}
                  {schedule.filter(slot => slot.isSubstitutionClass).length > 0 && (
                    <span className="ml-2 text-purple-600">
                      ({schedule.filter(slot => slot.isSubstitutionClass).length} substitution{schedule.filter(slot => slot.isSubstitutionClass).length !== 1 ? 's' : ''})
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              {isToday ? (
                <>
                  <div className="text-sm text-blue-600 font-medium">Current Time</div>
                  <div className="text-lg font-semibold text-blue-900">
                    {new Date().toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })}
                  </div>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    new Date(selectedDate) < new Date() 
                      ? 'bg-gray-100 text-gray-800 border border-gray-300' 
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}>
                    {new Date(selectedDate) < new Date() ? 'Past Date' : 'Future Date'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Summary */}
      {schedule.length > 0 && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          {(() => {
            const ongoingCount = schedule.filter(slot => getCurrentTimeStatus(slot.startTime, slot.endTime, selectedDate) === 'ongoing').length;
            const upcomingCount = schedule.filter(slot => getCurrentTimeStatus(slot.startTime, slot.endTime, selectedDate) === 'upcoming').length;
            const completedCount = schedule.filter(slot => getCurrentTimeStatus(slot.startTime, slot.endTime, selectedDate) === 'completed').length;
            const substitutionCount = schedule.filter(slot => slot.isSubstitutionClass).length;
            
            return (
              <>
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-700">Ongoing</p>
                      <p className="text-xl font-bold text-green-900">{ongoingCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-700">Upcoming</p>
                      <p className="text-xl font-bold text-blue-900">{upcomingCount}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-500 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Completed</p>
                      <p className="text-xl font-bold text-gray-900">{completedCount}</p>
                    </div>
                  </div>
                </div>
                
                {substitutionCount > 0 && (
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center">
                        <UserCheck className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-700">Substitutions</p>
                        <p className="text-xl font-bold text-purple-900">{substitutionCount}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* Schedule */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading schedule...</p>
        </div>
      ) : schedule.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No Classes Today</h3>
          <p className="text-gray-600 max-w-md mx-auto">You don't have any classes scheduled for {dayOfWeek}.</p>
        </div>
      ) : (
        <div className="space-y-6">
                      {schedule.map((slot, index) => {
              const status = getCurrentTimeStatus(slot.startTime, slot.endTime, selectedDate);
              const statusStyles = getStatusStyles(status);
              const substitutionStyles = getSubstitutionStyles(slot);
              const combinedStyles = `${statusStyles} ${substitutionStyles}`;
            
            return (
              <div key={index} className={`border-2 rounded-xl p-6 transition-all duration-200 hover:shadow-lg ${combinedStyles}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    {/* Time */}
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-lg font-semibold text-gray-900">
                          {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(status)}
                        {getSubstitutionBadge(slot)}
                      </div>
                    </div>

                    {/* Subject and Batch */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">{slot.subject?.name}</h3>
                          <p className="text-sm text-gray-600">Subject Code: {slot.subject?.code}</p>
                          {slot.isSubstitutionClass && slot.originalTeacher && (
                            <p className="text-xs text-purple-600 font-medium">
                              Substituting for {slot.originalTeacher.name}
                            </p>
                          )}
                          {slot.isSubstitutedOut && slot.substitutionInfo && (
                            <p className="text-xs text-orange-600 font-medium">
                              Substituted by {slot.substitutionInfo.substituteTeacher.name}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Users className="w-5 h-5 text-green-600" />
                        <div>
                          <h4 className="font-medium text-gray-900">{slot.batch?.name}</h4>
                          <p className="text-sm text-gray-600">{slot.batch?.department?.name}</p>
                        </div>
                      </div>
                    </div>

                    {/* Room */}
                    {slot.roomNumber && (
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Room {slot.roomNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <div className="ml-6">
                    {(() => {
                      const classKey = `${slot.subject?.name}-${slot.batch?._id}-${slot.startTime}`;
                      const isAttendanceMarked = attendanceStatus[classKey];
                      
                      // Priority 1: Show "Attendance Done" if attendance is marked (regardless of class status)
                      if (isAttendanceMarked) {
                        return (
                          <div className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium bg-green-100 text-green-800 border border-green-200">
                            <Users className="w-4 h-4" />
                            <span>Attendance Done</span>
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        );
                      }
                      
                      // Priority 2: For completed classes, show "View in History" (no attendance marking allowed)
                      if (status === 'completed') {
                        return (
                          <div className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium bg-gray-100 text-gray-600 border border-gray-200">
                            <Users className="w-4 h-4" />
                            <span>View in History</span>
                          </div>
                        );
                      }
                      
                      // Priority 3: For substituted out classes, show "Substituted Out" (no attendance marking allowed)
                      if (slot.isSubstitutedOut) {
                        return (
                          <div className="flex items-center space-x-2 px-6 py-3 rounded-lg font-medium bg-orange-100 text-orange-700 border border-orange-200">
                            <RefreshCw className="w-4 h-4" />
                            <span>Substituted Out</span>
                          </div>
                        );
                      }
                      
                      // Priority 4: For today's ongoing/upcoming classes, show attendance marking button
                      return (
                        <button
                          onClick={() => onAttendanceClick && onAttendanceClick({
                            subjectId: slot.subject?._id,
                            subjectName: slot.subject?.name,
                            batchId: slot.batch?._id,
                            batchName: slot.batch?.name,
                            timeSlot: `${formatTime(slot.startTime)} - ${formatTime(slot.endTime)}`,
                            date: selectedDate
                          })}
                          className={`
                            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all duration-200
                            ${status === 'ongoing' 
                              ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                              : status === 'upcoming'
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-gray-600 hover:bg-gray-700 text-white'
                            }
                          `}
                        >
                          <Users className="w-4 h-4" />
                          <span>
                            {status === 'ongoing' ? 'Mark Attendance' : 'Take Attendance'}
                          </span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TeacherDailySchedule;
