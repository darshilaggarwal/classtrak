import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, BookOpen, Upload, Save, Plus, Trash2, Edit, X } from 'lucide-react';
import { adminAPI } from '../../services/api';

const TimetableManagement = () => {
  const [timetables, setTimetables] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importData, setImportData] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedViewBatch, setSelectedViewBatch] = useState('');
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const [editModal, setEditModal] = useState({ visible: false, slot: null, day: '', slotIndex: -1, batchName: '' });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const defaultTimeSlots = [
    { startTime: '09:30', endTime: '10:30' },
    { startTime: '10:35', endTime: '11:35' },
    { startTime: '11:35', endTime: '11:55' },
    { startTime: '11:55', endTime: '12:55' },
    { startTime: '13:00', endTime: '14:00' },
    { startTime: '14:35', endTime: '15:35' },
    { startTime: '15:35', endTime: '16:40' }
  ];

  useEffect(() => {
    fetchBatches();
    fetchAllTimetables();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchBatchSubjects();
      fetchTimetableForBatchAndDay();
    }
  }, [selectedBatch, selectedDay]);

  const fetchBatches = async () => {
    try {
      const response = await adminAPI.getBatches();
      if (response.success) {
        setBatches(response.batches || []);
      } else if (response.data && response.data.batches) {
        setBatches(response.data.batches || []);
      } else {
        console.error('Failed to fetch batches:', response.message);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const fetchAllTimetables = async () => {
    try {
      const response = await adminAPI.getTimetables();
      if (response.success) {
        setTimetables(response.timetables || []);
      } else {
        console.error('Failed to fetch timetables:', response.message);
      }
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ visible: true, message, type });
    setTimeout(() => setNotification({ visible: false, message: '', type: 'info' }), 5000);
  };

  const deleteTimetableForBatch = async () => {
    try {
      const batchName = (() => {
        const batch = batches.find(b => b._id === selectedViewBatch);
        return batch ? batch.name : selectedViewBatch;
      })();

      const response = await adminAPI.deleteTimetableForBatch(batchName);
      if (response.success) {
        showNotification(`✅ Timetable for ${batchName} deleted successfully!`, 'success');
        setSelectedViewBatch('');
        fetchAllTimetables();
      } else {
        showNotification(`❌ Error deleting timetable: ${response.message}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting timetable:', error);
      showNotification(`❌ Error deleting timetable: ${error.message}`, 'error');
    }
  };

  const handleEditSlot = React.useCallback((day, slotIndex, slot) => {
    const batchName = (() => {
      const batch = batches.find(b => b._id === selectedViewBatch);
      return batch ? batch.name : selectedViewBatch;
    })();
    
    setEditModal({ 
      visible: true, 
      slot: { ...slot }, 
      day, 
      slotIndex, 
      batchName 
    });
  }, [batches, selectedViewBatch]);

  const handleSaveEdit = async () => {
    try {
      const response = await adminAPI.editTimeSlot({
        batchName: editModal.batchName,
        dayOfWeek: editModal.day,
        slotIndex: editModal.slotIndex,
        updates: editModal.slot
      });

      if (response.success) {
        showNotification('Time slot updated successfully!', 'success');
        setEditModal({ visible: false, slot: null, day: '', slotIndex: -1, batchName: '' });
        fetchAllTimetables();
      } else {
        showNotification(`Error updating slot: ${response.message}`, 'error');
      }
    } catch (error) {
      console.error('Error updating slot:', error);
      showNotification(`Error updating slot: ${error.message}`, 'error');
    }
  };

  const fetchBatchSubjects = async () => {
    try {
      const response = await fetch(`/api/timetable/admin/batch/${selectedBatch}/subjects`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success) {
        setAvailableSubjects(data.subjects);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTimetableForBatchAndDay = async () => {
    try {
      const response = await fetch(`/api/timetable/batch/${selectedBatch}/day/${selectedDay}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (data.success && data.timetable) {
        setTimeSlots(data.timetable.timeSlots);
      } else {
        // Initialize with default time slots
        setTimeSlots(defaultTimeSlots.map(slot => ({
          ...slot,
          subjectId: '',
          isBreak: false,
          roomNumber: ''
        })));
      }
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  const handleSlotChange = (index, field, value) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = { ...updatedSlots[index], [field]: value };
    
    if (field === 'isBreak' && value) {
      updatedSlots[index].subjectId = '';
    }
    
    setTimeSlots(updatedSlots);
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, {
      startTime: '',
      endTime: '',
      subjectId: '',
      isBreak: false,
      roomNumber: ''
    }]);
  };

  const removeTimeSlot = (index) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const saveTimetable = async () => {
    if (!selectedBatch) {
      showNotification('Please select a batch', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/timetable/admin/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          dayOfWeek: selectedDay,
          timeSlots: timeSlots.map(slot => ({
            startTime: slot.startTime,
            endTime: slot.endTime,
            subjectId: slot.isBreak ? null : slot.subjectId,
            isBreak: slot.isBreak,
            roomNumber: slot.roomNumber || ''
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        alert('Timetable saved successfully!');
        fetchAllTimetables();
      } else {
        alert('Error saving timetable: ' + data.message);
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Error saving timetable');
    } finally {
      setLoading(false);
    }
  };

  const importTimetables = async () => {
    if (!importData.trim()) {
      alert('Please paste the JSON data');
      return;
    }

    setLoading(true);
    try {
      // First, validate JSON format
      let jsonData;
      try {
        jsonData = JSON.parse(importData);
        console.log('✅ JSON parsed successfully:', jsonData);
      } catch (jsonError) {
        console.error('❌ JSON parsing error:', jsonError);
        alert(`Invalid JSON format: ${jsonError.message}\n\nPlease check your JSON syntax.`);
        setLoading(false);
        return;
      }

      // Validate required fields
      if (!jsonData.batchName) {
        alert('Missing required field: batchName');
        setLoading(false);
        return;
      }

      if (!jsonData.weeklyTimetable) {
        alert('Missing required field: weeklyTimetable');
        setLoading(false);
        return;
      }

      console.log('📤 Sending request to API...');
      const data = await adminAPI.importTimetables(jsonData);
      console.log('📥 Response data:', data);

      if (data.success) {
        if (data.summary) {
          // Weekly import response
          showNotification(`Weekly timetable imported successfully! Batch: ${data.summary.batch} - ${data.summary.success} days created`, 'success');
        } else {
          // Old format response
          showNotification('Timetables imported successfully!', 'success');
        }
        setImportData('');
        setShowImport(false);
        // Refresh timetables after successful import
        await fetchAllTimetables();
        // Auto-select the batch that was just imported
        if (data.summary && data.summary.batch) {
          const importedBatch = batches.find(batch => batch.name === data.summary.batch);
          if (importedBatch) {
            setSelectedViewBatch(importedBatch._id);
          }
        }
      } else {
        showNotification('Error importing timetables: ' + data.message, 'error');
      }
    } catch (error) {
      console.error('Error importing timetables:', error);
      showNotification(`Import error: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSelectedBatchName = () => {
    const batch = batches.find(b => b._id === selectedBatch);
    return batch ? batch.name : '';
  };

  const getSubjectName = (subjectId) => {
    const subject = availableSubjects.find(s => s._id === subjectId);
    return subject ? subject.name : '';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Batch Timetables</h1>
          </div>
          <button
            onClick={() => setShowImport(!showImport)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Weekly Import</span>
          </button>
        </div>

        {/* Import Section */}
        {showImport && (
          <div className="bg-gray-50 border rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3">Bulk Import: Complete Weekly Timetable</h3>
            <p className="text-sm text-gray-600 mb-3">Import the entire week (Monday-Saturday) for one batch at once. Much faster than one-by-one!</p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={`Paste your COMPLETE WEEKLY timetable JSON here. Example format:
{
  "batchName": "BTech AIML 5th Sem (2023-27)",
  "weeklyTimetable": {
    "Monday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "System Design", "roomNumber": "101" },
      { "startTime": "10:35", "endTime": "11:35", "isBreak": true },
      { "startTime": "11:35", "endTime": "12:35", "subjectName": "Data Mining", "roomNumber": "102" }
    ],
    "Tuesday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "Computer Networks", "roomNumber": "103" },
      { "startTime": "10:35", "endTime": "11:35", "subjectName": "NLP", "roomNumber": "104" }
    ],
    "Wednesday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "System Design", "roomNumber": "101" }
    ],
    "Thursday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "Lab - Data Mining", "roomNumber": "Lab1" }
    ],
    "Friday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "Computer Networks", "roomNumber": "103" }
    ],
    "Saturday": [
      { "startTime": "09:30", "endTime": "10:30", "subjectName": "System Design", "roomNumber": "101" }
    ]
  }
}

This will create the ENTIRE WEEK for one batch in one go!`}
              className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none"
            />
            <div className="flex space-x-3 mt-3">
              <button
                onClick={importTimetables}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>
              <button
                onClick={() => {
                  // Load complete sample data for testing
                  const sampleData = `{
  "batchName": "BTech AIML 5th Sem (2023-27)",
  "weeklyTimetable": {
    "Monday": [
      {
        "startTime": "09:30",
        "endTime": "10:30",
        "subjectName": "System Design",
        "roomNumber": "Room 101",
        "isBreak": false
      },
      {
        "startTime": "10:35",
        "endTime": "11:35",
        "subjectName": "Computer Networks",
        "roomNumber": "Room 102",
        "isBreak": false
      },
      {
        "startTime": "11:35",
        "endTime": "11:55",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "11:55",
        "endTime": "12:55",
        "subjectName": "Data Mining and Prediction by Machines",
        "roomNumber": "Room 103",
        "isBreak": false
      },
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "subjectName": "Natural Language Processing (NLP) and Text Analysis",
        "roomNumber": "Room 104",
        "isBreak": false
      },
      {
        "startTime": "14:00",
        "endTime": "14:35",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "14:35",
        "endTime": "15:35",
        "subjectName": "Data and Visual Analytics in AI",
        "roomNumber": "Room 105",
        "isBreak": false
      },
      {
        "startTime": "15:40",
        "endTime": "16:40",
        "subjectName": "Lab - Computer Networks",
        "roomNumber": "Lab A",
        "isBreak": false
      }
    ],
    "Tuesday": [
      {
        "startTime": "09:30",
        "endTime": "10:30",
        "subjectName": "Computer Networks",
        "roomNumber": "Room 201",
        "isBreak": false
      },
      {
        "startTime": "10:35",
        "endTime": "11:35",
        "subjectName": "System Design",
        "roomNumber": "Room 202",
        "isBreak": false
      },
      {
        "startTime": "11:35",
        "endTime": "11:55",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "11:55",
        "endTime": "12:55",
        "subjectName": "Data and Visual Analytics in AI",
        "roomNumber": "Room 203",
        "isBreak": false
      },
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "subjectName": "Data Mining and Prediction by Machines",
        "roomNumber": "Room 204",
        "isBreak": false
      },
      {
        "startTime": "14:00",
        "endTime": "14:35",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "14:35",
        "endTime": "15:35",
        "subjectName": "Natural Language Processing (NLP) and Text Analysis",
        "roomNumber": "Room 205",
        "isBreak": false
      },
      {
        "startTime": "15:40",
        "endTime": "16:40",
        "subjectName": "Lab - Data and Visual Analytics in AI",
        "roomNumber": "Lab B",
        "isBreak": false
      }
    ]
  }
}`;
                  setImportData(sampleData);
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Load Sample (2 Days)
              </button>
              <button
                onClick={() => {
                  // Load complete week sample data with correct break times
                  const completeWeekData = `{
  "batchName": "BTech AIML 5th Sem (2023-27)",
  "weeklyTimetable": {
    "Monday": [
      {
        "startTime": "09:30",
        "endTime": "10:30",
        "subjectName": "System Design",
        "roomNumber": "Room 101",
        "isBreak": false
      },
      {
        "startTime": "10:35",
        "endTime": "11:35",
        "subjectName": "Computer Networks",
        "roomNumber": "Room 102",
        "isBreak": false
      },
      {
        "startTime": "11:35",
        "endTime": "11:55",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "11:55",
        "endTime": "12:55",
        "subjectName": "Data Mining and Prediction by Machines",
        "roomNumber": "Room 103",
        "isBreak": false
      },
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "subjectName": "Natural Language Processing (NLP) and Text Analysis",
        "roomNumber": "Room 104",
        "isBreak": false
      },
      {
        "startTime": "14:00",
        "endTime": "14:35",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "14:35",
        "endTime": "15:35",
        "subjectName": "Data and Visual Analytics in AI",
        "roomNumber": "Room 105",
        "isBreak": false
      },
      {
        "startTime": "15:40",
        "endTime": "16:40",
        "subjectName": "Lab - Computer Networks",
        "roomNumber": "Lab A",
        "isBreak": false
      }
    ],
    "Tuesday": [
      {
        "startTime": "09:30",
        "endTime": "10:30",
        "subjectName": "Computer Networks",
        "roomNumber": "Room 201",
        "isBreak": false
      },
      {
        "startTime": "10:35",
        "endTime": "11:35",
        "subjectName": "System Design",
        "roomNumber": "Room 202",
        "isBreak": false
      },
      {
        "startTime": "11:35",
        "endTime": "11:55",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "11:55",
        "endTime": "12:55",
        "subjectName": "Data and Visual Analytics in AI",
        "roomNumber": "Room 203",
        "isBreak": false
      },
      {
        "startTime": "13:00",
        "endTime": "14:00",
        "subjectName": "Data Mining and Prediction by Machines",
        "roomNumber": "Room 204",
        "isBreak": false
      },
      {
        "startTime": "14:00",
        "endTime": "14:35",
        "isBreak": true,
        "roomNumber": ""
      },
      {
        "startTime": "14:35",
        "endTime": "15:35",
        "subjectName": "Natural Language Processing (NLP) and Text Analysis",
        "roomNumber": "Room 205",
        "isBreak": false
      },
      {
        "startTime": "15:40",
        "endTime": "16:40",
        "subjectName": "Lab - Data and Visual Analytics in AI",
        "roomNumber": "Lab B",
        "isBreak": false
      }
    ]
  }
}`;
                  setImportData(completeWeekData);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                Load Complete Week
              </button>
              <button
                onClick={() => setShowImport(false)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Batch-wise Timetable View */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Batch Timetables</h2>
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">View Timetable for:</label>
            <select
              value={selectedViewBatch}
              onChange={(e) => setSelectedViewBatch(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Batch to View</option>
              {(() => {
                // Get unique batch names from timetables
                const batchNamesFromTimetables = [...new Set(timetables.map(tt => tt.batch?.name))].filter(Boolean);
                
                // Filter batches that have timetables
                const batchesWithTimetables = batches.filter(batch => 
                  batchNamesFromTimetables.some(timetableBatchName => {
                    // Try exact match first
                    if (timetableBatchName === batch.name) return true;
                    
                    // Try partial match (e.g., "BTech AIML 5th Sem" matches "BTech AIML")
                    const batchWords = batch.name.split(' ');
                    const timetableWords = timetableBatchName.split(' ');
                    
                    // Check if first 2-3 words match
                    const matchCount = Math.min(3, Math.min(batchWords.length, timetableWords.length));
                    for (let i = 0; i < matchCount; i++) {
                      if (batchWords[i] !== timetableWords[i]) return false;
                    }
                    return true;
                  })
                );
                
                // If we have batches with timetables, show them
                if (batchesWithTimetables.length > 0) {
                  return batchesWithTimetables.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({timetables.filter(tt => {
                        // Use the same matching logic for counting
                        return batchNamesFromTimetables.some(timetableBatchName => {
                          if (timetableBatchName === batch.name) return true;
                          const batchWords = batch.name.split(' ');
                          const timetableWords = timetableBatchName.split(' ');
                          const matchCount = Math.min(3, Math.min(batchWords.length, timetableWords.length));
                          for (let i = 0; i < matchCount; i++) {
                            if (batchWords[i] !== timetableWords[i]) return false;
                          }
                          return true;
                        });
                      }).length} days)
                    </option>
                  ));
                } else {
                  // Fallback: show timetables by their exact names
                  return batchNamesFromTimetables.map((batchName, index) => (
                    <option key={`timetable-${index}`} value={batchName}>
                      {batchName} ({timetables.filter(tt => tt.batch?.name === batchName).length} days)
                    </option>
                  ));
                }
              })()}
            </select>
            <div className="text-xs text-gray-500 mt-1">
              Available: {batches.length} batches | Timetables: {timetables.length} entries
            </div>
          </div>
        </div>

        {selectedViewBatch ? (
          <div>
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span className="text-sm font-medium text-blue-900">
                      {(() => {
                        const batch = batches.find(b => b._id === selectedViewBatch);
                        return batch ? batch.name : selectedViewBatch;
                      })()}
                    </span>
                  </div>
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const batch = batches.find(b => b._id === selectedViewBatch);
                      if (batch) {
                        return timetables.filter(tt => tt.batch?._id === selectedViewBatch).length;
                      } else {
                        return timetables.filter(tt => tt.batch?.name === selectedViewBatch).length;
                      }
                    })()} days loaded
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to delete all timetables for this batch? This action cannot be undone.`)) {
                      deleteTimetableForBatch();
                    }
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm border border-red-300"
                >
                  🗑️ Delete Timetable
                </button>
              </div>
            </div>
            <BatchTimetableView 
              batchId={selectedViewBatch} 
              batchName={(() => {
                const batch = batches.find(b => b._id === selectedViewBatch);
                return batch ? batch.name : selectedViewBatch;
              })()} 
              timetables={(() => {
                const batch = batches.find(b => b._id === selectedViewBatch);
                if (batch) {
                  // It's a batch ID, filter by batch._id
                  return timetables.filter(tt => tt.batch?._id === selectedViewBatch);
                } else {
                  // It's a timetable batch name, filter by batch.name
                  return timetables.filter(tt => tt.batch?.name === selectedViewBatch);
                }
              })()}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Batch</h3>
            <p className="text-gray-500">Choose a batch from the dropdown above to view its complete weekly timetable</p>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Available Timetables:</strong> {timetables.length} total
              </p>
              {timetables.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  {timetables.slice(0, 3).map((tt, i) => (
                    <div key={i}>{tt.batch?.name} - {tt.dayOfWeek}</div>
                  ))}
                  {timetables.length > 3 && <div>... and {timetables.length - 3} more</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      {editModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Time Slot</h3>
              <button
                onClick={() => setEditModal({ visible: false, slot: null, day: '', slotIndex: -1, batchName: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Day:</strong> {editModal.day}
                </div>
                <div className="text-sm text-gray-600">
                  <strong>Time:</strong> {editModal.slot?.startTime} - {editModal.slot?.endTime}
                </div>
              </div>
              
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <input
                    type="checkbox"
                    checked={editModal.slot?.isBreak || false}
                    onChange={(e) => setEditModal({
                      ...editModal,
                      slot: { ...editModal.slot, isBreak: e.target.checked }
                    })}
                    className="mr-2"
                  />
                  Mark as break
                </label>
              </div>
              
              {!editModal.slot?.isBreak && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject Name
                    </label>
                    <input
                      type="text"
                      value={editModal.slot?.subjectName || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        slot: { ...editModal.slot, subjectName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter subject name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number
                    </label>
                    <input
                      type="text"
                      value={editModal.slot?.roomNumber || ''}
                      onChange={(e) => setEditModal({
                        ...editModal,
                        slot: { ...editModal.slot, roomNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter room number"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditModal({ visible: false, slot: null, day: '', slotIndex: -1, batchName: '' })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notification */}
      {notification.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
          notification.type === 'success' ? 'bg-green-500 text-white' :
          notification.type === 'error' ? 'bg-red-500 text-white' :
          notification.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification({ visible: false, message: '', type: 'info' })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// BatchTimetableView Component
const BatchTimetableView = ({ batchId, batchName, timetables }) => {
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  // Define standard time slots for a professional timetable
  const standardTimeSlots = [
    { startTime: '09:30', endTime: '10:30' },
    { startTime: '10:35', endTime: '11:35' },
    { startTime: '11:35', endTime: '11:55' }, // Break
    { startTime: '11:55', endTime: '12:55' },
    { startTime: '13:00', endTime: '14:00' },
    { startTime: '14:00', endTime: '14:35' }, // Break
    { startTime: '14:35', endTime: '15:35' },
    { startTime: '15:40', endTime: '16:40' }
  ];

  const getSlotForDayAndTime = (day, timeSlot) => {
    const dayTimetable = timetables.find(tt => tt.dayOfWeek === day);
    if (!dayTimetable || !dayTimetable.timeSlots) return null;
    
    return dayTimetable.timeSlots.find(slot => 
      slot.startTime === timeSlot.startTime && slot.endTime === timeSlot.endTime
    );
  };

  const isBreakSlot = (timeSlot) => {
    return (timeSlot.startTime === '11:35' && timeSlot.endTime === '11:55') ||
           (timeSlot.startTime === '14:00' && timeSlot.endTime === '14:35');
  };

  const getBreakType = (timeSlot) => {
    if (timeSlot.startTime === '11:35' && timeSlot.endTime === '11:55') {
      return 'lunch'; // Lunch break
    } else if (timeSlot.startTime === '14:00' && timeSlot.endTime === '14:35') {
      return 'tea'; // Tea break
    }
    return 'general';
  };

  const formatSubjectName = (subjectName) => {
    if (!subjectName || subjectName.trim() === '') {
      return 'No Class';
    }
    
    // Make subject names more consistent and professional
    const name = subjectName.trim();
    
    // Handle lab subjects
    if (name.toLowerCase().includes('lab -')) {
      return name.replace('Lab -', 'Lab:').trim();
    }
    
    // Handle long subject names
    if (name.length > 25) {
      // Try to find a good breaking point
      const words = name.split(' ');
      let result = '';
      let currentLine = '';
      
      for (const word of words) {
        if ((currentLine + word).length > 25) {
          if (currentLine) {
            result += currentLine.trim() + '\n';
            currentLine = word + ' ';
          } else {
            result += word + '\n';
          }
        } else {
          currentLine += word + ' ';
        }
      }
      
      if (currentLine) {
        result += currentLine.trim();
      }
      
      return result;
    }
    
    return name;
  };

  if (timetables.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Found</h3>
        <p className="text-gray-500">No timetable has been created for <strong>{batchName}</strong> yet.</p>
        <p className="text-sm text-gray-400 mt-2">Use the "Bulk Weekly Import" feature above to create a timetable for this batch.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900">
          📅 Weekly Timetable: {batchName}
        </h3>
        <p className="text-sm text-blue-700">Professional weekly schedule with standard time slots</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 bg-gray-100">
                Day
              </th>
              {standardTimeSlots.map((timeSlot, index) => (
                <th key={index} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-700">
                      {timeSlot.startTime}
                    </span>
                    <span className="text-xs text-gray-500">
                      {timeSlot.endTime}
                    </span>
                    {isBreakSlot(timeSlot) && (
                      <span className={`text-xs font-medium mt-1 px-2 py-1 rounded-full ${
                        getBreakType(timeSlot) === 'lunch' 
                          ? 'bg-orange-100 text-orange-700 border border-orange-200'
                          : 'bg-purple-100 text-purple-700 border border-purple-200'
                      }`}>
                        BREAK
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {daysOfWeek.map((day, dayIndex) => (
              <tr key={day} className={dayIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200 bg-gradient-to-b from-blue-50 to-blue-100">
                  <div className="flex flex-col">
                    <span className="font-semibold text-blue-900">
                      {day}
                    </span>
                    <span className="text-xs text-blue-600">
                      Day {dayIndex + 1}
                    </span>
                  </div>
                </td>
                {standardTimeSlots.map((timeSlot, slotIndex) => {
                  const slot = getSlotForDayAndTime(day, timeSlot);
                  const isBreak = isBreakSlot(timeSlot);
                  const breakType = getBreakType(timeSlot);
                  
                  return (
                    <td key={slotIndex} className="px-2 py-3 text-sm border-r border-gray-200">
                      {slot ? (
                        <div className={`p-2 rounded-lg border ${
                          slot.isBreak || isBreak
                            ? breakType === 'lunch'
                              ? 'bg-orange-50 border-orange-200 shadow-sm'
                              : 'bg-purple-50 border-purple-200 shadow-sm'
                            : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-sm'
                        }`}>
                          {slot.isBreak || isBreak ? (
                            <div className="text-center">
                              <span className={`font-medium text-xs ${
                                breakType === 'lunch' ? 'text-orange-800' : 'text-purple-800'
                              }`}>
                                BREAK
                              </span>
                              <button
                                onClick={() => handleEditSlot(day, slotIndex, slot)}
                                className={`block mx-auto mt-1 p-1 text-xs rounded hover:bg-white/50 ${
                                  breakType === 'lunch' ? 'text-orange-600 hover:text-orange-800' : 'text-purple-600 hover:text-purple-800'
                                }`}
                                title="Edit break"
                              >
                                <Edit size={10} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-center mb-1">
                                <button
                                  onClick={() => handleEditSlot(day, slotIndex, slot)}
                                  className="p-1 text-green-600 hover:text-green-800 text-xs float-right hover:bg-white/50 rounded"
                                  title="Edit slot"
                                >
                                  <Edit size={10} />
                                </button>
                              </div>
                              <div className="font-medium text-green-900 text-xs mb-1 text-center leading-tight">
                                {formatSubjectName(slot.subjectName || slot.subject?.name || '')}
                              </div>
                              {slot.roomNumber && slot.roomNumber.trim() !== '' && (
                                <div className="text-xs text-green-700 text-center">
                                  📍 {slot.roomNumber}
                                </div>
                              )}
                              {slot.teacher && slot.teacher.name && (
                                <div className="text-xs text-green-600 mt-1 text-center">
                                  👨‍🏫 {slot.teacher.name.split(' ').slice(-2).join(' ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : isBreak ? (
                        <div className={`p-2 rounded-lg border shadow-sm ${
                          breakType === 'lunch'
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-purple-50 border-purple-200'
                        }`}>
                          <div className="text-center">
                            <span className={`font-medium text-xs ${
                              breakType === 'lunch' ? 'text-orange-700' : 'text-purple-700'
                            }`}>
                              BREAK
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400 text-xs py-2">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            <span className="font-medium">📊 Summary:</span> 
            {standardTimeSlots.length} time slots across {daysOfWeek.length} days
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-200 to-emerald-200 border border-green-300 rounded"></div>
              <span className="text-xs">Classes</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-orange-200 border border-orange-300 rounded"></div>
              <span className="text-xs">Break</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-200 border border-purple-300 rounded"></div>
              <span className="text-xs">Break</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimetableManagement;
