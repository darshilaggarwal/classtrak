import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { Shield, Mail, ArrowRight, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

const AdminLoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOTP, setIsRequestingOTP] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (otpRequested && !formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (otpRequested && formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestOTP = async () => {
    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setIsRequestingOTP(true);
    
    try {
      console.log('📧 Requesting OTP for:', formData.email);
      
      const response = await authAPI.admin.requestOTP(formData.email);

      console.log('📡 OTP request response:', response);

      if (response.success) {
        console.log('✅ OTP sent successfully');
        setOtpRequested(true);
        toast.success('OTP sent to your email!');
      }
    } catch (error) {
      console.error('❌ OTP request error:', error);
      // Error handling is done by axios interceptor
    } finally {
      setIsRequestingOTP(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!otpRequested) {
      await handleRequestOTP();
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔍 Admin login attempt:', { email: formData.email, otp: formData.otp });
      
      const response = await authAPI.admin.login(formData.email, formData.otp);

      console.log('📡 Admin login response:', response);

      if (response.success) {
        console.log('✅ Admin login successful:', response.data);
        console.log('👤 Admin data:', response.data.user);
        console.log('🔑 Token:', response.data.token);
        
        login(response.data.user, response.data.token);
        
        console.log('🚀 Navigating to admin dashboard...');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error);
      console.error('❌ Error response:', error.response?.data);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl mb-6 shadow-soft">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
          <p className="text-slate-300">Access system administration</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-soft border border-white/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-200 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your admin email"
                  className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                  disabled={isLoading || isRequestingOTP}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            {/* OTP Field - Only show after OTP is requested */}
            {otpRequested && (
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-slate-200 mb-2">
                  OTP Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-slate-400" />
                  </div>
                  <Input
                    id="otp"
                    name="otp"
                    type="text"
                    value={formData.otp}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit OTP"
                    className={`pl-10 ${errors.otp ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-400">{errors.otp}</p>
                )}
                <p className="mt-2 text-sm text-slate-300">
                  Check your email for the OTP code
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-soft hover:shadow-medium transition-all duration-200 flex items-center justify-center"
              disabled={isLoading || isRequestingOTP}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing In...
                </div>
              ) : isRequestingOTP ? (
                <div className="flex items-center">
                  <RefreshCw className="animate-spin h-5 w-5 mr-2" />
                  Sending OTP...
                </div>
              ) : !otpRequested ? (
                <div className="flex items-center">
                  Request OTP
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              ) : (
                <div className="flex items-center">
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </div>
              )}
            </Button>
          </form>

          {/* Back to Main Login */}
          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-slate-300 hover:text-white text-sm transition-colors duration-200"
            >
              ← Back to Main Login
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            Secure access to ClassTrack Administration
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
