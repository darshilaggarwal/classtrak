import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { 
  GraduationCap, 
  LogOut,
  Calendar,
  Users,
  History,
  BookOpen,
  Building,
  ChevronDown,
  ChevronRight,
  Clock,
  BarChart3
} from 'lucide-react';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import TeacherDailySchedule from '../teacher/TeacherDailySchedule';
import AttendanceManager from '../teacher/AttendanceManager';
import ClassHistory from '../teacher/ClassHistory';

const EnhancedTeacherDashboard = () => {
  const { getUserInfo, logout } = useAuth();
  const user = getUserInfo();

  // State management
  const [teacherData, setTeacherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [classHistory, setClassHistory] = useState([]);
  const [currentView, setCurrentView] = useState('schedule'); // schedule, dashboard, attendance, history
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');

  useEffect(() => {
    fetchTeacherData();
  }, []);

  useEffect(() => {
    if (currentView === 'dashboard') {
      fetchStatistics();
      fetchClassHistory();
    }
  }, [currentView]);



  const fetchTeacherData = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 Fetching teacher data...');
      
      // Fetch teacher's own details with subjects
      const teacherResponse = await apiService.teacher.getProfile();
      if (teacherResponse.success) {
        setTeacherData(teacherResponse.data);
        console.log('✅ Teacher data loaded successfully');
        console.log('📚 Teacher subjects:', teacherResponse.data.subjects?.length || 0);
      }
    } catch (error) {
      console.error('❌ Error fetching teacher data:', error);
      toast.error('Failed to load teacher data');
    } finally {
      setIsLoading(false);
    }
  };



  const fetchStatistics = async () => {
    try {
      console.log('📊 Fetching statistics...');
      
      // Get teacher's batches to calculate total students
      const batchesResponse = await attendanceAPI.teacher.getBatches();
      let totalStudents = 0;
      
      if (batchesResponse.success && batchesResponse.data.length > 0) {
        // Calculate total students across all batches
        for (const batch of batchesResponse.data) {
          const studentsResponse = await attendanceAPI.teacher.getStudentsForBatchByName(batch.name);
          if (studentsResponse.success) {
            totalStudents += studentsResponse.data.length;
          }
        }
      }
      
      // Get other statistics
      const response = await attendanceAPI.teacher.getStatistics();
      if (response.success) {
        setStatistics({
          ...response.data,
          totalStudents: totalStudents,
          totalBatches: batchesResponse.success ? batchesResponse.data.length : 0
        });
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error);
    }
  };

  const fetchClassHistory = async () => {
    try {
      console.log('📚 Fetching class history...');
      const response = await attendanceAPI.teacher.getClassHistory({ limit: 20 });
      if (response.success) {
        setClassHistory(response.data.classes);
      }
    } catch (error) {
      console.error('❌ Error fetching class history:', error);
    }
  };

  const refreshHistory = () => {
    fetchClassHistory();
    // Also refresh statistics if on dashboard view
    if (currentView === 'dashboard') {
      fetchStatistics();
    }
  };







  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner size="xl" text="Loading your dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {user?.name}
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your classes and attendance
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                <p className="text-xs text-gray-500">Teacher</p>
              </div>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                icon={LogOut}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-8">
          <button
            onClick={() => setCurrentView('schedule')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'schedule'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                : 'text-neutral-600 hover:text-primary-600'
            }`}
          >
            <Clock className="w-4 h-4 mr-2" />
            Schedule
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'dashboard'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                : 'text-neutral-600 hover:text-primary-600'
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('attendance')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'attendance'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                : 'text-neutral-600 hover:text-primary-600'
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Attendance
          </button>
          <button
            onClick={() => setCurrentView('history')}
            className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              currentView === 'history'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                : 'text-neutral-600 hover:text-primary-600'
            }`}
          >
            <History className="w-4 h-4 mr-2" />
            History
          </button>
        </div>

        {/* Schedule View */}
        {currentView === 'schedule' && (
          <TeacherDailySchedule 
            onAttendanceClick={(classData) => {
              console.log('📅 Schedule attendance click:', classData);
              setSelectedSubject({
                _id: classData.subjectId,
                name: classData.subjectName
              });
              setCurrentView('attendance');
              // Pre-select the batch and subject for attendance
              if (classData.batchName) {
                setSelectedBatch(classData.batchName);
                setSelectedSubject(classData.subjectName);
              }
            }}
            onAttendanceMarked={() => {
              // Refresh attendance status when attendance is marked
              if (currentView === 'schedule') {
                // This will trigger a re-render of the schedule
                window.location.reload();
              }
            }}
          />
        )}

        {/* Attendance View */}
        {currentView === 'attendance' && (
          <AttendanceManager 
            selectedBatch={selectedBatch}
            selectedSubject={selectedSubject}
            onBackToSchedule={() => setCurrentView('schedule')}
            onAttendanceMarked={refreshHistory}
          />
        )}

        {/* History View */}
        {currentView === 'history' && (
          <ClassHistory onRefresh={refreshHistory} />
        )}

        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div className="space-y-8">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-100">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">My Batches</p>
                    <p className="text-2xl font-bold text-neutral-900">{statistics.totalBatches || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-100">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BookOpen className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">My Subjects</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {teacherData?.subjects?.length || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-100">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Total Students</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {statistics.totalStudents || 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border border-neutral-100">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-neutral-600">Classes Today</p>
                    <p className="text-2xl font-bold text-neutral-900">
                      {classHistory.filter(c => 
                        new Date(c.date).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Subjects Overview */}
            {teacherData?.subjects && teacherData.subjects.length > 0 && (
              <div className="bg-white rounded-xl shadow-soft border border-neutral-100 overflow-hidden mb-8">
                <div className="px-6 py-4 border-b border-neutral-100">
                  <h2 className="text-lg font-semibold text-neutral-900">My Assigned Subjects</h2>
                  <p className="text-sm text-neutral-600">All subjects you are authorized to teach</p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teacherData.subjects.map((subject) => (
                      <div key={subject._id} className="bg-neutral-50 rounded-lg p-4 border border-neutral-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-neutral-900">{subject.name}</h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <p className="text-sm text-neutral-600">{subject.code}</p>
                              <span className="text-xs text-neutral-400">•</span>
                              <p className="text-sm text-neutral-600">{subject.department?.name || 'Unknown Course'}</p>
                              <span className="text-xs text-neutral-400">•</span>
                              <p className="text-sm text-neutral-600">Sem {subject.semester}</p>
                            </div>
                          </div>
                          <div className="h-8 w-8 bg-primary-100 rounded-lg flex items-center justify-center ml-3">
                            <BookOpen className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default EnhancedTeacherDashboard;
