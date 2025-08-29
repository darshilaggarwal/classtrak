import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, AlertCircle, CheckCircle, XCircle, Plus, Search } from 'lucide-react';
import substitutionApi from '../../services/substitutionApi';
import api from '../../services/api';

const SubstitutionManagement = () => {
  const [activeTab, setActiveTab] = useState('request');
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Request substitution states
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [reason, setReason] = useState('');
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [selectedSubstituteTeacher, setSelectedSubstituteTeacher] = useState('');
  const [searchingTeachers, setSearchingTeachers] = useState(false);
  
  // Teacher's schedule and data
  const [teacherSchedule, setTeacherSchedule] = useState([]);
  const [batches, setBatches] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const userData = JSON.parse(localStorage.getItem('classtrack_user'));
  const teacherId = userData?.id; // Changed from _id to id
  
  console.log('👤 User data from localStorage:', userData);
  console.log('👤 Teacher ID from localStorage:', teacherId);
  
  // Check if teacher is logged in
  const token = localStorage.getItem('classtrack_token');
  console.log('🔑 Auth token exists:', !!token);
  
  if (!teacherId || !token) {
    console.error('❌ Teacher not logged in or token missing');
    return <div className="p-6 text-center text-red-600">Please log in to access substitution management.</div>;
  }

  useEffect(() => {
    if (teacherId) {
      fetchTeacherData();
      fetchSubstitutions();
    }
  }, [teacherId]);

  const fetchTeacherData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      console.log('🚀 Starting fetchTeacherData for teacherId:', teacherId);
      
      // Fetch teacher's batches and subjects using direct API calls
      const [batchesRes, subjectsRes] = await Promise.all([
        api.get(`/teacher/batches/${teacherId}`),
        api.get(`/teacher/subjects/${teacherId}`)
      ]);
      
      console.log('📚 Batches response:', batchesRes);
      console.log('📖 Subjects response:', subjectsRes);
      
      if (batchesRes.data && batchesRes.data.success) {
        setBatches(batchesRes.data.data || []);
        console.log('✅ Batches set successfully:', batchesRes.data.data);
      } else {
        console.error('❌ Batches response failed:', batchesRes);
      }
      
      if (subjectsRes.data && subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data || []);
        console.log('✅ Subjects set successfully:', subjectsRes.data.data);
      } else {
        console.error('❌ Subjects response failed:', subjectsRes);
      }
      
      // Fetch today's schedule if date is selected
      if (selectedDate) {
        await fetchTeacherSchedule(selectedDate);
      }
      
    } catch (error) {
      console.error('❌ Error fetching teacher data:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setError('Failed to fetch teacher data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherSchedule = async (date = selectedDate) => {
    if (!date || !teacherId) {
      console.log('❌ Missing date or teacherId:', { date, teacherId });
      return;
    }
    
    console.log('🔍 Fetching teacher schedule for date:', date, 'teacherId:', teacherId);
    
    try {
      // Get the day of week from the selected date
      const selectedDateObj = new Date(date);
      const dayOfWeek = selectedDateObj.toLocaleDateString('en-US', { weekday: 'long' });
      
      console.log('📅 Day of week:', dayOfWeek);
      
      // Fetch teacher's batches first
      const batchesRes = await api.get(`/teacher/batches/${teacherId}`);
      console.log('📚 Batches response:', batchesRes);
      
      if (!batchesRes.data || !batchesRes.data.success) {
        throw new Error('Failed to fetch batches');
      }
      
      const teacherBatches = batchesRes.data.data || [];
      console.log('👥 Teacher batches:', teacherBatches);
      
      if (teacherBatches.length === 0) {
        console.log('⚠️ No batches found for teacher');
        setTeacherSchedule([]);
        return;
      }
      
      // Fetch timetables for all batches where teacher has subjects
      const schedule = [];
      
      for (const batch of teacherBatches) {
        try {
          console.log(`🔍 Fetching timetable for batch: ${batch.name} (${batch._id})`);
          
          // Get timetable for this batch and day
          const timetableRes = await api.get(`/timetable/batch/${batch._id}/${dayOfWeek}`);
          console.log(`📅 Timetable response for ${batch.name}:`, timetableRes);
          
          if (timetableRes.data && timetableRes.data.success && timetableRes.data.data) {
            const timetable = timetableRes.data.data;
            console.log(`📋 Timetable data for ${batch.name}:`, timetable);
            console.log(`📋 Timetable timeSlots for ${batch.name}:`, timetable.timeSlots);
            
            // Find time slots where this teacher has classes
            for (const slot of timetable.timeSlots) {
              console.log(`⏰ Checking slot:`, slot);
              if (!slot.isBreak && slot.teacher) {
                console.log(`🔍 Comparing teacher IDs:`, {
                  slotTeacherId: slot.teacher._id || slot.teacher,
                  currentTeacherId: teacherId,
                  slotTeacherName: slot.teacher.name,
                  slotTeacherIdType: typeof (slot.teacher._id || slot.teacher),
                  currentTeacherIdType: typeof teacherId,
                  slotTeacherObject: slot.teacher
                });
                
                // Convert both IDs to strings for comparison
                const slotTeacherIdStr = String(slot.teacher._id || slot.teacher);
                const currentTeacherIdStr = String(teacherId);
                
                if (slotTeacherIdStr === currentTeacherIdStr) {
                  console.log(`✅ Found teacher's class:`, slot);
                  schedule.push({
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    subjectId: slot.subject._id || slot.subject,
                    subjectName: slot.subject.name || 'Unknown Subject',
                    batchName: batch.name,
                    batchId: batch._id,
                    roomNumber: slot.roomNumber || 'TBD'
                  });
                } else {
                  console.log(`❌ Teacher ID mismatch: ${slotTeacherIdStr} !== ${currentTeacherIdStr}`);
                }
              } else {
                console.log(`⏭️ Skipping slot (break or no teacher):`, slot);
              }
            }
          }
        } catch (error) {
          console.error(`❌ Error fetching timetable for batch ${batch.name}:`, error);
        }
      }
      
      console.log('📋 Final schedule:', schedule);
      
      if (schedule.length === 0) {
        console.log('⚠️ No schedule found, showing sample data for testing');
        // No schedule found - show empty schedule
        console.log('⚠️ No schedule found for this teacher on this date');
        setTeacherSchedule([]);
      } else {
        console.log('✅ Setting teacher schedule:', schedule);
        setTeacherSchedule(schedule);
      }
      
    } catch (error) {
      console.error('❌ Error fetching teacher schedule:', error);
      // If schedule fetch fails, show empty schedule
      console.log('❌ Schedule fetch failed, showing empty schedule');
      setTeacherSchedule([]);
    }
  };

  const fetchSubstitutions = async () => {
    try {
      console.log('🔍 Fetching substitutions for teacher:', teacherId);
      const response = await substitutionApi.getTeacherSubstitutions(teacherId);
      console.log('✅ Substitutions response:', response);
      setSubstitutions(response.data || []);
    } catch (error) {
      console.error('❌ Error fetching substitutions:', error);
      // Don't set error for substitutions - it's okay if there are none
      setSubstitutions([]);
    }
  };

  const handleDateChange = (e) => {
    console.log('📅 Date changed to:', e.target.value);
    setSelectedDate(e.target.value);
    setSelectedTimeSlot('');
    setSelectedSubject('');
    setSelectedBatch('');
    setAvailableTeachers([]);
    setSelectedSubstituteTeacher('');
    
    // Fetch schedule for the selected date
    if (e.target.value) {
      console.log('🚀 Calling fetchTeacherSchedule for date:', e.target.value);
      fetchTeacherSchedule(e.target.value);
    }
  };

  const handleTimeSlotChange = (e) => {
    const selectedSlot = e.target.value;
    setSelectedTimeSlot(selectedSlot);
    
    if (selectedSlot) {
      // Find the selected slot data
      const [startTime, endTime] = selectedSlot.split(' - ');
      const slotData = teacherSchedule.find(slot => 
        slot.startTime === startTime && slot.endTime === endTime
      );
      
      if (slotData && slotData.subjectId && slotData.batchId) {
        // Auto-populate subject and batch
        setSelectedSubject(slotData.subjectId);
        setSelectedBatch(slotData.batchId);
      } else {
        setSelectedSubject('');
        setSelectedBatch('');
      }
    } else {
      setSelectedSubject('');
      setSelectedBatch('');
    }
    
    setAvailableTeachers([]);
    setSelectedSubstituteTeacher('');
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
    setSelectedBatch('');
    setAvailableTeachers([]);
    setSelectedSubstituteTeacher('');
  };

  const handleBatchChange = (e) => {
    setSelectedBatch(e.target.value);
    setAvailableTeachers([]);
    setSelectedSubstituteTeacher('');
  };

  const findAvailableTeachers = async () => {
    if (!selectedDate || !selectedTimeSlot || !selectedSubject || !selectedBatch) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSearchingTeachers(true);
      setError('');
      
      const [startTime, endTime] = selectedTimeSlot.split(' - ');
      const subject = subjects.find(s => s._id === selectedSubject);
      const batch = batches.find(b => b._id === selectedBatch);
      
      if (!subject || !batch) {
        setError('Invalid subject or batch selection');
        return;
      }
      
      const response = await substitutionApi.getAvailableTeachers({
        date: selectedDate,
        startTime,
        endTime,
        batchId: selectedBatch,
        subjectId: selectedSubject
      });
      
      setAvailableTeachers(response.data || []);
      
      if (response.data.length === 0) {
        setError('No teachers available for this time slot');
      }
    } catch (error) {
      console.error('Error finding available teachers:', error);
      setError('Failed to find available teachers');
    } finally {
      setSearchingTeachers(false);
    }
  };

  const createSubstitution = async () => {
    if (!selectedSubstituteTeacher || !reason.trim()) {
      setError('Please select a substitute teacher and provide a reason');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const [startTime, endTime] = selectedTimeSlot.split(' - ');
      const subject = subjects.find(s => s._id === selectedSubject);
      const batch = batches.find(b => b._id === selectedBatch);
      
      if (!subject || !batch) {
        setError('Invalid subject or batch selection');
        return;
      }
      
      const substitutionData = {
        originalTeacherId: teacherId,
        substituteTeacherId: selectedSubstituteTeacher,
        subjectId: selectedSubject,
        batchId: selectedBatch,
        date: selectedDate,
        startTime,
        endTime,
        roomNumber: batch?.roomNumber || 'TBD',
        reason: reason.trim()
      };
      
      await substitutionApi.createSubstitution(substitutionData);
      
      // Reset form
      setSelectedDate('');
      setSelectedTimeSlot('');
      setSelectedSubject('');
      setSelectedBatch('');
      setReason('');
      setAvailableTeachers([]);
      setSelectedSubstituteTeacher('');
      
      // Refresh substitutions list
      fetchSubstitutions();
      
      // Show success message
      alert('Substitution request created successfully!');
      
    } catch (error) {
      console.error('Error creating substitution:', error);
      setError('Failed to create substitution request');
    } finally {
      setLoading(false);
    }
  };

  const updateSubstitutionStatus = async (substitutionId, status, notes = '') => {
    try {
      await substitutionApi.updateSubstitutionStatus(substitutionId, { status, notes });
      fetchSubstitutions();
      alert(`Substitution ${status} successfully!`);
    } catch (error) {
      console.error('Error updating substitution status:', error);
      alert('Failed to update substitution status');
    }
  };

  const cancelSubstitution = async (substitutionId) => {
    if (window.confirm('Are you sure you want to cancel this substitution?')) {
      try {
        await substitutionApi.cancelSubstitution(substitutionId);
        fetchSubstitutions();
        alert('Substitution cancelled successfully!');
      } catch (error) {
        console.error('Error cancelling substitution:', error);
        alert('Failed to cancel substitution');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if (loading && substitutions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lecture Substitution Management</h1>
          <p className="text-gray-600">Manage lecture substitutions when you're unavailable</p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('request')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'request'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Request Substitution
              </button>
              <button
                onClick={() => setActiveTab('my-requests')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-2" />
                My Requests
              </button>
              <button
                onClick={() => setActiveTab('substitutions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'substitutions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Substitutions for Me
              </button>
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Request Substitution Tab */}
        {activeTab === 'request' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Request Lecture Substitution</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Time Slot
                </label>
                <select
                  value={selectedTimeSlot}
                  onChange={handleTimeSlotChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedDate}
                >
                  <option value="">Select time slot</option>
                  {teacherSchedule.map((slot, index) => (
                    <option key={index} value={`${slot.startTime} - ${slot.endTime}`}>
                      {slot.startTime} - {slot.endTime} - {slot.subjectName} ({slot.batchName})
                      {slot.isSubstitutionClass ? ' [Substitution]' : ''}
                      {slot.isSubstitutedOut ? ' [Substituted]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BookOpen className="w-4 h-4 inline mr-2" />
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedTimeSlot}
                >
                  <option value="">Select subject</option>
                  {subjects.map((subject) => (
                    <option key={subject._id} value={subject._id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Batch Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Batch
                </label>
                <select
                  value={selectedBatch}
                  onChange={handleBatchChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedSubject}
                >
                  <option value="">Select batch</option>
                  {batches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Substitution
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Please provide a reason for requesting substitution..."
                disabled={!selectedBatch}
              />
            </div>

            {/* Teacher's Schedule Display */}
            {selectedDate && teacherSchedule.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Your Schedule for {new Date(selectedDate).toLocaleDateString()}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teacherSchedule.map((slot, index) => {
                    const isSelected = selectedTimeSlot === `${slot.startTime} - ${slot.endTime}`;
                    const hasClass = slot.subjectId && slot.batchId;
                    
                    return (
                      <div
                        key={index}
                        className={`p-4 border rounded-lg transition-colors ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : slot.isSubstitutionClass
                            ? 'border-orange-300 bg-orange-50'
                            : slot.isSubstitutedOut
                            ? 'border-red-300 bg-red-50'
                            : hasClass
                            ? 'border-green-200 bg-green-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900 flex items-center justify-between">
                          <span>{slot.startTime} - {slot.endTime}</span>
                          {slot.isSubstitutionClass && (
                            <span className="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded-full">
                              Substitution
                            </span>
                          )}
                          {slot.isSubstitutedOut && (
                            <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                              Substituted
                            </span>
                          )}
                        </div>
                        {hasClass ? (
                          <>
                            <div className="text-sm text-gray-700 mt-1">{slot.subjectName}</div>
                            <div className="text-xs text-gray-500 mt-1">{slot.batchName}</div>
                            <div className="text-xs text-gray-400 mt-1">Room: {slot.roomNumber}</div>
                            {slot.isSubstitutionClass && slot.originalTeacher && (
                              <div className="text-xs text-orange-600 mt-1">
                                Original: {slot.originalTeacher.name}
                              </div>
                            )}
                            {slot.isSubstitutedOut && slot.substitutionInfo && (
                              <div className="text-xs text-red-600 mt-1">
                                Substituted by: {slot.substitutionInfo.substituteTeacher.name}
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-sm text-gray-500 mt-1">No class scheduled</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Find Available Teachers Button */}
            <div className="mt-6">
              <button
                onClick={findAvailableTeachers}
                disabled={!selectedDate || !selectedTimeSlot || !selectedSubject || !selectedBatch || !reason.trim() || searchingTeachers}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Search className="w-4 h-4 mr-2" />
                {searchingTeachers ? 'Finding Teachers...' : 'Find Available Teachers'}
              </button>
            </div>

            {/* Available Teachers */}
            {availableTeachers.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Teachers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableTeachers.map((teacher) => (
                    <div
                      key={teacher._id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedSubstituteTeacher === teacher._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedSubstituteTeacher(teacher._id)}
                    >
                      <div className="font-medium text-gray-900">{teacher.name}</div>
                      <div className="text-sm text-gray-600">@{teacher.username}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {teacher.subjects.length} subjects
                      </div>
                    </div>
                  ))}
                </div>

                {/* Create Substitution Button */}
                <div className="mt-6">
                  <button
                    onClick={createSubstitution}
                    disabled={!selectedSubstituteTeacher || !reason.trim() || loading}
                    className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating...' : 'Create Substitution Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'my-requests' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">My Substitution Requests</h2>
            </div>
            
            {substitutions.filter(s => s.originalTeacher._id === teacherId).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No substitution requests found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject & Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Substitute Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {substitutions
                      .filter(s => s.originalTeacher._id === teacherId)
                      .map((substitution) => (
                        <tr key={substitution._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(substitution.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {substitution.startTime} - {substitution.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{substitution.subject.name}</div>
                            <div className="text-sm text-gray-500">{substitution.batch.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{substitution.substituteTeacher.name}</div>
                            <div className="text-sm text-gray-500">{substitution.substituteTeacher.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(substitution.status)}`}>
                              {getStatusIcon(substitution.status)}
                              <span className="ml-1">{substitution.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {['pending', 'approved'].includes(substitution.status) && (
                              <button
                                onClick={() => cancelSubstitution(substitution._id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Substitutions for Me Tab */}
        {activeTab === 'substitutions' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Substitutions Assigned to Me</h2>
            </div>
            
            {substitutions.filter(s => s.substituteTeacher._id === teacherId).length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No substitutions assigned to you
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subject & Batch
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Original Teacher
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {substitutions
                      .filter(s => s.substituteTeacher._id === teacherId)
                      .map((substitution) => (
                        <tr key={substitution._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(substitution.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {substitution.startTime} - {substitution.endTime}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{substitution.subject.name}</div>
                            <div className="text-sm text-gray-500">{substitution.batch.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{substitution.originalTeacher.name}</div>
                            <div className="text-sm text-gray-500">{substitution.originalTeacher.email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(substitution.status)}`}>
                              {getStatusIcon(substitution.status)}
                              <span className="ml-1">{substitution.status}</span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {substitution.status === 'pending' && (
                              <div className="space-x-2">
                                <button
                                  onClick={() => updateSubstitutionStatus(substitution._id, 'approved')}
                                  className="text-green-600 hover:text-green-900"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => updateSubstitutionStatus(substitution._id, 'cancelled')}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                            {substitution.status === 'approved' && (
                              <button
                                onClick={() => updateSubstitutionStatus(substitution._id, 'completed')}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Mark Complete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubstitutionManagement;
