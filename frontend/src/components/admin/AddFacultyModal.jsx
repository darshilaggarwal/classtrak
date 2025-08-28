import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, BookOpen, GraduationCap, Plus, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const AddFacultyModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    subjects: []
  });
  
  const [departments, setDepartments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newSubject, setNewSubject] = useState({
    name: '',
    course: '',
    semester: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchSubjects();
      resetForm();
    }
  }, [isOpen]);

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

  const fetchSubjects = async () => {
    try {
      const response = await adminAPI.getSubjects();
      if (response.success) {
        setSubjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      username: '',
      subjects: []
    });
    setNewSubject({
      name: '',
      course: '',
      semester: ''
    });
    setErrors({});
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

  const handleNewSubjectChange = (e) => {
    const { name, value } = e.target;
    setNewSubject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addSubject = () => {
    if (!newSubject.name || !newSubject.course || !newSubject.semester) {
      toast.error('Please fill all subject fields');
      return;
    }

    const subjectToAdd = {
      name: newSubject.name,
      course: newSubject.course,
      semester: parseInt(newSubject.semester)
    };

    setFormData(prev => ({
      ...prev,
      subjects: [...prev.subjects, subjectToAdd]
    }));

    setNewSubject({
      name: '',
      course: '',
      semester: ''
    });
  };

  const removeSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }

    if (formData.subjects.length === 0) {
      newErrors.subjects = 'At least one subject is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create faculty data in the format expected by the backend
      const facultyData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        username: formData.username,
        subjects: formData.subjects
      };

      const response = await adminAPI.createTeacher(facultyData);
      
      if (response.success) {
        toast.success('Faculty member added successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Failed to add faculty member');
      }
    } catch (error) {
      console.error('Error adding faculty:', error);
      toast.error('Failed to add faculty member');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Add New Faculty Member</h2>
              <p className="text-sm text-gray-600">Create a new faculty account with assigned subjects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 ${
                  errors.username ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter username"
              />
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username}</p>
              )}
            </div>
          </div>

          {/* Subject Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Assign Subjects *
            </label>
            
            {/* Add New Subject */}
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Subject</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  name="name"
                  value={newSubject.name}
                  onChange={handleNewSubjectChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Subject name"
                />
                <select
                  name="course"
                  value={newSubject.course}
                  onChange={handleNewSubjectChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Course</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.name}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <select
                  name="semester"
                  value={newSubject.semester}
                  onChange={handleNewSubjectChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="">Select Semester</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={addSubject}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subject</span>
              </Button>
            </div>

            {/* Assigned Subjects List */}
            <div className="space-y-2">
              {formData.subjects.map((subject, index) => (
                <div key={index} className="flex items-center justify-between bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{subject.name}</p>
                      <p className="text-xs text-gray-600">{subject.course} - Semester {subject.semester}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors duration-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {errors.subjects && (
              <p className="mt-2 text-sm text-red-600">{errors.subjects}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Faculty Member'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFacultyModal;
