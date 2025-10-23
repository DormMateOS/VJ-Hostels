import React, { useState, useEffect } from 'react';
import { otpAPI, studentAPI, overrideAPI } from '../../securityServices/api';
import socketService from '../../securityServices/socket';
import { useAuth } from '../../context/SecurityContext';
import './VisitorManagement.css';

const Guard = () => {
  const { user, logout } = useAuth();

  const [currentView, setCurrentView] = useState('search'); // search, otp, visits, verify
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
  const [otpVerificationData, setOtpVerificationData] = useState({
    visitorPhone: '',
    otp: ''
  });

  useEffect(() => {
    socketService.connect();

    if (user && (user._id || user.id)) {
      loadActiveVisits();
    }

    socketService.on('otpVerified', handleOtpVerified);
    socketService.on('visitCreated', handleVisitCreated);
    socketService.on('visitCheckedOut', handleVisitCheckedOut);

    return () => {
      socketService.off('otpVerified', handleOtpVerified);
      socketService.off('visitCreated', handleVisitCreated);
      socketService.off('visitCheckedOut', handleVisitCheckedOut);
    };
  }, [user]);

  const handleOtpVerified = (data) => {
    setOtpStatus('verified');
    loadActiveVisits();
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
      const guardId = user?._id || user?.id;
      if (!guardId) {
        setError('Authentication error: Guard ID missing');
        return;
      }
      const response = await otpAPI.getActiveVisits(guardId);
      setActiveVisits(response.data.visits || []);
    } catch (error) {
      setError(`Failed to load visits: ${error.message}`);
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
        groupSize: parseInt(visitorData.groupSize) || 1
      };

      const response = await otpAPI.requestOTP(requestData);

      if (response.data.success) {
        if (response.data.code === 'PRE_APPROVED') {
          setOtpStatus('verified');
          setError(null);
          loadActiveVisits();
          setTimeout(() => {
            setCurrentView('visits');
            resetForm();
          }, 2000);
        } else if (response.data.code === 'OTP_SENT') {
          setOtpStatus('sent');
          setError(null);
        }
      } else {
        const message = response.data.message || 'Failed to request OTP';
        const code = response.data.code;

        setError(message);

        if (code === 'OUT_OF_HOURS') {
          setOtpStatus('out_of_hours');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Failed to request OTP';
      const code = error.response?.data?.code;

      setError(message);

      if (code === 'OUT_OF_HOURS') {
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
        setError(null);

        setTimeout(() => {
          alert(response.data.message);
        }, 300);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Override request failed';
      setError(message);
      setOtpStatus('out_of_hours');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (visitId) => {
    try {
      await otpAPI.checkout(visitId, { guardId: user._id || user.id });
      loadActiveVisits();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to checkout visitor');
    }
  };

  const handleDirectOTPVerify = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);

      const response = await otpAPI.verifyOTP({
        visitorPhone: otpVerificationData.visitorPhone,
        providedOtp: otpVerificationData.otp,
        guardId: user._id || user.id
      });

      if (response.data.success) {
        setOtpStatus('verified');
        loadActiveVisits();
        setTimeout(() => {
          setCurrentView('visits');
          setOtpVerificationData({ visitorPhone: '', otp: '' });
        }, 2000);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP verification failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedStudent(null);
    setSearchQuery('');
    setVisitorData({ name: '', phone: '', purpose: '', groupSize: 1 });
    setOtpStatus(null);
    setError(null);
  };

  if (!user) {
    return (
      <div className="guard-loading">
        <div className="guard-spinner"></div>
        <p>Loading guard information...</p>
      </div>
    );
  }

  return (
    <div className="guard-container">
      {/* Header */}
      <header className="guard-header">
        <div className="guard-header-content">
          <div className="guard-header-title">
            <h1>🛡️ Security Guard</h1>
            <p>Welcome, {user?.name || 'Guard'}</p>
          </div>
          <div className="guard-header-buttons">
            <button
              onClick={() => setCurrentView('search')}
              className={`guard-btn ${currentView === 'search' ? 'guard-btn-active' : 'guard-btn-inactive'}`}
            >
              New Visitor
            </button>
            <button
              onClick={() => setCurrentView('verify')}
              className={`guard-btn ${currentView === 'verify' ? 'guard-btn-active' : 'guard-btn-inactive'}`}
            >
              Verify OTP
            </button>
            <button
              onClick={() => setCurrentView('visits')}
              className={`guard-btn ${currentView === 'visits' ? 'guard-btn-active' : 'guard-btn-inactive'} guard-btn-relative`}
            >
              Active Visits
              {activeVisits.length > 0 && (
                <span className="guard-badge">{activeVisits.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="guard-main">
        {error && (
          <div className="guard-error">
            {error}
            <button onClick={() => setError(null)} className="guard-error-close">×</button>
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

        {currentView === 'verify' && (
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header">
                  <h5 className="mb-0">
                    Verify Student OTP
                  </h5>
                </div>
                <div className="card-body">
                  <form onSubmit={handleDirectOTPVerify}>
                    <div className="mb-3">
                      <label className="form-label">Visitor Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={otpVerificationData.visitorPhone}
                        onChange={(e) => setOtpVerificationData({
                          ...otpVerificationData,
                          visitorPhone: e.target.value
                        })}
                        required
                        placeholder="Enter visitor's phone number"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">OTP</label>
                      <input
                        type="text"
                        className="form-control"
                        value={otpVerificationData.otp}
                        onChange={(e) => setOtpVerificationData({
                          ...otpVerificationData,
                          otp: e.target.value
                        })}
                        required
                        maxLength={6}
                        placeholder="Enter 6-digit OTP"
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading || 
                        !otpVerificationData.visitorPhone || 
                        otpVerificationData.otp.length !== 6}
                    >
                      {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                  </form>

                  {otpStatus === 'verified' && (
                    <div className="alert alert-success mt-3">
                      ✅ OTP verified successfully. Entry granted.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'visits' && (
          <VisitsView
            activeVisits={activeVisits}
            onCheckout={handleCheckout}
            onRefresh={loadActiveVisits}
          />
        )}
      </main>
    </div>
  );
};

// Search and OTP Request View
const SearchView = ({ 
  searchQuery, setSearchQuery, searchResults, onSearch, onStudentSelect, 
  selectedStudent, visitorData, setVisitorData, otpStatus, onRequestOTP, 
  onVerifyOTP, onRequestOverride, onReset, loading
}) => {
  const [otpInput, setOtpInput] = useState('');

  return (
    <div className="guard-grid">
      {/* Student Search Card */}
      <div className="guard-card">
        <h2>Find Student</h2>
        
        <div className="guard-search-section">
          <label className="guard-label">Search by name, room, or roll number</label>
          <input
            type="text"
            className="guard-input"
            placeholder="Enter student name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
          />
        </div>

        {searchResults.length > 0 && (
          <div className="guard-results">
            {searchResults.map((student) => (
              <button
                key={student._id}
                onClick={() => onStudentSelect(student)}
                className="guard-result-item"
              >
                <div className="guard-result-name">{student.name}</div>
                <div className="guard-result-info">
                  Room {student.room} • {student.rollNumber}
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedStudent && (
          <div className="guard-selected-student">
            <div>
              <div className="guard-selected-name">{selectedStudent.name}</div>
              <div className="guard-selected-info">
                Room {selectedStudent.room} • {selectedStudent.rollNumber}
              </div>
            </div>
            <button onClick={onReset} className="guard-change-btn">Change</button>
          </div>
        )}
      </div>

      {/* Visitor Details Card */}
      <div className="guard-card">
        <h2>Visitor Details</h2>
        
        <div className="guard-form-group">
          <label className="guard-label">Visitor Name *</label>
          <input
            type="text"
            className="guard-input"
            placeholder="Enter visitor's full name"
            value={visitorData.name}
            onChange={(e) => setVisitorData({...visitorData, name: e.target.value})}
          />
        </div>

        <div className="guard-form-group">
          <label className="guard-label">Phone Number *</label>
          <input
            type="tel"
            className="guard-input"
            placeholder="Enter visitor's phone number"
            value={visitorData.phone}
            onChange={(e) => setVisitorData({...visitorData, phone: e.target.value})}
          />
        </div>

        <div className="guard-form-group">
          <label className="guard-label">Purpose of Visit *</label>
          <input
            type="text"
            className="guard-input"
            placeholder="e.g., Family visit, Academic discussion"
            value={visitorData.purpose}
            onChange={(e) => setVisitorData({...visitorData, purpose: e.target.value})}
          />
        </div>

        <div className="guard-form-group">
          <label className="guard-label">Group Size</label>
          <select
            className="guard-input guard-select"
            value={visitorData.groupSize}
            onChange={(e) => setVisitorData({...visitorData, groupSize: e.target.value})}
          >
            {[1,2,3,4,5].map(size => (
              <option key={size} value={size}>
                {size} {size === 1 ? 'person' : 'people'}
              </option>
            ))}
          </select>
        </div>

        {/* OTP Actions */}
        <div className="guard-otp-section">
          {!otpStatus && (
            <button
              onClick={onRequestOTP}
              disabled={loading || !selectedStudent || !visitorData.name || !visitorData.phone || !visitorData.purpose}
              className="guard-btn-primary guard-btn-full"
            >
              {loading ? 'Processing...' : 'Request OTP'}
            </button>
          )}

          {otpStatus === 'sent' && (
            <div className="guard-otp-form">
              <div className="guard-alert guard-alert-warning">
                OTP sent to student. Please ask for the OTP from the visitor.
              </div>
              <div className="guard-otp-input-group">
                <input
                  type="text"
                  className="guard-input"
                  placeholder="Enter 6-digit OTP"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                  maxLength={6}
                />
                <button
                  onClick={() => onVerifyOTP(otpInput)}
                  disabled={loading || otpInput.length !== 6}
                  className="guard-btn-success"
                >
                  Verify
                </button>
              </div>
            </div>
          )}

          {otpStatus === 'verified' && (
            <div className="guard-alert guard-alert-success">
              ✅ Entry approved! Visitor can proceed.
            </div>
          )}

          {otpStatus === 'out_of_hours' && (
            <div>
              <div className="guard-alert guard-alert-warning">
                This is an out-of-hours visit request. Warden approval required.
              </div>
              <button
                onClick={onRequestOverride}
                disabled={loading}
                className="guard-btn-warning guard-btn-full"
              >
                Request Warden Override
              </button>
            </div>
          )}

          {otpStatus === 'override_requested' && (
            <div className="guard-alert guard-alert-info">
              ✅ Override request sent to admin. Please wait for approval.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Active Visits View
const VisitsView = ({ activeVisits, onCheckout, onRefresh }) => {
  return (
    <div className="guard-visits-container">
      <div className="guard-visits-header">
        <h2>Active Visits</h2>
        <button onClick={onRefresh} className="guard-btn-secondary">
          Refresh
        </button>
      </div>

      {activeVisits.length === 0 ? (
        <div className="guard-empty-state">
          <div className="guard-empty-icon">👥</div>
          <p className="guard-empty-title">No active visits</p>
          <p className="guard-empty-subtitle">All visitors have been checked out</p>
        </div>
      ) : (
        <div className="guard-visits-grid">
          {activeVisits.map((visit) => (
            <div key={visit._id} className="guard-visit-card">
              <div className="guard-visit-header">
                <div>
                  <h3>{visit.visitorName}</h3>
                  <p>{visit.visitorPhone}</p>
                </div>
                <button
                  onClick={() => onCheckout(visit._id)}
                  className="guard-btn-danger"
                >
                  Check Out
                </button>
              </div>

              <div className="guard-visit-info">
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Visiting:</span>
                  <span>{visit.studentId?.name}</span>
                </div>
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Room:</span>
                  <span>{visit.studentId?.room}</span>
                </div>
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Purpose:</span>
                  <span>{visit.purpose}</span>
                </div>
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Entry Time:</span>
                  <span>{new Date(visit.entryAt).toLocaleTimeString()}</span>
                </div>
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Duration:</span>
                  <span>{Math.floor((new Date() - new Date(visit.entryAt)) / 60000)} minutes</span>
                </div>
                <div className="guard-visit-row">
                  <span className="guard-visit-label">Method:</span>
                  <span className={`guard-badge-method guard-badge-${visit.method}`}>
                    {visit.method.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Guard;
