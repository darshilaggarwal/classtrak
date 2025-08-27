import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { getAuthToken, getUser, setAuthToken, setUser, logout } from '../services/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  userType: null, // 'student' or 'teacher'
};

// Action types
const AuthActionTypes = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AuthActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
    case AuthActionTypes.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        userType: action.payload.user.role,
      };
    case AuthActionTypes.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };
    case AuthActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      const token = getAuthToken();
      const user = getUser();

      if (token && user) {
        dispatch({
          type: AuthActionTypes.LOGIN_SUCCESS,
          payload: { user, token },
        });
      } else {
        dispatch({
          type: AuthActionTypes.SET_LOADING,
          payload: false,
        });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = (userData, token) => {
    try {
      setAuthToken(token);
      setUser(userData);
      
      dispatch({
        type: AuthActionTypes.LOGIN_SUCCESS,
        payload: {
          user: userData,
          token,
        },
      });

      toast.success(`Welcome back, ${userData.name}!`);
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    }
  };

  // Logout function
  const logoutUser = () => {
    try {
      logout();
      dispatch({
        type: AuthActionTypes.LOGOUT,
      });
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Update user function
  const updateUser = (userData) => {
    try {
      const updatedUser = { ...state.user, ...userData };
      setUser(updatedUser);
      
      dispatch({
        type: AuthActionTypes.UPDATE_USER,
        payload: userData,
      });
    } catch (error) {
      console.error('Update user error:', error);
    }
  };

  // Check if user is student
  const isStudent = () => {
    return state.userType === 'student';
  };

  // Check if user is teacher
  const isTeacher = () => {
    return state.userType === 'teacher';
  };

  // Get user role
  const getUserRole = () => {
    return state.userType;
  };

  // Get user info
  const getUserInfo = () => {
    return state.user;
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    logout: logoutUser,
    updateUser,
    
    // Helpers
    isStudent,
    isTeacher,
    getUserRole,
    getUserInfo,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
