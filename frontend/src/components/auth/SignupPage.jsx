import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import { GraduationCap, User, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import Input from '../ui/Input';

const SignupPage = () => {
  const [searchParams] = useSearchParams();
  const userType = searchParams.get('type') || 'student';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    rno: '',
    otp: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [otpSent, setOtpSent] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateStep1 = () => {
    const newErrors = {};

    if (!formData.rno.trim()) {
      newErrors.rno = 'Roll number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};

    if (!formData.otp.trim()) {
      newErrors.otp = 'OTP is required';
    } else if (formData.otp.length !== 6) {
      newErrors.otp = 'OTP must be 6 digits';
    } else if (!/^\d{6}$/.test(formData.otp)) {
      newErrors.otp = 'OTP must contain only numbers';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one letter and one number';
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep1()) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('Sending OTP to your registered email...');
    
    try {
      const response = await apiService.auth.initiateStudentSignup(formData.rno);
      
      if (response.success) {
        setOtpSent(true);
        setCurrentStep(2);
        setStatusMessage('');
        toast.success('OTP sent to your registered email!');
        console.log('✅ OTP sent successfully to:', response.data.email);
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      setStatusMessage('');
      // Error handling is done by axios interceptor
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) {
      return;
    }

    setIsLoading(true);
    setStatusMessage('Verifying OTP and setting up your account...');
    
    try {
      const response = await apiService.auth.verifyStudentSignupOTP(
        formData.rno,
        formData.otp,
        formData.password
      );
      
      if (response.success) {
        setStatusMessage('Account created! Redirecting to dashboard...');
        login(response.data.user, response.data.token);
        toast.success('Account created successfully!');
        console.log('✅ Account setup completed for:', response.data.user.name);
        console.log('🎓 Roll Number:', response.data.user.rno);
        console.log('📱 Redirecting to dashboard...');
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/dashboard');
        }, 1000);
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      setStatusMessage('');
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

  const resendOTP = async () => {
    setIsLoading(true);
    
    try {
      const response = await apiService.auth.initiateStudentSignup(formData.rno);
      
      if (response.success) {
        toast.success('OTP resent successfully!');
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
    } finally {
      setIsLoading(false);
    }
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
            Join ClassTrack
          </h2>
          <p className="mt-2 text-sm md:text-base text-neutral-600">
            {currentStep === 1 
              ? 'Enter your roll number to get started'
              : 'Verify your email and create password'
            }
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            currentStep >= 1 
              ? 'bg-primary-600 text-white' 
              : 'bg-neutral-200 text-neutral-500'
          }`}>
            1
          </div>
          <div className={`h-1 w-12 rounded-full ${
            currentStep >= 2 ? 'bg-primary-600' : 'bg-neutral-200'
          }`} />
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold ${
            currentStep >= 2 
              ? 'bg-primary-600 text-white' 
              : 'bg-neutral-200 text-neutral-500'
          }`}>
            {currentStep > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
          </div>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div className="card p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="loading-spinner"></div>
              <p className="text-blue-700 font-medium">{statusMessage}</p>
            </div>
          </div>
        )}

        {/* Step 1: Roll Number */}
        {currentStep === 1 && (
          <div className="card p-4 md:p-6 lg:p-8">
            <form className="space-y-6" onSubmit={handleStep1Submit}>
              <Input
                label="Roll Number"
                name="rno"
                type="text"
                value={formData.rno}
                onChange={handleInputChange}
                placeholder="Enter your roll number"
                icon={User}
                error={errors.rno}
                helper="We'll send an OTP to your registered email address"
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                icon={ArrowRight}
                iconPosition="right"
              >
                Send OTP
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Step 2: OTP Verification & Password */}
        {currentStep === 2 && (
          <div className="card p-4 md:p-6 lg:p-8">
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center">
                <Mail className="w-5 h-5 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-green-700 font-medium">
                    OTP sent to your registered email!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Check your inbox (and spam folder) for a 6-digit verification code
                  </p>
                </div>
              </div>
            </div>

            <form className="space-y-6" onSubmit={handleStep2Submit}>
              <Input
                label="Enter OTP"
                name="otp"
                type="text"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                error={errors.otp}
                required
              />

              <Input
                label="Create Password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                error={errors.password}
                helper="Must be at least 6 characters with letters and numbers"
                required
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
                error={errors.confirmPassword}
                required
              />

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                icon={CheckCircle}
                iconPosition="right"
              >
                Create Account
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600">
                Didn't receive OTP?{' '}
                <button
                  type="button"
                  onClick={resendOTP}
                  disabled={isLoading}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                >
                  Resend OTP
                </button>
              </p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-neutral-500">
            © 2024 ClassTrack. Built for educational excellence.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
