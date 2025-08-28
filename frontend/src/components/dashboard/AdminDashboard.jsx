import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  Home,
  GraduationCap,
  Clock,
  TrendingUp,
  Menu,
  X,
  Upload,
  Download
} from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';
import DataImportModal from '../admin/DataImportModal';
import AddStudentModal from '../admin/AddStudentModal';
import AddFacultyModal from '../admin/AddFacultyModal';
import TimetableManagement from './TimetableManagement';
import { downloadAttendancePDF, downloadAttendanceCSV } from '../../utils/pdfGenerator';

const AdminDashboard = () => {
  const { logout, getUserInfo } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importType, setImportType] = useState('students');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddFacultyModal, setShowAddFacultyModal] = useState(false);
  const user = getUserInfo();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: Home, color: 'text-blue-600', bgColor: 'bg-blue-50' },
    { id: 'departments', label: 'Programs', icon: GraduationCap, color: 'text-purple-600', bgColor: 'bg-purple-50' },
    { id: 'batches', label: 'Batches', icon: Users, color: 'text-green-600', bgColor: 'bg-green-50' },
    { id: 'subjects', label: 'Courses', icon: BookOpen, color: 'text-orange-600', bgColor: 'bg-orange-50' },
    { id: 'teachers', label: 'Faculty', icon: Users, color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    { id: 'students', label: 'Students', icon: Users, color: 'text-pink-600', bgColor: 'bg-pink-50' },
    { id: 'timetable', label: 'Timetable', icon: Calendar, color: 'text-red-600', bgColor: 'bg-red-50' },
    { id: 'attendance', label: 'Attendance', icon: BarChart3, color: 'text-teal-600', bgColor: 'bg-teal-50' },
  ];

  const renderContent = () => {
    try {
      switch (activeTab) {
        case 'overview':
          return <OverviewTab />;
        case 'departments':
          return <DepartmentsTab />;
        case 'batches':
          return <BatchesTab />;
        case 'subjects':
          return <SubjectsTab />;
        case 'teachers':
          return <TeachersTab 
            onImportClick={() => {
              setImportType('teachers');
              setShowImportModal(true);
            }}
            onAddClick={() => setShowAddFacultyModal(true)}
          />;
        case 'students':
          return <StudentsTab 
            onImportClick={() => {
              setImportType('students');
              setShowImportModal(true);
            }}
            onAddClick={() => setShowAddStudentModal(true)}
          />;
        case 'timetable':
          return <TimetableManagement />;
        case 'attendance':
          return <AttendanceTab />;
        default:
          return <OverviewTab />;
      }
    } catch (error) {
      console.error('Error rendering content:', error);
      return (
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Content</h3>
          <p className="text-gray-600">There was an error loading the {activeTab} content.</p>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:inset-0 lg:flex-shrink-0 lg:z-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h1 className="ml-3 text-xl font-bold text-gray-900">ClassTrack</h1>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">Super Administrator</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer ${
                      isActive
                        ? `${item.bgColor} ${item.color} border border-current border-opacity-20 shadow-sm`
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
              <Button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Header */}
          <header className="bg-white/80 backdrop-blur-xl shadow-sm border-b border-gray-200/50 flex-shrink-0">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="ml-2 lg:ml-0">
                  <h1 className="text-xl font-light text-gray-800 tracking-wide">
                    {navigationItems.find(item => item.id === activeTab)?.label}
                  </h1>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                    {activeTab === 'overview' && 'Dashboard Overview'}
                    {activeTab === 'departments' && 'Academic Programs'}
                    {activeTab === 'batches' && 'Student Batches'}
                    {activeTab === 'subjects' && 'Course Catalog'}
                    {activeTab === 'teachers' && 'Faculty Directory'}
                    {activeTab === 'students' && 'Student Registry'}
                    {activeTab === 'timetable' && 'Academic Schedule'}
                    {activeTab === 'attendance' && 'Attendance Records'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Administrator</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

      {/* Data Import Modal */}
      <DataImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        type={importType}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddStudentModal}
        onClose={() => setShowAddStudentModal(false)}
        onSuccess={() => {
          // Refresh the students list
          if (activeTab === 'students') {
            // This will trigger a re-render of the StudentsTab
            setActiveTab('students');
          }
        }}
      />

      {/* Add Faculty Modal */}
      <AddFacultyModal
        isOpen={showAddFacultyModal}
        onClose={() => setShowAddFacultyModal(false)}
        onSuccess={() => {
          // Refresh the teachers list
          if (activeTab === 'teachers') {
            // This will trigger a re-render of the TeachersTab
            setActiveTab('teachers');
          }
        }}
      />
    </div>
  );
};

// Tab Components
const OverviewTab = () => {
  const [overviewData, setOverviewData] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalSubjects: 0,
    totalDepartments: 0,
    totalBatches: 0,
    todayAttendance: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getOverview();
      if (response.success) {
        setOverviewData(response.data);
      }
    } catch (error) {
      console.error('Error fetching overview data:', error);
      toast.error('Failed to fetch overview data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-light text-gray-800 tracking-wide mb-2">Welcome back, Administrator</h2>
        <p className="text-gray-600 font-medium">Here's what's happening in your institution today</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">Total Students</p>
              <p className="text-4xl font-bold">{overviewData.totalStudents.toLocaleString()}</p>
              <p className="text-blue-200 text-xs mt-1">Active students</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Total Teachers</p>
              <p className="text-4xl font-bold">{overviewData.totalTeachers.toLocaleString()}</p>
              <p className="text-green-200 text-xs mt-1">Active faculty</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">Total Subjects</p>
              <p className="text-4xl font-bold">{overviewData.totalSubjects.toLocaleString()}</p>
              <p className="text-purple-200 text-xs mt-1">Active courses</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">Departments</p>
              <p className="text-4xl font-bold">{overviewData.totalDepartments.toLocaleString()}</p>
              <p className="text-orange-200 text-xs mt-1">Active departments</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium mb-1">Total Batches</p>
              <p className="text-4xl font-bold">{overviewData.totalBatches.toLocaleString()}</p>
              <p className="text-teal-200 text-xs mt-1">Active batches</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-pink-100 text-sm font-medium mb-1">Today's Classes</p>
              <p className="text-4xl font-bold">{overviewData.todayAttendance.toLocaleString()}</p>
              <p className="text-pink-200 text-xs mt-1">Scheduled today</p>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DepartmentsTab = () => {
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [showBatches, setShowBatches] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchBatches();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await adminAPI.getBatches();
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleDepartmentClick = (department) => {
    setSelectedDepartment(department);
    setShowBatches(true);
  };

  const handleBackToPrograms = () => {
    setSelectedDepartment(null);
    setShowBatches(false);
  };

  // Filter batches for selected department
  const departmentBatches = batches.filter(batch => 
    batch.department && batch.department._id === selectedDepartment?._id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show batches view
  if (showBatches && selectedDepartment) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToPrograms}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {selectedDepartment.name} - Batches
              </h2>
              <p className="text-gray-600 mt-1">All batches running under this program</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Batch Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Students
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {departmentBatches.map((batch) => (
                  <tr key={batch._id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-sm">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-sm">
                            <span className="text-white font-semibold text-xs">
                              {batch.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">
                            {batch.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                      {batch.totalStudents || 0}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-600">
                      {batch.year || 'N/A'}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        batch.isActive 
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                          : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                      }`}>
                        {batch.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Show programs view
  return (
    <div>


      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Program
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Batches
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {departments.map((dept) => (
                <tr 
                  key={dept._id} 
                  className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 hover:shadow-sm cursor-pointer"
                  onClick={() => handleDepartmentClick(dept)}
                >
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {dept.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {dept.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {dept.code}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600">
                    <div className="max-w-xs">
                      {dept.description || 'No description available'}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.totalBatches || 0}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.totalStudents || 0}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {dept.totalTeachers || 0}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                      dept.isActive 
                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200' 
                        : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                    }`}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const BatchesTab = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBatches();
  }, []);

  // Helper function to extract year from batch name and clean the name
  const parseBatchInfo = (batchName) => {
    // Extract year from brackets like "BTech AIML (2025-29)"
    const yearMatch = batchName.match(/\((\d{4}-\d{2})\)/);
    const year = yearMatch ? yearMatch[1] : '';
    
    // Remove year from batch name
    const cleanName = batchName.replace(/\s*\(\d{4}-\d{2}\)/, '');
    
    return { cleanName, year };
  };

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getBatches();
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
      toast.error('Failed to fetch batches');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>


      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Batch Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Academic Year
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {batches.map((batch) => {
                const { cleanName, year } = parseBatchInfo(batch.name);
                return (
                <tr key={batch._id} className="hover:bg-gradient-to-r hover:from-green-50 hover:to-teal-50 transition-all duration-300 hover:shadow-sm">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {cleanName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {cleanName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {year || batch.year || 'N/A'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    {batch.totalStudents || 0}
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-600">
                    <div className="max-w-xs">
                      {batch.description || 'No description available'}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      batch.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {batch.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SubjectsTab = () => {
  const [subjects, setSubjects] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSubjects();
    fetchDepartments();
  }, []);

  useEffect(() => {
    filterSubjects();
  }, [subjects, selectedCourse, selectedSemester, searchTerm]);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const filterSubjects = () => {
    let filtered = [...subjects];

    // Search by course name
    if (searchTerm) {
      filtered = filtered.filter(subject => 
        subject.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCourse) {
      filtered = filtered.filter(subject => 
        subject.department?._id === selectedCourse
      );
    }

    if (selectedSemester) {
      filtered = filtered.filter(subject => 
        subject.semester === parseInt(selectedSemester)
      );
    }

    setFilteredSubjects(filtered);
  };

  const clearFilters = () => {
    setSelectedCourse('');
    setSelectedSemester('');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>


      {/* Search and Filters */}
      <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              <option value="">All Courses</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              <option value="">All Semesters</option>
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
              <option value="3">Semester 3</option>
              <option value="4">Semester 4</option>
              <option value="5">Semester 5</option>
              <option value="6">Semester 6</option>
              <option value="7">Semester 7</option>
              <option value="8">Semester 8</option>
            </select>
            <Button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all duration-200"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{filteredSubjects.length}</span> of <span className="font-semibold text-gray-900">{subjects.length}</span> courses
          </div>
          <div className="text-sm text-gray-500">
            {searchTerm && `Searching for: "${searchTerm}"`}
            {selectedCourse && ` • ${departments.find(d => d._id === selectedCourse)?.name || 'Course'}`}
            {selectedSemester && ` • Semester ${selectedSemester}`}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Course Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredSubjects.map((subject) => (
                <tr key={subject._id} className="hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 hover:shadow-sm">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {subject.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {subject.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {subject.code}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {subject.department?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                    Semester {subject.semester}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      subject.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {subject.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TeachersTab = ({ onImportClick, onAddClick }) => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getTeachers();
      if (response.success) {
        setTeachers(response.data);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
      toast.error('Failed to fetch faculty');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <div className="flex space-x-3">
                      <Button
              onClick={onImportClick}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
            >
              <Upload className="w-4 h-4" />
              <span>Import Faculty (Structured)</span>
            </Button>
          <Button
            onClick={onAddClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Add Faculty
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Courses & Batches
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Courses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {teachers.map((teacher) => (
                <tr key={teacher._id} className="hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 transition-all duration-300 hover:shadow-sm">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-sm">
                          <span className="text-white font-semibold text-sm">
                            {teacher.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {teacher.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{teacher.username}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-gray-900">{teacher.email}</div>
                      <div className="text-sm text-gray-500">{teacher.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-900">
                    <div className="space-y-3">
                      {teacher.subjects && teacher.subjects.length > 0 ? (
                        teacher.subjects.map((subject, index) => (
                          <div key={index} className="border-l-2 border-green-200 pl-3">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                                {subject.name}
                              </span>
                              <span className="text-xs text-gray-500">
                                {subject.department?.name} (Sem {subject.semester})
                              </span>
                            </div>
                            {subject.batches && subject.batches.length > 0 ? (
                              <div className="ml-2">
                                <span className="text-xs text-gray-400">Batches: </span>
                                {subject.batches.map((batch, batchIndex) => (
                                  <span key={batchIndex} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 mr-1">
                                    {batch.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div className="ml-2">
                                <span className="text-xs text-gray-400">No batches assigned</span>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No subjects assigned</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-900">
                    <div className="flex flex-wrap gap-2">
                      {teacher.courses && teacher.courses.length > 0 ? (
                        teacher.courses.slice(0, 3).map((course, index) => (
                          <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {course.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No course assigned</span>
                      )}
                      {teacher.courses && teacher.courses.length > 3 && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{teacher.courses.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      teacher.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {teacher.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const StudentsTab = ({ onImportClick, onAddClick }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    fetchStudents();
    fetchDepartments();
    fetchBatches();
  }, [currentPage, searchTerm, selectedDepartment, selectedBatch]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStudents({
        page: currentPage,
        limit: 20,
        search: searchTerm,
        department: selectedDepartment,
        batch: selectedBatch
      });
      if (response.success) {
        setStudents(response.data.students);
        setTotalPages(response.data.totalPages);
        setTotalStudents(response.data.totalStudents);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await adminAPI.getBatches();
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleDepartmentFilter = (e) => {
    setSelectedDepartment(e.target.value);
    setCurrentPage(1);
  };

  const handleBatchFilter = (e) => {
    setSelectedBatch(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedBatch('');
    setCurrentPage(1);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Student Management</h2>
        <div className="flex space-x-3">
          <Button
            onClick={onImportClick}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Students</span>
          </Button>
          <Button
            onClick={onAddClick}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 p-6 bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20">
        <div className="flex flex-col lg:flex-row gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search students by name, roll number, or email..."
                value={searchTerm}
                onChange={handleSearch}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <select
              value={selectedDepartment}
              onChange={handleDepartmentFilter}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <select
              value={selectedBatch}
              onChange={handleBatchFilter}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
            <Button
              onClick={clearFilters}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-xl transition-all duration-200"
            >
              Clear Filters
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-gray-900">{students.length}</span> of <span className="font-semibold text-gray-900">{totalStudents}</span> students
          </div>
          <div className="text-sm text-gray-500">
            {searchTerm && `Searching for: "${searchTerm}"`}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading students...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Enrollment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Academic
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student._id} className="hover:bg-gradient-to-r hover:from-pink-50 hover:to-rose-50 transition-all duration-300 hover:shadow-sm">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-sm">
                              <span className="text-white font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {student.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {student.rno}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{student.email}</div>
                          <div className="text-sm text-gray-500">{student.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">{student.courseName}</div>
                          <div className="text-sm text-gray-500">{student.courseDuration}</div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {student.department?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {student.batch?.name || 'N/A'} • Sem {student.semester}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          student.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
};

const TimetableTab = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Timetable Management</h2>
    <p className="text-gray-600">Timetable creation coming soon...</p>
  </div>
);

const AttendanceTab = () => {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [dateRange, setDateRange] = useState('month'); // week, month, custom
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceData, setAttendanceData] = useState(null);
  const [viewMode, setViewMode] = useState('records'); // 'records' or 'matrix'
  const [studentMatrix, setStudentMatrix] = useState(null);

  useEffect(() => {
    fetchOverview();
    fetchDepartments();
    fetchBatches();
  }, []);

  useEffect(() => {
    if (viewMode === 'matrix') {
      fetchStudentMatrix();
    } else if (selectedDepartment || selectedBatch) {
      fetchAttendanceData();
    }
  }, [selectedDepartment, selectedBatch, dateRange, startDate, endDate, viewMode]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAttendanceOverview();
      if (response.success) {
        setOverview(response.data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
      toast.error('Failed to fetch attendance overview');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await adminAPI.getDepartments();
      if (response.success) {
        setDepartments(response.data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const response = await adminAPI.getBatches();
      if (response.success) {
        setBatches(response.data);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchStudentMatrix = async () => {
    try {
      setLoading(true);
      let params = {};
      
      if (dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = endOfWeek.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = endOfMonth.toISOString().split('T')[0];
      } else if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      if (selectedBatch) {
        params.batchId = selectedBatch;
      }

      const response = await adminAPI.getStudentAttendanceMatrix(params);
      
      if (response?.success) {
        setStudentMatrix(response.data);
      }
    } catch (error) {
      console.error('Error fetching student matrix:', error);
      toast.error('Failed to fetch student attendance matrix');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      let params = {};
      
      if (dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = endOfWeek.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = endOfMonth.toISOString().split('T')[0];
      } else if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      let response;
      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
        response = await adminAPI.getAllAttendance(params);
      } else if (selectedBatch) {
        params.batchId = selectedBatch;
        response = await adminAPI.getAllAttendance(params);
      } else {
        // Show all attendance records
        response = await adminAPI.getAllAttendance(params);
      }

      if (response?.success) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast.error('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'custom': return 'Custom Range';
      default: return 'This Month';
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Generating PDF...');
      
      let params = {};
      
      if (dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = endOfWeek.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = endOfMonth.toISOString().split('T')[0];
      } else if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      if (selectedBatch) {
        params.batchId = selectedBatch;
      }

      await downloadAttendancePDF(params);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error('Failed to download report. Please try again.');
    }
  };

  const handleDownloadCSV = async () => {
    try {
      // Show loading toast
      const loadingToast = toast.loading('Generating CSV...');
      
      let params = {};
      
      if (dateRange === 'week') {
        const today = new Date();
        const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        params.startDate = startOfWeek.toISOString().split('T')[0];
        params.endDate = endOfWeek.toISOString().split('T')[0];
      } else if (dateRange === 'month') {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        params.startDate = startOfMonth.toISOString().split('T')[0];
        params.endDate = endOfMonth.toISOString().split('T')[0];
      } else if (dateRange === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      if (selectedDepartment) {
        params.departmentId = selectedDepartment;
      }
      if (selectedBatch) {
        params.batchId = selectedBatch;
      }

      await downloadAttendanceCSV(params);
      
      // Dismiss loading toast and show success
      toast.dismiss(loadingToast);
      toast.success('CSV downloaded successfully!');
    } catch (error) {
      console.error('CSV download error:', error);
      toast.error('Failed to download CSV. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
  <div>
          <h2 className="text-2xl font-bold text-gray-900">Attendance Analytics</h2>
          <p className="text-gray-600">Monitor attendance across all departments and batches</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('records')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'records'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Records
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'matrix'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Student Matrix
            </button>
          </div>
          <Button
            onClick={handleDownloadPDF}
            disabled={loading}
            icon={Download}
            variant="secondary"
          >
            Download PDF
          </Button>
          <Button
            onClick={handleDownloadCSV}
            disabled={loading}
            icon={Download}
            variant="secondary"
          >
            Download CSV
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monthly Classes</p>
                <p className="text-2xl font-bold text-gray-900">{overview.monthlyAttendance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Weekly Classes</p>
                <p className="text-2xl font-bold text-gray-900">{overview.weeklyAttendance}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg. Students/Class</p>
                <p className="text-2xl font-bold text-gray-900">{overview.averageAttendance}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Attendance Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedBatch('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => {
                setSelectedBatch(e.target.value);
                setSelectedDepartment('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Batches</option>
              {batches.map((batch) => (
                <option key={batch._id} value={batch._id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              onClick={viewMode === 'matrix' ? fetchStudentMatrix : fetchAttendanceData}
              disabled={loading}
              icon={BarChart3}
              variant="primary"
              className="w-full"
            >
              View Data
            </Button>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content based on view mode */}
      {viewMode === 'matrix' ? (
        <StudentAttendanceMatrix 
          data={studentMatrix} 
          loading={loading} 
          dateRange={getDateRangeLabel()}
        />
      ) : (
        <AttendanceRecords 
          data={attendanceData} 
          loading={loading} 
          dateRange={getDateRangeLabel()}
          selectedDepartment={selectedDepartment}
          selectedBatch={selectedBatch}
        />
      )}
  </div>
);
};

// Student Attendance Matrix Component
const StudentAttendanceMatrix = ({ data, loading, dateRange }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading student attendance matrix...</span>
        </div>
      </div>
    );
  }

  if (!data || !data.students || data.students.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No student data</h3>
          <p className="mt-1 text-sm text-gray-500">
            No student attendance data found for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Student Attendance Matrix ({dateRange})
        </h3>
        <p className="text-sm text-gray-600">
          {data.totalStudents} students • {data.subjects.length} subjects
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Student
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roll No
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              {data.subjects.map((subject) => (
                <th key={subject} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {subject}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                Overall
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.students.map((student) => (
              <tr key={student.studentId} className="hover:bg-gray-50">
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white z-10">
                  {student.studentName}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.rollNumber}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.department}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.batch}
                </td>
                {data.subjects.map((subject) => {
                  const subjectData = student.subjects[subject];
                  return (
                    <td key={subject} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="text-center">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          subjectData.percentage >= 80 ? 'bg-green-100 text-green-800' :
                          subjectData.percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {subjectData.percentage}%
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {subjectData.presentClasses}/{subjectData.totalClasses}
                        </div>
                      </div>
                    </td>
                  );
                })}
                <td className="px-4 py-4 whitespace-nowrap bg-blue-50">
                  <div className="text-center">
                    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      student.overallPercentage >= 80 ? 'bg-green-100 text-green-800' :
                      student.overallPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {student.overallPercentage}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {student.totalPresent}/{student.totalClasses}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Attendance Records Component
const AttendanceRecords = ({ data, loading, dateRange, selectedDepartment, selectedBatch }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading attendance data...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
          <p className="mt-1 text-sm text-gray-500">
            No attendance data found for the selected filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Attendance Records ({dateRange})
        </h3>
        <p className="text-sm text-gray-600">
          {selectedDepartment ? 'Filtered by Department' : selectedBatch ? 'Filtered by Batch' : 'All Records'}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Batch
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Teacher
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Present
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Absent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record, index) => {
              const presentCount = record.records.filter(r => r.status === 'present').length;
              const totalCount = record.records.length;
              const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
              
              return (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.batch?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.takenBy?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {totalCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {presentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {totalCount - presentCount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      percentage >= 80 ? 'bg-green-100 text-green-800' :
                      percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {percentage}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsTab = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Reports</h2>
    <p className="text-gray-600">Report generation coming soon...</p>
  </div>
);

const SettingsTab = () => (
  <div>
    <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
    <p className="text-gray-600">System settings coming soon...</p>
  </div>
);

export default AdminDashboard;
