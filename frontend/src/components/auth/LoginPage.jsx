import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { GraduationCap, Mail, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

const LoginPage = () => {
  const [userType, setUserType] = useState('student');
  const [formData, setFormData] = useState({
    identifier: '', // roll number for student, email for teacher
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.identifier.trim()) {
      newErrors.identifier = userType === 'student' 
        ? 'Roll number is required' 
        : 'Username is required';
    } else if (userType === 'teacher' && formData.identifier.length < 3) {
      newErrors.identifier = 'Username must be at least 3 characters';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      let response;
      
      if (userType === 'student') {
        response = await authAPI.student.login(formData.identifier, formData.password);
      } else {
        // Use username login for teachers (testing mode)
        response = await authAPI.teacher.loginWithUsername(formData.identifier, formData.password);
      }

      if (response.success) {
        console.log('✅ Login successful:', response.data);
        console.log('👤 User data:', response.data.user);
        console.log('🔑 Token:', response.data.token);
        
        
        login(response.data.user, response.data.token);
        
        console.log('🚀 Navigating to dashboard...');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Error handling is done by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({
      identifier: '',
      password: '',
    });
    setErrors({});
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-6 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-sm sm:max-w-md w-full space-y-6 md:space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 md:h-16 md:w-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl flex items-center justify-center shadow-soft mb-4 md:mb-6 animate-bounce-subtle">
            <GraduationCap className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <h2 className="text-2xl md:text-3xl font-display font-bold gradient-text">
            Welcome to ClassTrack
          </h2>
          <p className="mt-2 text-sm md:text-base text-neutral-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* User Type Toggle */}
        <div className="bg-white rounded-2xl shadow-soft p-1 border border-neutral-100">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => handleUserTypeChange('student')}
              className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                userType === 'student'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              <User className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Student</span>
              <span className="sm:hidden">Student</span>
            </button>
            <button
              type="button"
              onClick={() => handleUserTypeChange('teacher')}
              className={`flex items-center justify-center px-3 md:px-4 py-2 md:py-3 rounded-xl text-xs md:text-sm font-semibold transition-all duration-200 ${
                userType === 'teacher'
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-soft'
                  : 'text-neutral-600 hover:text-primary-600'
              }`}
            >
              <GraduationCap className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Teacher</span>
              <span className="sm:hidden">Teacher</span>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="card p-4 md:p-6 lg:p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label={userType === 'student' ? 'Roll Number' : 'Username'}
              name="identifier"
              type="text"
              value={formData.identifier}
              onChange={handleInputChange}
              placeholder={userType === 'student' ? 'Enter your roll number' : 'Enter your username'}
              icon={User}
              error={errors.identifier}
              required
            />

            <Input
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              icon={showPassword ? EyeOff : Eye}
              iconPosition="right"
              onIconClick={() => setShowPassword(!showPassword)}
              error={errors.password}
              required
            />

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link
                  to={`/forgot-password?type=${userType}`}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              loading={isLoading}
              icon={ArrowRight}
              iconPosition="right"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              {userType === 'student' ? (
                <>
                  New to ClassTrack?{' '}
                  <Link
                    to="/signup"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    Create an account
                  </Link>
                </>
              ) : (
                <>
                  New teacher?{' '}
                  <Link
                    to="/teacher/signup"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                  >
                    Sign up with your @imaginxp.com email
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-neutral-500 text-sm">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
            >
              Contact your institution
            </Link>
          </p>
          <div className="mt-4">
            <Link
              to="/admin/login"
              className="text-neutral-400 hover:text-neutral-600 text-sm transition-colors duration-200"
            >
              👨‍💼 Admin Access
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
