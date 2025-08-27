import React, { useState } from 'react';
import { X, Upload, Download, FileText, Users, GraduationCap } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../../services/api';

const DataImportModal = ({ isOpen, onClose, type = 'students' }) => {
  const [importData, setImportData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleImport = async () => {
    if (!importData.trim()) {
      toast.error('Please enter data to import');
      return;
    }

    try {
      setIsLoading(true);
      let parsedData;

      try {
        parsedData = JSON.parse(importData);
      } catch (error) {
        toast.error('Invalid JSON format. Please check your data.');
        return;
      }

      // Show progress message for large imports
      if (parsedData.length > 10) {
        toast.loading(`Processing ${parsedData.length} records... This may take a moment.`, {
          duration: 3000
        });
      }

      const endpoint = type === 'students' ? 'importStudents' : 'importTeachers';
      const dataKey = type === 'students' ? 'students' : 'teachers';

      const response = await adminAPI[endpoint]({ [dataKey]: parsedData });

      if (response.success) {
        setResults(response.results);
        
        // Show detailed success message
        if (response.summary) {
          toast.success(
            `Import completed! ${response.summary.successful}/${response.summary.total} records imported successfully (${response.summary.successRate}% success rate)`,
            { duration: 5000 }
          );
        } else {
          toast.success(response.message);
        }
        
        onClose();
      } else {
        toast.error(response.message || 'Import failed');
      }
    } catch (error) {
      console.error('Import error:', error);
      
      if (error.code === 'ECONNABORTED') {
        toast.error('Import timed out. Please try with a smaller batch or check your data.');
      } else {
        toast.error('Failed to import data. Please check your data format.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await adminAPI.downloadTemplate(type);
      if (response.success) {
        const dataStr = JSON.stringify(response.template, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-template.json`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Template downloaded successfully');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };

  const getTemplateExample = () => {
    if (type === 'students') {
      return `{
  "students": [
    {
      "name": "Student Full Name",
      "rno": "Roll Number",
      "email": "email@domain.com",
      "phone": "+91-9876543210",
      "course": "BTech AIML",
      "year": 2023,
      "batch": "BTech AIML 5th Sem (2023-27)"
    }
  ]
}`;
    } else {
      return `[
  {
    "name": "Dr. Rahul Tripathi",
    "username": "rahul.tripathi",
    "departments": ["BBA DM", "BTech AIML"],
    "subjects": [
      {"name": "Principles of Management", "department": "BBA DM"},
      {"name": "Human Resource Management", "department": "BBA DM"},
      {"name": "Machine Learning", "department": "BTech AIML"}
    ]
  },
  {
    "name": "Mr. Mo. Ahsan Ahmed",
    "username": "mo.ahsan.ahmed",
    "departments": ["BTech AIML", "BCA FSD"],
    "subjects": [
      {"name": "Software Testing", "department": "BTech AIML"},
      {"name": "System Design", "department": "BTech AIML"}
    ]
  }
]`;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {type === 'students' ? (
                <Users className="w-6 h-6 text-blue-600" />
              ) : (
                <GraduationCap className="w-6 h-6 text-green-600" />
              )}
              <h3 className="text-xl font-semibold text-gray-900">
                Import {type === 'students' ? 'Students' : 'Teachers'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Template Download */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Download Template</h4>
                <p className="text-sm text-blue-700">
                  Download a JSON template to see the required format
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </button>
            </div>
          </div>

          {/* Data Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Paste JSON Data
            </label>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder={getTemplateExample()}
              className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            />
          </div>



          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{isLoading ? 'Importing...' : 'Import Data'}</span>
            </button>
          </div>

          {/* Results */}
          {results && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Import Results:</h4>
              <div className="text-sm text-gray-600">
                <p>✅ Successful: {results.success}</p>
                <p>❌ Failed: {results.failed}</p>
                {results.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-red-600">Errors:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {results.errors.slice(0, 5).map((error, index) => (
                        <li key={index} className="text-red-600">{error}</li>
                      ))}
                      {results.errors.length > 5 && (
                        <li className="text-gray-500">... and {results.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataImportModal;
