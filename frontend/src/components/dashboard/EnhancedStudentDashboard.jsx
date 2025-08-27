import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceAPI } from '../../services/api';
import { 
  GraduationCap, 
  LogOut,
  User,
  Book,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  BarChart3,
  Clock,
  Target,
  PieChart,
  Activity,
  Award,
  AlertTriangle
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

// Simple circular progress component
const CircularProgress = ({ percentage, size = 140, strokeWidth = 10, color = '#3B82F6' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#F3F4F6"
          strokeWidth={strokeWidth}
          fill="none"
          className="opacity-60"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out drop-shadow-sm"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl md:text-4xl font-bold text-neutral-900 leading-none">{percentage}</span>
        <span className="text-xs md:text-sm font-medium text-neutral-600 mt-1">%</span>
      </div>
    </div>
  );
};

const EnhancedStudentDashboard = () => {
  const { getUserInfo, logout } = useAuth();
  const user = getUserInfo();

  console.log('🎓 EnhancedStudentDashboard rendered:', {
    user,
    hasUser: !!user
  });

  // State management
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [currentView, setCurrentView] = useState('overview'); // overview, analytics, history

  useEffect(() => {
    console.log('🎓 StudentDashboard useEffect triggered');
    fetchAttendanceData();
  }, []);

  const fetchAttendanceData = async () => {
    try {
      setIsLoading(true);
      console.log('📊 Fetching student attendance data...');

      // Fetch both summary and detailed attendance
      const [summaryResponse, historyResponse] = await Promise.all([
        attendanceAPI.student.getSummary(),
        attendanceAPI.student.getMyAttendance()
      ]);

      console.log('📊 Summary Response:', summaryResponse);
      console.log('📊 History Response:', historyResponse);

      if (summaryResponse.success) {
        console.log('✅ Summary fetched:', summaryResponse.data);
        setAttendanceSummary(summaryResponse.data);
      } else {
        console.log('⚠️ Summary response not successful:', summaryResponse);
        setAttendanceSummary({ summary: [] });
      }

      if (historyResponse.success) {
        console.log('✅ History fetched:', historyResponse.data.detailedRecords?.length || 0, 'records');
        setAttendanceHistory(historyResponse.data.detailedRecords || []);
      } else {
        console.log('⚠️ History response not successful:', historyResponse);
        setAttendanceHistory([]);
      }

    } catch (error) {
      console.error('❌ Error fetching attendance data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      // Don't show error toast, just set empty data
      setAttendanceSummary({ summary: [] });
      setAttendanceHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSubjectStats = () => {
    if (!attendanceSummary || !attendanceSummary.summary) return [];

    // Handle both array and object formats
    if (Array.isArray(attendanceSummary.summary)) {
      return attendanceSummary.summary.map(stats => ({
        subject: stats.subject,
        ...stats,
        percentage: stats.totalClasses > 0 ? Math.round((stats.presentClasses / stats.totalClasses) * 100) : 0
      }));
    } else {
      // Fallback for object format
      return Object.entries(attendanceSummary.summary || {}).map(([subject, stats]) => ({
        subject,
        ...stats,
        percentage: stats.totalClasses > 0 ? Math.round((stats.attendedClasses / stats.totalClasses) * 100) : 0
      }));
    }
  };

  const getOverallStats = () => {
    const subjects = getSubjectStats();
    const totalClasses = subjects.reduce((sum, s) => sum + s.totalClasses, 0);
    const totalAttended = subjects.reduce((sum, s) => sum + s.presentClasses, 0);
    const overallPercentage = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

    return {
      totalSubjects: subjects.length,
      totalClasses,
      totalAttended,
      overallPercentage
    };
  };

  // Get unique subjects from attendance history for filter
  const getUniqueSubjects = () => {
    if (!Array.isArray(attendanceHistory)) return [];
    const uniqueSubjects = [...new Set(attendanceHistory.map(record => record.subject))];
    return uniqueSubjects.map(subject => ({ subject }));
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

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return '#10B981'; // Green
    if (percentage >= 75) return '#F59E0B'; // Yellow
    return '#EF4444'; // Red
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 85) return { status: 'Excellent', color: 'text-green-600 bg-green-100', icon: Award };
    if (percentage >= 75) return { status: 'Good', color: 'text-yellow-600 bg-yellow-100', icon: Target };
    return { status: 'Needs Improvement', color: 'text-red-600 bg-red-100', icon: AlertTriangle };
  };

  const getFilteredHistory = () => {
    if (!Array.isArray(attendanceHistory)) {
      return [];
    }
    if (selectedSubject === 'all') return attendanceHistory;
    return attendanceHistory.filter(record => record.subject === selectedSubject);
  };

  const getDayWiseHistory = () => {
    if (!Array.isArray(attendanceHistory)) {
      return [];
    }

    // Filter by selected subject if not 'all'
    let filteredRecords = attendanceHistory;
    if (selectedSubject !== 'all') {
      filteredRecords = attendanceHistory.filter(record => record.subject === selectedSubject);
    }

    // Group records by date
    const groupedByDate = filteredRecords.reduce((acc, record) => {
      const dateKey = new Date(record.date).toDateString();
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: record.date,
          classes: []
        };
      }
      
      // Add class details
      acc[dateKey].classes.push({
        subject: record.subject,
        status: record.status,
        teacher: record.markedBy || null
      });
      
      return acc;
    }, {});

    // Convert to array and calculate day statistics
    const dayWiseHistory = Object.values(groupedByDate).map(dayRecord => {
      const presentCount = dayRecord.classes.filter(c => c.status === 'present').length;
      const absentCount = dayRecord.classes.filter(c => c.status === 'absent').length;
      const totalClasses = dayRecord.classes.length;
      const attendancePercentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;

      return {
        ...dayRecord,
        presentCount,
        absentCount,
        totalClasses,
        attendancePercentage
      };
    });

    // Sort by date (most recent first)
    return dayWiseHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const getRecentActivity = () => {
    return (Array.isArray(attendanceHistory) ? attendanceHistory : [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);
  };

  // Streak calculation functions
  const getCurrentStreak = () => {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return 0;
    }
    
    // Sort by date descending (most recent first)
    const sortedHistory = [...attendanceHistory].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Check consecutive days from today backwards
    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayRecords = sortedHistory.filter(record => 
        record.date === dateStr && record.status === 'present'
      );
      
      if (dayRecords.length > 0) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getLongestStreak = () => {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return 0;
    }
    
    // Group by date and check if attended
    const attendanceByDate = {};
    attendanceHistory.forEach(record => {
      const dateStr = record.date;
      if (!attendanceByDate[dateStr]) {
        attendanceByDate[dateStr] = false;
      }
      if (record.status === 'present') {
        attendanceByDate[dateStr] = true;
      }
    });
    
    const dates = Object.keys(attendanceByDate).sort();
    let currentStreak = 0;
    let maxStreak = 0;
    
    dates.forEach(date => {
      if (attendanceByDate[date]) {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    });
    
    return maxStreak;
  };

  const getDaysAttended = () => {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return 0;
    }
    
    // Count unique dates where student was present
    const attendedDates = new Set();
    attendanceHistory.forEach(record => {
      if (record.status === 'present') {
        attendedDates.add(record.date);
      }
    });
    
    return attendedDates.size;
  };

  const getTotalDays = () => {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return 0;
    }
    
    // Count unique dates with any attendance record
    const allDates = new Set();
    attendanceHistory.forEach(record => {
      allDates.add(record.date);
    });
    
    return allDates.size;
  };

  const getStreakRate = () => {
    const totalDays = getTotalDays();
    if (totalDays === 0) return 0;
    const attendedDays = getDaysAttended();
    return Math.round((attendedDays / totalDays) * 100);
  };

  const generateStreakBar = () => {
    if (!Array.isArray(attendanceHistory) || attendanceHistory.length === 0) {
      return [];
    }
    
    // Create a map of attendance by date
    const attendanceMap = {};
    attendanceHistory.forEach(record => {
      const dateStr = record.date;
      if (!attendanceMap[dateStr]) {
        attendanceMap[dateStr] = { attended: false, hasClass: false };
      }
      attendanceMap[dateStr].hasClass = true;
      if (record.status === 'present') {
        attendanceMap[dateStr].attended = true;
      }
    });
    
    // Generate last 30 days (like GitHub's contribution graph)
    const bar = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayData = attendanceMap[dateStr] || { attended: false, hasClass: false };
      
      bar.push({
        date: dateStr,
        attended: dayData.attended,
        hasClass: dayData.hasClass
      });
    }
    
    return bar;
  };

  const getMotivationMessage = () => {
    const streak = getCurrentStreak();
    if (streak === 0) {
      return "Start your attendance streak today!";
    }
    if (streak === 1) {
      return "Keep it up, you've just started your streak!";
    }
    if (streak < 7) {
      return "You're doing great! Keep up the good work!";
    }
    if (streak < 14) {
      return "You're on a roll! Maintain your streak!";
    }
    return "You're a rockstar! Your consistency is inspiring!";
  };

  const getMotivationDescription = () => {
    const streak = getCurrentStreak();
    if (streak === 0) {
      return "Your attendance streak is just beginning. Every day you attend a class is a step towards consistency.";
    }
    if (streak === 1) {
      return "You've just started your attendance streak. Consistency is key to success.";
    }
    if (streak < 7) {
      return "You're on a roll! Your attendance streak is growing. Keep it up!";
    }
    if (streak < 14) {
      return "You're on a streak! Your consistency is inspiring others. Keep it going!";
    }
    return "You're a rockstar! Your attendance streak is incredible. Keep up the amazing work!";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner size="xl" text="Loading your attendance..." />
      </div>
    );
  }

  // Fallback if no user data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">No User Data</h1>
          <p className="text-neutral-600 mb-8">Please login again to access your dashboard.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const subjects = getSubjectStats();
  const overallStats = getOverallStats();
  const filteredHistory = getFilteredHistory();
  const recentActivity = getRecentActivity();
  const overallStatus = getAttendanceStatus(overallStats.overallPercentage);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:h-16 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3 md:space-x-4">
              <div className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-4 w-4 md:h-6 md:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-neutral-900 truncate">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-xs md:text-sm text-neutral-600 truncate">{user?.rno}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              {/* Navigation */}
              <div className="flex items-center justify-center sm:justify-start space-x-1 md:space-x-2">
                <Button
                  variant={currentView === 'overview' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('overview')}
                  icon={BarChart3}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Overview</span>
                </Button>
                <Button
                  variant={currentView === 'analytics' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('analytics')}
                  icon={PieChart}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </Button>
                <Button
                  variant={currentView === 'history' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentView('history')}
                  icon={Clock}
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  <span className="hidden sm:inline">History</span>
                  <span className="sm:hidden">History</span>
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                icon={LogOut}
                className="text-xs md:text-sm"
              >
                <span className="hidden sm:inline">Logout</span>
                <span className="sm:hidden">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-3 md:py-4 lg:py-6 xl:py-8">
        
        {/* Overview */}
        {currentView === 'overview' && (
          <>
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-4 md:p-6 lg:p-8 shadow-soft mb-6 md:mb-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-2 md:mb-3">
                    Welcome back, {user?.name}! 🎓
                  </h2>
                  <p className="text-primary-100 text-sm md:text-base lg:text-lg mb-3 md:mb-4">
                    Track your attendance across all subjects
                  </p>
                  {attendanceSummary && attendanceSummary.summary && (Array.isArray(attendanceSummary.summary) ? attendanceSummary.summary.length > 0 : Object.keys(attendanceSummary.summary).length > 0) ? (
                    <div className={`inline-flex items-center px-3 md:px-4 py-2 md:py-3 rounded-full text-sm md:text-base font-bold ${overallStatus.color} shadow-sm`}>
                      <overallStatus.icon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      {overallStatus.status} - {overallStats.overallPercentage}% Overall
                    </div>
                  ) : (
                    <div className="inline-flex items-center px-3 md:px-4 py-2 md:py-3 rounded-full text-sm md:text-base font-bold bg-white bg-opacity-20 text-white shadow-sm">
                      <Book className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      No attendance records yet
                    </div>
                  )}
                </div>
                <div className="hidden md:block flex-shrink-0">
                  <div className="h-20 w-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
                    <Book className="h-10 w-10 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-xl transition-all duration-300 border border-neutral-100">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 bg-blue-100 rounded-2xl flex items-center justify-center">
                    <Book className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base text-neutral-600 truncate font-medium">Total Subjects</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-neutral-900">{overallStats.totalSubjects}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-xl transition-all duration-300 border border-neutral-100">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 bg-green-100 rounded-2xl flex items-center justify-center">
                    <Calendar className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base text-neutral-600 truncate font-medium">Total Classes</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-neutral-900">{overallStats.totalClasses}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-xl transition-all duration-300 border border-neutral-100">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className="h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 bg-purple-100 rounded-2xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base text-neutral-600 truncate font-medium">Classes Attended</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-neutral-900">{overallStats.totalAttended}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 md:p-6 shadow-soft hover:shadow-xl transition-all duration-300 border border-neutral-100">
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div className={`h-10 w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-2xl flex items-center justify-center ${
                    overallStats.overallPercentage >= 85 ? 'bg-green-100' :
                    overallStats.overallPercentage >= 75 ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    <Target className={`h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 ${
                      overallStats.overallPercentage >= 85 ? 'text-green-600' :
                      overallStats.overallPercentage >= 75 ? 'text-yellow-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm md:text-base text-neutral-600 truncate font-medium">Overall Attendance</p>
                    <p className="text-xl md:text-2xl lg:text-3xl font-bold text-neutral-900">{overallStats.overallPercentage}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Cards */}
            {subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-6 md:mb-8">
                {subjects.map((subject) => {
                  const status = getAttendanceStatus(subject.percentage);
                  return (
                    <div key={subject.subject} className="bg-white rounded-xl p-3 md:p-4 lg:p-6 shadow-soft hover:shadow-lg transition-all duration-300">
                      {/* Header with Subject Name and Percentage Badge */}
                      <div className="flex items-center justify-between mb-3 md:mb-4">
                        <h3 className="font-semibold text-neutral-900 text-sm md:text-base lg:text-lg truncate flex-1 mr-2">
                          {subject.subject}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${status.color} flex-shrink-0 min-w-[3rem] text-center`}>
                          {Math.round(subject.percentage)}%
                        </div>
                      </div>
                      
                      {/* Main Content with Circular Progress */}
                      <div className="flex items-center space-x-3 md:space-x-4 mb-3 md:mb-4">
                        {/* Circular Progress */}
                        <div className="flex-shrink-0">
                          <CircularProgress 
                            percentage={Math.round(subject.percentage)} 
                            size={100} 
                            strokeWidth={8}
                            color={getAttendanceColor(subject.percentage)}
                          />
                        </div>
                        
                        {/* Attendance Details */}
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1">
                            <p className="text-xs md:text-sm text-neutral-600">Classes Attended</p>
                            <p className="text-base md:text-lg font-medium text-neutral-900">
                              {subject.presentClasses || 0} / {subject.totalClasses || 0}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {subject.totalClasses > 0 ? `${Math.round((subject.presentClasses / subject.totalClasses) * 100)}% attendance` : 'No classes yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ease-out ${
                            subject.percentage >= 85 ? 'bg-green-500' :
                            subject.percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-4 md:p-6 lg:p-8 shadow-soft text-center mb-6 md:mb-8">
                <Book className="h-12 w-12 md:h-16 md:w-16 text-neutral-400 mx-auto mb-3 md:mb-4" />
                <h3 className="text-lg md:text-xl font-semibold text-neutral-900 mb-2">No Attendance Records Yet</h3>
                <p className="text-sm md:text-base text-neutral-600 mb-3 md:mb-4">
                  Your attendance records will appear here once teachers start marking attendance for your classes.
                </p>
                <div className="bg-blue-50 rounded-lg p-3 md:p-4 max-w-md mx-auto">
                  <p className="text-xs md:text-sm text-blue-800">
                    <strong>Tip:</strong> Ask your teachers to mark attendance for today's classes to see your attendance statistics.
                  </p>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100">
              <div className="p-4 md:p-6 border-b border-neutral-100">
                <h3 className="text-xl md:text-2xl font-bold text-neutral-900">Recent Activity</h3>
                <p className="text-sm md:text-base text-neutral-600">Your latest attendance records</p>
              </div>
              <div className="p-4 md:p-6">
                {recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {recentActivity.map((record, index) => (
                      <div key={index} className="flex items-center justify-between p-4 md:p-5 bg-neutral-50 rounded-xl border border-neutral-200 hover:bg-neutral-100 transition-colors duration-200">
                        <div className="flex items-center space-x-4">
                          <div className={`h-10 w-10 md:h-12 md:w-12 rounded-2xl flex items-center justify-center ${
                            record.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {record.status === 'present' ? (
                              <CheckCircle className="h-5 w-5 md:h-6 md:w-6 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 md:h-6 md:w-6 text-red-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-neutral-900 text-base md:text-lg truncate">{record.subject}</p>
                            <p className="text-sm md:text-base text-neutral-600">
                              {new Date(record.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 md:px-4 py-2 rounded-full text-sm md:text-base font-bold flex-shrink-0 ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 md:py-12">
                    <Activity className="h-12 w-12 md:h-16 md:w-16 text-neutral-400 mx-auto mb-4" />
                    <h4 className="text-lg md:text-xl font-semibold text-neutral-900 mb-2">No Recent Activity</h4>
                    <p className="text-sm md:text-base text-neutral-600">
                      Your recent attendance activity will appear here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Analytics View */}
        {currentView === 'analytics' && (
          <div className="space-y-6 md:space-y-8">
            {/* Overall Performance Card */}
            <div className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 rounded-2xl p-6 md:p-8 shadow-soft border border-neutral-100">
              <div className="text-center mb-6 md:mb-8">
                <h3 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">Overall Performance</h3>
                <p className="text-neutral-600 text-sm md:text-base">Your complete attendance overview</p>
              </div>
              
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-8">
                {/* Large Circular Progress */}
                <div className="flex-shrink-0">
                  <CircularProgress 
                    percentage={overallStats.overallPercentage} 
                    size={180} 
                    strokeWidth={12}
                    color={getAttendanceColor(overallStats.overallPercentage)}
                  />
                </div>
                
                {/* Overall Stats */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100">
                      <div className="text-2xl md:text-3xl font-bold text-primary-600 mb-1">
                        {overallStats.overallPercentage}%
                      </div>
                      <div className="text-xs md:text-sm text-neutral-600 font-medium">Overall</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100">
                      <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">
                        {overallStats.totalAttended}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-600 font-medium">Attended</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                        {overallStats.totalClasses}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-600 font-medium">Total</div>
                    </div>
                    
                    <div className="bg-white rounded-xl p-4 shadow-soft border border-neutral-100">
                      <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">
                        {overallStats.totalSubjects}
                      </div>
                      <div className="text-xs md:text-sm text-neutral-600 font-medium">Subjects</div>
                    </div>
                  </div>
                  
                  <div className={`inline-flex items-center px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold ${overallStatus.color} shadow-sm`}>
                    <overallStatus.icon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                    {overallStatus.status} - {overallStats.overallPercentage}% Overall Attendance
                  </div>
                </div>
              </div>
            </div>

            {/* Subject-wise Analytics */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-neutral-100">
                <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Subject-wise Performance</h3>
                <p className="text-neutral-600 text-sm md:text-base">Detailed breakdown by subject</p>
              </div>
              
              <div className="p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
                  {subjects.map((subject) => {
                    const status = getAttendanceStatus(subject.percentage);
                    return (
                      <div key={subject.subject} className="bg-gradient-to-br from-neutral-50 to-white rounded-xl p-4 md:p-6 border border-neutral-200 hover:shadow-md transition-all duration-300">
                        {/* Subject Header */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-neutral-900 text-base md:text-lg truncate flex-1 mr-3">
                            {subject.subject}
                          </h4>
                          <div className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-bold ${status.color} flex-shrink-0`}>
                            {Math.round(subject.percentage)}%
                          </div>
                        </div>
                        
                        {/* Circular Progress and Stats */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex-shrink-0">
                            <CircularProgress 
                              percentage={Math.round(subject.percentage)} 
                              size={80} 
                              strokeWidth={6}
                              color={getAttendanceColor(subject.percentage)}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="space-y-1">
                              <p className="text-xs md:text-sm text-neutral-600 font-medium">Classes</p>
                              <p className="text-lg md:text-xl font-bold text-neutral-900">
                                {subject.presentClasses || 0} / {subject.totalClasses || 0}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {subject.totalClasses > 0 ? `${Math.round((subject.presentClasses / subject.totalClasses) * 100)}% attendance` : 'No classes yet'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${
                              subject.percentage >= 85 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                              subject.percentage >= 75 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                            }`}
                            style={{ width: `${Math.min(subject.percentage, 100)}%` }}
                          ></div>
                        </div>
                        
                        {/* Status Badge */}
                        <div className="mt-3 flex justify-center">
                          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                            <status.icon className="h-3 w-3 mr-1" />
                            {status.status}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {subjects.length === 0 && (
                  <div className="text-center py-12">
                    <BarChart3 className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                    <h4 className="text-lg md:text-xl font-semibold text-neutral-900 mb-2">No Analytics Available</h4>
                    <p className="text-sm md:text-base text-neutral-600">
                      Your subject-wise analytics will appear here once you have attendance records.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Attendance Streak Bar */}
            <div className="bg-white rounded-2xl shadow-soft border border-neutral-100 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-neutral-100">
                <h3 className="text-xl md:text-2xl font-bold text-neutral-900 mb-2">Attendance Streak</h3>
                <p className="text-neutral-600 text-sm md:text-base">Your daily attendance pattern - stay consistent!</p>
              </div>
              
              <div className="p-6 md:p-8">
                {/* Streak Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 md:p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-green-800">Current Streak</h4>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-green-900 mb-1">
                      {getCurrentStreak()} days
                    </p>
                    <p className="text-sm text-green-700">Consecutive days attended</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 md:p-6 border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-blue-800">Longest Streak</h4>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-blue-900 mb-1">
                      {getLongestStreak()} days
                    </p>
                    <p className="text-sm text-blue-700">Best consecutive streak</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 md:p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-purple-800">Days Attended</h4>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-purple-900 mb-1">
                      {getDaysAttended()}
                    </p>
                    <p className="text-sm text-purple-700">Out of {getTotalDays()} days</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 md:p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="h-8 w-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-bold text-orange-800">Streak Rate</h4>
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-orange-900 mb-1">
                      {getStreakRate()}%
                    </p>
                    <p className="text-sm text-orange-700">Consistency score</p>
                  </div>
                </div>

                {/* GitHub-style Streak Bar */}
                <div className="mb-6">
                  <h4 className="text-lg md:text-xl font-bold text-neutral-900 mb-4">Daily Attendance Pattern (Last 30 Days)</h4>
                  <div className="bg-neutral-50 rounded-xl p-4 md:p-6 border border-neutral-200">
                    <div className="grid grid-cols-7 gap-1 md:gap-2">
                      {generateStreakBar().map((day, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div 
                            className={`w-3 h-3 md:w-4 md:h-4 rounded-sm transition-all duration-200 cursor-pointer ${
                              day.attended 
                                ? 'bg-green-500 hover:bg-green-600 shadow-sm' 
                                : day.hasClass 
                                  ? 'bg-neutral-400 hover:bg-neutral-500 shadow-sm' 
                                  : 'bg-neutral-100 hover:bg-neutral-200'
                            }`}
                            title={`${new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}: ${day.attended ? '✅ Attended' : day.hasClass ? '❌ Missed' : '📅 No Class'}`}
                          />
                          {/* Add spacing after every 7th day (week break) */}
                          {(index + 1) % 7 === 0 && index < generateStreakBar().length - 1 && (
                            <div className="w-2 md:w-3 h-1"></div>
                          )}
                        </div>
                      ))}
                    </div>
                    
                    {/* Legend */}
                    <div className="flex items-center justify-center mt-6 space-x-6 text-xs md:text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-neutral-100 rounded-sm"></div>
                        <span className="text-neutral-600">No Class</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-neutral-400 rounded-sm"></div>
                        <span className="text-neutral-600">Missed</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 md:w-4 md:h-4 bg-green-500 rounded-sm"></div>
                        <span className="text-neutral-600">Attended</span>
                      </div>
                    </div>
                    
                    {/* Week labels */}
                    <div className="flex justify-between mt-4 text-xs text-neutral-500">
                      <span>4 weeks ago</span>
                      <span>3 weeks ago</span>
                      <span>2 weeks ago</span>
                      <span>1 week ago</span>
                      <span>This week</span>
                    </div>
                  </div>
                </div>

                {/* Motivation Message */}
                <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4 md:p-6 border border-primary-200">
                  <div className="text-center">
                    <h4 className="text-lg md:text-xl font-bold text-primary-900 mb-2">
                      {getMotivationMessage()}
                    </h4>
                    <p className="text-sm md:text-base text-primary-700">
                      {getMotivationDescription()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div className="bg-white rounded-xl shadow-soft">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-neutral-900">Attendance History</h3>
                  <p className="text-sm text-neutral-600">Your day-wise attendance records</p>
                </div>
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="all">All Subjects</option>
                  {getUniqueSubjects().map(subject => (
                    <option key={subject.subject} value={subject.subject}>
                      {subject.subject}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="p-6">
              {getDayWiseHistory().length > 0 ? (
                <div className="space-y-6 max-h-96 overflow-y-auto">
                  {getDayWiseHistory().map((dayRecord, index) => (
                    <div key={index} className="bg-gradient-to-r from-neutral-50 to-neutral-100 rounded-xl p-6 border border-neutral-200">
                      {/* Day Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-5 w-5 text-primary-600" />
                          </div>
                                                      <div>
                              <h4 className="text-lg font-bold text-neutral-900">
                                {new Date(dayRecord.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </h4>
                              <p className="text-sm text-neutral-600">
                                {dayRecord.classes.length} classes • {dayRecord.presentCount} present • {dayRecord.absentCount} absent
                              </p>
                              <p className="text-xs text-neutral-500 mt-1">
                                {new Date(dayRecord.date).toLocaleDateString('en-US', { weekday: 'short' })}
                              </p>
                            </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                          dayRecord.attendancePercentage >= 80 ? 'bg-green-100 text-green-800' :
                          dayRecord.attendancePercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {dayRecord.attendancePercentage}% Attendance
                        </div>
                      </div>

                      {/* Classes for the day */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dayRecord.classes.map((classRecord, classIndex) => (
                          <div key={classIndex} className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                                  classRecord.status === 'present' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                  {classRecord.status === 'present' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-neutral-900 text-sm">{classRecord.subject}</h5>
                                </div>
                              </div>
                              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                classRecord.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {classRecord.status.charAt(0).toUpperCase() + classRecord.status.slice(1)}
                              </div>
                            </div>
                            
                            {/* Additional details */}
                            <div className="space-y-1">
                              {classRecord.teacher && classRecord.teacher !== 'N/A' && (
                                <p className="text-xs text-neutral-600">
                                  👨‍🏫 {classRecord.teacher}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Day Summary */}
                      <div className="mt-4 pt-4 border-t border-neutral-200">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-700 font-medium">{dayRecord.presentCount} Present</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-red-700 font-medium">{dayRecord.absentCount} Absent</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <BarChart3 className="h-4 w-4 text-blue-600" />
                              <span className="text-blue-700 font-medium">{dayRecord.totalClasses} Total Classes</span>
                            </div>
                          </div>
                          <div className="text-neutral-600">
                            {dayRecord.attendancePercentage >= 80 ? '🎉 Excellent day!' :
                             dayRecord.attendancePercentage >= 60 ? '👍 Good effort!' :
                             '💪 Keep improving!'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                  <p className="text-neutral-600">No attendance history found</p>
                  <p className="text-sm text-neutral-500 mt-2">
                    Your attendance records will appear here once teachers start marking attendance
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default EnhancedStudentDashboard;
