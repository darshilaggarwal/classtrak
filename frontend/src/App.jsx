import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Import pages
import LoginPage from './components/auth/LoginPage';
import SignupPage from './components/auth/SignupPage';
import TeacherSignupPage from './components/auth/TeacherSignupPage';
import AdminLoginPage from './components/auth/AdminLoginPage';
import StudentDashboard from './components/dashboard/EnhancedStudentDashboard';
import TeacherDashboard from './components/dashboard/EnhancedTeacherDashboard';
import AdminDashboard from './components/dashboard/AdminDashboard';
import MonthlyReportPage from './components/reports/MonthlyReportPage';

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner size="xl" text="Loading..." />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requiredRole && getUserRole() !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

// Dashboard Route Component
const DashboardRoute = () => {
  const { getUserRole, isLoading, getUserInfo } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner size="xl" text="Loading dashboard..." />
      </div>
    );
  }
  
  const userRole = getUserRole();
  const userInfo = getUserInfo();
  
  if (userRole === 'student') {
    return <StudentDashboard />;
  } else if (userRole === 'teacher') {
    return <TeacherDashboard />;
  } else if (userRole === 'admin') {
    return <AdminDashboard />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
        <LoadingSpinner size="xl" text="Loading..." />
      </div>
    );
  }
  
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1e293b',
                boxShadow: '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Routes */}
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <SignupPage />
                </PublicRoute>
              }
            />
            <Route
              path="/teacher/signup"
              element={
                <PublicRoute>
                  <TeacherSignupPage />
                </PublicRoute>
              }
            />
            <Route
              path="/admin/login"
              element={
                <PublicRoute>
                  <AdminLoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRoute />
                </ProtectedRoute>
              }
            />

            <Route
              path="/student/*"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/teacher/*"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherDashboard />
                </ProtectedRoute>
              }
            />

            {/* Monthly Report Route (Teacher Only) */}
            <Route
              path="/reports/monthly"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <MonthlyReportPage />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            {/* 404 Route */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-neutral-900 mb-4">404</h1>
                    <p className="text-neutral-600 mb-8">Page not found</p>
                    <a
                      href="/"
                      className="inline-flex items-center px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200"
                    >
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
 