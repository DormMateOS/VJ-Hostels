import React, { useState, useEffect } from 'react';
import { otpAPI, studentAPI, overrideAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';

const GuardKiosk = () => {
  const { user } = useAuth();

  // Debug user object
  console.log('GuardKiosk user:', user);
  const [currentView, setCurrentView] = useState('search'); // search, otp, visits
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [visitorData, setVisitorData] = useState({
    name: '',
    phone: '',
    purpose: '',
    groupSize: 1
  });
  const [otpStatus, setOtpStatus] = useState(null); // null, 'sent', 'verified', 'expired', 'failed'
  const [activeVisits, setActiveVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    socketService.connect();
    loadActiveVisits();

    // Socket event listeners
    socketService.on('otpVerified', handleOtpVerified);
    socketService.on('visitCreated', handleVisitCreated);
    socketService.on('visitCheckedOut', handleVisitCheckedOut);

    return () => {
      socketService.off('otpVerified', handleOtpVerified);
      socketService.off('visitCreated', handleVisitCreated);
      socketService.off('visitCheckedOut', handleVisitCheckedOut);
    };
  }, []);

  const handleOtpVerified = (data) => {
    setOtpStatus('verified');
    loadActiveVisits();
    // Auto-switch to visits view after successful verification
    setTimeout(() => {
      setCurrentView('visits');
      resetForm();
    }, 2000);
  };

  const handleVisitCreated = (data) => {
    loadActiveVisits();
  };

  const handleVisitCheckedOut = (data) => {
    loadActiveVisits();
  };

  const loadActiveVisits = async () => {
    try {
      const response = await otpAPI.getActiveVisits(user.id);
      setActiveVisits(response.data.visits || []);
    } catch (error) {
      console.error('Failed to load active visits:', error);
    }
  };

  const searchStudents = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await studentAPI.searchStudents({ query });
      setSearchResults(response.data.students || []);
    } catch (error) {
      setError('Failed to search students');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setSearchResults([]);
    setSearchQuery(`${student.name} - Room ${student.room}`);
  };

  const handleRequestOTP = async () => {
    if (!selectedStudent || !visitorData.name || !visitorData.phone || !visitorData.purpose) {
      setError('Please fill in all required fields');
      return;
    }

    if (!user || (!user._id && !user.id)) {
      setError('Authentication error. Please login again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const requestData = {
        studentId: selectedStudent._id,
        visitorName: visitorData.name,
        visitorPhone: visitorData.phone,
        guardId: user._id || user.id,
        purpose: visitorData.purpose,
        groupSize: parseInt(visitorData.groupSize)
      };

      console.log('Sending OTP request:', requestData);
      console.log('Selected student ID:', selectedStudent._id);
      
      const response = await otpAPI.requestOTP(requestData);

      if (response.data.success) {
        if (response.data.code === 'PRE_APPROVED') {
          setOtpStatus('verified');
          loadActiveVisits();
          setTimeout(() => {
            setCurrentView('visits');
            resetForm();
          }, 2000);
        } else {
          setOtpStatus('sent');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to request OTP';
      setError(message);
      
      if (error.response?.data?.code === 'OUT_OF_HOURS') {
        // Offer override option
        setOtpStatus('out_of_hours');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp) => {
    try {
      setLoading(true);
      setError(null);

      const response = await otpAPI.verifyOTP({
        visitorPhone: visitorData.phone,
        providedOtp: otp,
        guardId: user._id || user.id
      });

      if (response.data.success) {
        setOtpStatus('verified');
        loadActiveVisits();
        setTimeout(() => {
          setCurrentView('visits');
          resetForm();
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      setError(message);
      // Keep OTP status as 'sent' so form remains visible for retry
      setOtpStatus('sent');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOverride = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await overrideAPI.requestOverride({
        guardId: user._id || user.id,
        visitorName: visitorData.name,
        visitorPhone: visitorData.phone,
        studentId: selectedStudent._id,
        reason: 'Out of hours visit request',
        purpose: visitorData.purpose,
        urgency: 'medium'
      });

      if (response.data.success) {
        setOtpStatus('override_requested');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Override request failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (visitId) => {
    try {
      await otpAPI.checkout(visitId, { guardId: user._id || user.id });
      loadActiveVisits();
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.message || 'Failed to checkout visitor');
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setVisitorData({ name: '', phone: '', purpose: '', groupSize: 1 });
    setOtpStatus(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Security Guard</h1>
              <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setCurrentView('search')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  currentView === 'search' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                New Visitor
              </button>
              <button
                onClick={() => setCurrentView('visits')}
                className={`px-4 py-2 rounded-lg font-medium relative ${
                  currentView === 'visits' 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Active Visits
                {activeVisits.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {activeVisits.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-md">
            {error}
            <button 
              onClick={() => setError(null)}
              className="float-right text-danger-500 hover:text-danger-700"
            >
              ×
            </button>
          </div>
        )}

        {currentView === 'search' && (
          <SearchView
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            onSearch={searchStudents}
            onStudentSelect={handleStudentSelect}
            selectedStudent={selectedStudent}
            visitorData={visitorData}
            setVisitorData={setVisitorData}
            otpStatus={otpStatus}
            onRequestOTP={handleRequestOTP}
            onVerifyOTP={handleVerifyOTP}
            onRequestOverride={handleRequestOverride}
            onReset={resetForm}
            loading={loading}
          />
        )}

        {currentView === 'visits' && (
          <VisitsView
            activeVisits={activeVisits}
            onCheckout={handleCheckout}
            onRefresh={loadActiveVisits}
          />
        )}
      </div>
    </div>
  );
};

// Search and OTP Request View
const SearchView = ({ 
  searchQuery, 
  setSearchQuery, 
  searchResults, 
  onSearch, 
  onStudentSelect, 
  selectedStudent,
  visitorData,
  setVisitorData,
  otpStatus,
  onRequestOTP,
  onVerifyOTP,
  onRequestOverride,
  onReset,
  loading
}) => {
  const [otpInput, setOtpInput] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Student Search */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Find Student</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search by name, room, or roll number
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter student name, room number, or roll number"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                onSearch(e.target.value);
              }}
            />
          </div>

          {searchResults.length > 0 && (
            <div className="border border-gray-200 rounded-md max-h-60 overflow-y-auto">
              {searchResults.map((student) => (
                <button
                  key={student._id}
                  onClick={() => onStudentSelect(student)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium">{student.name}</div>
                  <div className="text-sm text-gray-600">
                    Room {student.room} • {student.rollNumber}
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="bg-primary-50 border border-primary-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-primary-900">{selectedStudent.name}</div>
                  <div className="text-sm text-primary-700">
                    Room {selectedStudent.room} • {selectedStudent.rollNumber}
                  </div>
                </div>
                <button
                  onClick={onReset}
                  className="text-primary-600 hover:text-primary-800"
                >
                  Change
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visitor Details */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Visitor Details</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visitor Name *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter visitor's full name"
              value={visitorData.name}
              onChange={(e) => setVisitorData({...visitorData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              className="input-field"
              placeholder="Enter visitor's phone number"
              value={visitorData.phone}
              onChange={(e) => setVisitorData({...visitorData, phone: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Purpose of Visit *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., Family visit, Academic discussion"
              value={visitorData.purpose}
              onChange={(e) => setVisitorData({...visitorData, purpose: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Group Size
            </label>
            <select
              className="input-field"
              value={visitorData.groupSize}
              onChange={(e) => setVisitorData({...visitorData, groupSize: e.target.value})}
            >
              {[1,2,3,4,5].map(size => (
                <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>

          {/* OTP Actions */}
          <div className="pt-4 border-t">
            {!otpStatus && (
              <button
                onClick={onRequestOTP}
                disabled={loading || !selectedStudent || !visitorData.name || !visitorData.phone || !visitorData.purpose}
                className="btn btn-primary w-full text-lg py-3"
              >
                {loading ? 'Processing...' : 'Request OTP'}
              </button>
            )}

            {otpStatus === 'sent' && (
              <div className="space-y-4">
                <div className="bg-warning-50 border border-warning-200 text-warning-800 px-4 py-3 rounded-md">
                  OTP sent to student. Please ask for the OTP from the visitor.
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter OTP
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Enter 6-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      maxLength={6}
                    />
                    <button
                      onClick={() => onVerifyOTP(otpInput)}
                      disabled={loading || otpInput.length !== 6}
                      className="btn btn-success px-6"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            )}

            {otpStatus === 'verified' && (
              <div className="bg-success-50 border border-success-200 text-success-800 px-4 py-3 rounded-md">
                ✅ Entry approved! Visitor can proceed.
              </div>
            )}

            {otpStatus === 'out_of_hours' && (
              <div className="space-y-4">
                <div className="bg-warning-50 border border-warning-200 text-warning-800 px-4 py-3 rounded-md">
                  This is an out-of-hours visit request. Warden approval required.
                </div>
                <button
                  onClick={onRequestOverride}
                  disabled={loading}
                  className="btn btn-warning w-full"
                >
                  Request Warden Override
                </button>
              </div>
            )}

            {otpStatus === 'override_requested' && (
              <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-md">
                Override request sent to warden. Please wait for approval.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Active Visits View
const VisitsView = ({ activeVisits, onCheckout, onRefresh }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Active Visits</h2>
        <button
          onClick={onRefresh}
          className="btn btn-secondary"
        >
          Refresh
        </button>
      </div>

      {activeVisits.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.196M17 20v-2a3 3 0 00-5.196-2.196m5.196 2.196L17 20m-5.196-2.196a7.945 7.945 0 00-1.804 2.196M17 20v-2a3 3 0 00-5.196-2.196M17 20H7m10 0v-2M7 20H2v-2a3 3 0 015.196-2.196M7 20v-2m0 0V9a5 5 0 0110 0v11M7 9a5 5 0 0110 0v11" />
            </svg>
            <p className="text-lg">No active visits</p>
            <p className="text-sm">All visitors have been checked out</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {activeVisits.map((visit) => (
            <div key={visit._id} className="card p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div>
                      <h3 className="text-lg font-semibold">{visit.visitorName}</h3>
                      <p className="text-sm text-gray-600">{visit.visitorPhone}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Visiting: {visit.studentId?.name}</p>
                      <p className="text-sm text-gray-600">Room {visit.studentId?.room}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Purpose:</span> {visit.purpose}
                    </div>
                    <div>
                      <span className="font-medium">Entry Time:</span> {new Date(visit.entryAt).toLocaleTimeString()}
                    </div>
                    <div>
                      <span className="font-medium">Method:</span> 
                      <span className={`ml-1 px-2 py-1 rounded-full text-xs ${
                        visit.method === 'otp' ? 'bg-primary-100 text-primary-800' :
                        visit.method === 'preapproved' ? 'bg-success-100 text-success-800' :
                        'bg-warning-100 text-warning-800'
                      }`}>
                        {visit.method.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {
                        Math.floor((new Date() - new Date(visit.entryAt)) / 60000)
                      } minutes
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => onCheckout(visit._id)}
                  className="btn btn-danger ml-4"
                >
                  Check Out
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GuardKiosk;
