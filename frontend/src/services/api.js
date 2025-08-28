import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001') + '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    console.log('🚀 Making API request to:', config.baseURL + config.url);
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
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
    const message = error.response?.data?.message || 'Something went wrong!';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      logout();
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  student: {
    initiateLogin: async (rno) => {
      const response = await api.post('/auth/student/initiate-login', { rno });
      return response.data;
    },
    
    verifyOTP: async (rno, otp, password) => {
      const response = await api.post('/auth/student/verify-otp', {
        rno,
        otp,
        password,
      });
      return response.data;
    },
    
    login: async (rno, password) => {
      const response = await api.post('/auth/student/login', {
        rno,
        password,
      });
      return response.data;
    },
    
    requestPasswordReset: async (rno) => {
      const response = await api.post('/auth/student/request-password-reset', {
        rno,
      });
      return response.data;
    },
    
    resetPassword: async (rno, otp, newPassword) => {
      const response = await api.post('/auth/student/reset-password', {
        rno,
        otp,
        newPassword,
      });
      return response.data;
    },
  },

  teacher: {
    // Teacher signup with @imaginxp.com email
    initiateSignup: async (email) => {
      const response = await api.post('/auth/teacher/initiate-signup', { email });
      return response.data;
    },
    
    verifySignupOTP: async (email, otp, password) => {
      const response = await api.post('/auth/teacher/verify-signup-otp', {
        email,
        otp,
        password,
      });
      return response.data;
    },

    // Existing teacher login
    initiateLogin: async (email) => {
      const response = await api.post('/auth/teacher/initiate-login', { email });
      return response.data;
    },
    
    verifyOTP: async (email, otp, password) => {
      const response = await api.post('/auth/teacher/verify-otp', {
        email,
        otp,
        password,
      });
      return response.data;
    },
    
    login: async (email, password) => {
      const response = await api.post('/auth/teacher/login', {
        email,
        password,
      });
      return response.data;
    },

    // Username/password login for testing
    loginWithUsername: async (username, password) => {
      const response = await api.post('/auth/teacher/login-username', {
        username,
        password,
      });
      return response.data;
    },
    
    requestPasswordReset: async (email) => {
      const response = await api.post('/auth/teacher/request-password-reset', {
        email,
      });
      return response.data;
    },
    
    resetPassword: async (email, otp, newPassword) => {
      const response = await api.post('/auth/teacher/reset-password', {
        email,
        otp,
        newPassword,
      });
      return response.data;
    },

    // Get teacher's own details
    getMyDetails: async () => {
      const response = await api.get('/teacher/profile');
      return response.data;
    },
    
    // Get teacher's batches
    getMyBatches: async () => {
      const response = await api.get('/teacher/batches');
      return response.data;
    },
    
    // Get teacher's subjects
    getMySubjects: async () => {
      const response = await api.get('/teacher/subjects');
      return response.data;
    },
  },
  
  admin: {
    // Admin OTP request
    requestOTP: async (email) => {
      const response = await api.post('/auth/admin/request-otp', {
        email,
      });
      return response.data;
    },
    
    // Admin login with OTP
    login: async (email, otp) => {
      const response = await api.post('/auth/admin/login', {
        email,
        otp,
      });
      return response.data;
    },
  },
};

// Attendance API calls
export const attendanceAPI = {
  // Student endpoints
  student: {
    getMyAttendance: async (params = {}) => {
      const response = await api.get('/attendance/student/my-attendance', {
        params,
      });
      return response.data;
    },
    
    getSummary: async () => {
      const response = await api.get('/attendance/student/summary');
      return response.data;
    },
  },

  // Teacher endpoints
  teacher: {
    getStudents: async () => {
      const response = await api.get('/attendance/teacher/students');
      return response.data;
    },
    
    getStudentsForBatch: async (batchId) => {
      const response = await api.get(`/attendance/teacher/students/${batchId}`);
      return response.data;
    },
    
    getStudentsForBatchByName: async (batchName) => {
      const response = await api.get(`/attendance/teacher/students/batch/${batchName}`);
      return response.data;
    },
    
    getBatches: async () => {
      const response = await api.get('/attendance/teacher/batches');
      return response.data;
    },
    
    markAttendance: async (attendanceData) => {
      const response = await api.post('/attendance/teacher/mark', attendanceData);
      return response.data;
    },
    
    getRecords: async (params = {}) => {
      const response = await api.get('/attendance/teacher/records', { params });
      return response.data;
    },
    
    getStatistics: async (params = {}) => {
      const response = await api.get('/attendance/teacher/statistics', {
        params,
      });
      return response.data;
    },

    getClassHistory: async (params = {}) => {
      const response = await api.get('/attendance/teacher/history', { params });
      return response.data;
    },
  },

  // Monthly Report endpoints (Teacher Only)
  getMonthlyReport: async (params) => {
    const response = await api.get('/attendance/teacher/reports/monthly', { params });
    return response.data;
  },
  
  downloadMonthlyReport: async (params) => {
    const response = await api.get('/attendance/teacher/reports/monthly', { 
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  
  getSubjects: async () => {
    const response = await api.get('/attendance/teacher/subjects');
    return response.data;
  }
};

// Admin API calls
export const adminAPI = {
  // Dashboard Overview
  getOverview: async () => {
    const response = await api.get('/admin/overview');
    return response.data;
  },

  // Teacher Management
  getTeacherDetails: async (teacherId) => {
    const response = await api.get(`/admin/teachers/${teacherId}`);
    return response.data;
  },

  createTeacher: async (teacherData) => {
    const response = await api.post('/admin/teachers', teacherData);
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await api.post('/admin/students', studentData);
    return response.data;
  },

  // Department Management
  getDepartments: async () => {
    const response = await api.get('/admin/departments');
    return response.data;
  },

  createDepartment: async (departmentData) => {
    const response = await api.post('/admin/departments', departmentData);
    return response.data;
  },

  updateDepartment: async (id, departmentData) => {
    const response = await api.put(`/admin/departments/${id}`, departmentData);
    return response.data;
  },

  deleteDepartment: async (id) => {
    const response = await api.delete(`/admin/departments/${id}`);
    return response.data;
  },

  // Batch Management
  getBatches: async () => {
    const response = await api.get('/admin/batches');
    return response.data;
  },

  createBatch: async (batchData) => {
    const response = await api.post('/admin/batches', batchData);
    return response.data;
  },

  updateBatch: async (id, batchData) => {
    const response = await api.put(`/admin/batches/${id}`, batchData);
    return response.data;
  },

  deleteBatch: async (id) => {
    const response = await api.delete(`/admin/batches/${id}`);
    return response.data;
  },

  // Subject Management
  getSubjects: async () => {
    const response = await api.get('/admin/subjects');
    return response.data;
  },

  createSubject: async (subjectData) => {
    const response = await api.post('/admin/subjects', subjectData);
    return response.data;
  },

  updateSubject: async (id, subjectData) => {
    const response = await api.put(`/admin/subjects/${id}`, subjectData);
    return response.data;
  },

  deleteSubject: async (id) => {
    const response = await api.delete(`/admin/subjects/${id}`);
    return response.data;
  },

  // Teacher Management
  getTeachers: async () => {
    const response = await api.get('/admin/teachers');
    return response.data;
  },

  createTeacher: async (teacherData) => {
    const response = await api.post('/admin/teachers', teacherData);
    return response.data;
  },

  updateTeacher: async (id, teacherData) => {
    const response = await api.put(`/admin/teachers/${id}`, teacherData);
    return response.data;
  },

  deleteTeacher: async (id) => {
    const response = await api.delete(`/admin/teachers/${id}`);
    return response.data;
  },

  // Student Management
  getStudents: async (params = {}) => {
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  createStudent: async (studentData) => {
    const response = await api.post('/admin/students', studentData);
    return response.data;
  },

  updateStudent: async (id, studentData) => {
    const response = await api.put(`/admin/students/${id}`, studentData);
    return response.data;
  },

  deleteStudent: async (id) => {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },

  bulkImportStudents: async (studentsData) => {
    const response = await api.post('/admin/students/bulk-import', studentsData);
    return response.data;
  },

  // Timetable Management
  getTimetables: async () => {
    const response = await api.get('/timetable/admin/all');
    return response.data;
  },

  importTimetables: async (timetableData) => {
    const response = await api.post('/timetable/admin/import', timetableData);
    return response.data;
  },

  createTimetable: async (timetableData) => {
    const response = await api.post('/timetable/admin/save', timetableData);
    return response.data;
  },

  updateTimetable: async (id, timetableData) => {
    const response = await api.put(`/timetable/admin/${id}`, timetableData);
    return response.data;
  },

  deleteTimetable: async (batchId, dayOfWeek) => {
    const response = await api.delete(`/timetable/admin/${batchId}/${dayOfWeek}`);
    return response.data;
  },

  deleteTimetableForBatch: async (batchName) => {
    const response = await api.delete(`/timetable/admin/batch/${encodeURIComponent(batchName)}`);
    return response.data;
  },

  editTimeSlot: async (data) => {
    const response = await api.put('/timetable/admin/edit-slot', data);
    return response.data;
  },

  // Attendance Analytics
  getAttendanceOverview: async () => {
    const response = await api.get('/admin/attendance/overview');
    return response.data;
  },

  getAllAttendance: async (params = {}) => {
    const response = await api.get('/admin/attendance/all', { params });
    return response.data;
  },

  getStudentAttendanceMatrix: async (params = {}) => {
    const response = await api.get('/admin/attendance/students/matrix', { params });
    return response.data;
  },

  generateAttendancePDF: async (params = {}) => {
    const response = await api.get('/admin/attendance/pdf', { params });
    return response.data;
  },

  getDepartmentAttendance: async (departmentId, params = {}) => {
    const response = await api.get(`/admin/attendance/department/${departmentId}`, { params });
    return response.data;
  },

  getBatchAttendance: async (batchId, params = {}) => {
    const response = await api.get(`/admin/attendance/batch/${batchId}`, { params });
    return response.data;
  },

  getSubjectAttendance: async (subjectId, params = {}) => {
    const response = await api.get(`/admin/attendance/subject/${subjectId}`, { params });
    return response.data;
  },

  // Reports
  generateAttendanceReport: async (params = {}) => {
    const response = await api.get('/admin/reports/attendance', { params });
    return response.data;
  },

  generateStudentReport: async (params = {}) => {
    const response = await api.get('/admin/reports/students', { params });
    return response.data;
  },

  generateTeacherReport: async (params = {}) => {
    const response = await api.get('/admin/reports/teachers', { params });
    return response.data;
  },

  // Bulk import endpoints
  importStudents: async (data) => {
    const response = await api.post('/admin/import/students', data);
    return response.data;
  },

  importTeachers: async (data) => {
    const response = await api.post('/admin/import/teachers', data);
    return response.data;
  },

  downloadTemplate: async (type) => {
    const response = await api.get(`/admin/import/template/${type}`);
    return response.data;
  }
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('classtrack_token', token);
  } else {
    localStorage.removeItem('classtrack_token');
    localStorage.removeItem('classtrack_user');
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('classtrack_token');
};

export const setUser = (user) => {
  localStorage.setItem('classtrack_user', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('classtrack_user');
  return user ? JSON.parse(user) : null;
};

export const logout = () => {
  localStorage.removeItem('classtrack_token');
  localStorage.removeItem('classtrack_user');
  window.location.href = '/login';
};

export default api;
