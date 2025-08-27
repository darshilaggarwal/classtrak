import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀 Making API request to:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth utility functions
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const setAuthToken = (token) => {
  localStorage.setItem('token', token);
};

export const setUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

const apiService = {
  // Auth APIs
  auth: {
    // Student login
    studentLogin: async (credentials) => {
      const response = await api.post('/auth/student/login', credentials);
      return response.data;
    },

    // Teacher login
    teacherLogin: async (credentials) => {
      const response = await api.post('/auth/teacher/login', credentials);
      return response.data;
    },

    // Teacher signup initiation
    initiateTeacherSignup: async (email) => {
      const response = await api.post('/auth/teacher/initiate-signup', { email });
      return response.data;
    },

    // Teacher signup OTP verification
    verifyTeacherSignupOTP: async (email, otp, password) => {
      const response = await api.post('/auth/teacher/verify-signup-otp', { email, otp, password });
      return response.data;
    },

    // Admin OTP request
    adminRequestOTP: async (email) => {
      const response = await api.post('/auth/admin/request-otp', { email });
      return response.data;
    },

    // Admin login with OTP
    adminLogin: async (email, otp) => {
      const response = await api.post('/auth/admin/login', { email, otp });
      return response.data;
    },

    // Logout
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
  },

  // Admin APIs
  admin: {
    // Overview data
    getOverview: async () => {
      const response = await api.get('/admin/overview');
      return response.data;
    },

    // Get all batches
    getBatches: async () => {
      const response = await api.get('/admin/batches');
      return response.data;
    },

    // Import teachers
    importTeachers: async (data) => {
      const response = await api.post('/admin/import/teachers', data);
      return response.data;
    },

    // Import students
    importStudents: async (data) => {
      const response = await api.post('/admin/import/students', data);
      return response.data;
    },

    // Download template
    downloadTemplate: async (type) => {
      const response = await api.get(`/admin/template/${type}`);
      return response.data;
    },
  },

  // Teacher APIs
  teacher: {
    // Get teacher profile
    getProfile: async () => {
      const response = await api.get('/teacher/profile');
      return response.data;
    },

    // Get teacher subjects
    getSubjects: async () => {
      const response = await api.get('/attendance/teacher/subjects');
      return response.data;
    },

    // Get teacher batches
    getBatches: async () => {
      const response = await api.get('/attendance/teacher/batches');
      return response.data;
    },

    // Get students for a batch
    getStudents: async (batchId) => {
      const response = await api.get(`/attendance/teacher/students/${batchId}`);
      return response.data;
    },

    // Mark attendance
    markAttendance: async (data) => {
      const response = await api.post('/attendance/teacher/mark', data);
      return response.data;
    },

    // Get class history
    getClassHistory: async (filters = {}) => {
      const response = await api.get('/attendance/teacher/history', { params: filters });
      return response.data;
    },

    // Get daily schedule
    getDailySchedule: async (date) => {
      const response = await api.get(`/timetable/teacher/schedule?date=${date}`);
      return response.data;
    },

    // Get attendance status
    getAttendanceStatus: async (date) => {
      const response = await api.get(`/attendance/teacher/status?date=${date}`);
      return response.data;
    },
  },

  // Student APIs
  student: {
    // Get student profile
    getProfile: async () => {
      const response = await api.get('/student/profile');
      return response.data;
    },

    // Get student timetable
    getTimetable: async () => {
      const response = await api.get('/timetable/student/schedule');
      return response.data;
    },

    // Get student attendance
    getAttendance: async (filters = {}) => {
      const response = await api.get('/attendance/student/records', { params: filters });
      return response.data;
    },
  },

  // Timetable APIs
  timetable: {
    // Get all timetables (admin)
    getAllTimetables: async () => {
      const response = await api.get('/timetable/admin/all');
      return response.data;
    },

    // Import timetable (admin)
    importTimetable: async (data) => {
      const response = await api.post('/timetable/admin/import', data);
      return response.data;
    },
  },
};

export default apiService;
