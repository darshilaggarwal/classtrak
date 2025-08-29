import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const substitutionApi = {
  // Get all substitutions for a teacher (as original or substitute)
  getTeacherSubstitutions: async (teacherId, status = null, date = null) => {
    try {
      let url = `${API_BASE_URL}/api/substitution/teacher/${teacherId}`;
      const params = new URLSearchParams();
      
      if (status) params.append('status', status);
      if (date) params.append('date', date);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('🔍 Fetching substitutions from:', url);

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      
      console.log('✅ Substitutions response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching substitutions:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Return empty data instead of throwing
      return {
        success: true,
        data: []
      };
    }
  },

  // Get available teachers for a specific time slot
  getAvailableTeachers: async (data) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/substitution/available-teachers`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create a substitution request
  createSubstitution: async (substitutionData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/substitution`, substitutionData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update substitution status (approve/reject by substitute teacher)
  updateSubstitutionStatus: async (substitutionId, statusData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/substitution/${substitutionId}/status`, statusData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cancel a substitution (by original teacher)
  cancelSubstitution: async (substitutionId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/substitution/${substitutionId}/cancel`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get substitutions for attendance tracking (for substitute teachers)
  getSubstitutionsForAttendance: async (teacherId, date = null) => {
    try {
      let url = `${API_BASE_URL}/api/substitution/attendance/${teacherId}`;
      
      if (date) {
        url += `?date=${date}`;
      }

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('classtrack_token')}`
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default substitutionApi;
