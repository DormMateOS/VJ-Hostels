import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const HostelApplicationsManager = () => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = () => {
    const savedApplications = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
    setApplications(savedApplications);
  };

  const updateApplicationStatus = (applicationId, newStatus, remarks = '') => {
    const updatedApplications = applications.map(app => 
      app.id === applicationId 
        ? { 
            ...app, 
            status: newStatus, 
            verificationRemarks: remarks,
            verifiedAt: new Date().toISOString(),
            verifiedBy: 'Admin' // In real app, this would be the logged-in admin's name
          }
        : app
    );
    
    setApplications(updatedApplications);
    localStorage.setItem('hostelApplications', JSON.stringify(updatedApplications));
    
    const statusMessages = {
      approved: 'Application approved successfully! 🎉',
      rejected: 'Application rejected.',
      pending_verification: 'Application moved back to pending.'
    };
    
    toast.success(statusMessages[newStatus] || 'Status updated successfully');
    setSelectedApplication(null);
  };

  const deleteApplication = (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      const updatedApplications = applications.filter(app => app.id !== applicationId);
      setApplications(updatedApplications);
      localStorage.setItem('hostelApplications', JSON.stringify(updatedApplications));
      toast.success('Application deleted successfully');
      setSelectedApplication(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter;
    const matchesSearch = 
      app.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_verification: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };
    
    const config = statusConfig[status] || statusConfig.pending_verification;
    
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (selectedApplication) {
    return <ApplicationDetails 
      application={selectedApplication} 
      onBack={() => setSelectedApplication(null)}
      onUpdateStatus={updateApplicationStatus}
      onDelete={deleteApplication}
    />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Hostel Applications Management</h2>
        <p className="text-gray-600">Review and manage hostel accommodation applications</p>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by name, roll number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Applications</option>
          <option value="pending_verification">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-gray-800">{applications.length}</div>
          <div className="text-sm text-gray-600">Total Applications</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-yellow-600">
            {applications.filter(app => app.status === 'pending_verification').length}
          </div>
          <div className="text-sm text-gray-600">Pending Review</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-green-600">
            {applications.filter(app => app.status === 'approved').length}
          </div>
          <div className="text-sm text-gray-600">Approved</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="text-2xl font-bold text-red-600">
            {applications.filter(app => app.status === 'rejected').length}
          </div>
          <div className="text-sm text-gray-600">Rejected</div>
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {filteredApplications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No applications found matching your criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Academic Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
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
                <AnimatePresence>
                  {filteredApplications.map((application) => (
                    <motion.tr
                      key={application.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {application.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {application.studentEmail}
                          </div>
                          <div className="text-sm text-gray-500">
                            📱 {application.studentMobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{application.rollNumber}</div>
                        <div className="text-sm text-gray-500">{application.year} - {application.branch}</div>
                        <div className="text-sm text-gray-500">CGPA/Rank: {application.rankOrCGPA}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(application.submittedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(application.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedApplication(application)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => deleteApplication(application.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const ApplicationDetails = ({ application, onBack, onUpdateStatus, onDelete }) => {
  const [remarks, setRemarks] = useState(application.verificationRemarks || '');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatRules = (rules) => {
    const ruleLabels = {
      transportation: 'Use only hostel-provided or authorized transportation',
      behavior: 'No abusive language or violent behavior',
      electricalItems: 'No electric kettles, irons, or mixers',
      substances: 'No alcohol, drugs, or tobacco in hostel',
      dressCode: 'Wear proper dress code while attending college',
      feesPolicy: 'Understand hostel fees are non-refundable',
      timings: 'Return by 6:30 PM (working days) / 7:00 PM (holidays)',
      discipline: 'Maintain discipline and respect hostel authorities'
    };

    return Object.entries(rules || {})
      .filter(([_, value]) => value)
      .map(([key, _]) => ruleLabels[key])
      .filter(Boolean);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={onBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Application Details</h2>
            <p className="text-gray-600">Review and verify hostel application</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {application.status === 'pending_verification' && (
            <>
              <button
                onClick={() => onUpdateStatus(application.id, 'approved', remarks)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Approve
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
              >
                Reject
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(application.id)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Application Status */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-600">Status: </span>
            {application.status === 'pending_verification' && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">
                Pending Verification
              </span>
            )}
            {application.status === 'approved' && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                Approved
              </span>
            )}
            {application.status === 'rejected' && (
              <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">
                Rejected
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            Submitted: {formatDate(application.submittedAt)}
          </div>
        </div>
        {application.verifiedAt && (
          <div className="mt-2 text-sm text-gray-600">
            Verified on: {formatDate(application.verifiedAt)} by {application.verifiedBy}
          </div>
        )}
      </div>

      {/* Application Content - Same as ReviewForm but read-only */}
      <div className="space-y-6">
        {/* Student Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Student Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Full Name:</span>
              <p className="text-gray-800">{application.fullName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Roll Number:</span>
              <p className="text-gray-800">{application.rollNumber || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Year:</span>
              <p className="text-gray-800">{application.year || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
              <p className="text-gray-800">{formatDate(application.dateOfBirth)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Branch:</span>
              <p className="text-gray-800">{application.branch || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Rank/CGPA:</span>
              <p className="text-gray-800">{application.rankOrCGPA || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Gender:</span>
              <p className="text-gray-800">{application.gender || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mobile Number:</span>
              <p className="text-gray-800">{application.studentMobile || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-800">{application.studentEmail || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Aadhaar Number:</span>
              <p className="text-gray-800">
                {application.aadhaarNumber ? `****-****-${application.aadhaarNumber.slice(-4)}` : 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Blood Group:</span>
              <p className="text-gray-800">{application.bloodGroup || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Identification Marks:</span>
              <p className="text-gray-800">{application.identificationMarks || 'Not provided'}</p>
            </div>
            {application.majorIllness && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Major Illness:</span>
                <p className="text-gray-800">{application.majorIllness}</p>
              </div>
            )}
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Parent Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Father's Name:</span>
              <p className="text-gray-800">{application.fatherName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mother's Name:</span>
              <p className="text-gray-800">{application.motherName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Father's Contact:</span>
              <p className="text-gray-800">{application.fatherContact || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mother's Contact:</span>
              <p className="text-gray-800">{application.motherContact || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Parent's Email:</span>
              <p className="text-gray-800">{application.parentEmail || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Permanent Address:</span>
              <p className="text-gray-800">{application.permanentAddress || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Local Guardian Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Local Guardian Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Guardian Name:</span>
              <p className="text-gray-800">{application.guardianName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Guardian Contact:</span>
              <p className="text-gray-800">{application.guardianContact || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Guardian Email:</span>
              <p className="text-gray-800">{application.guardianEmail || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Guardian Address:</span>
              <p className="text-gray-800">{application.guardianAddress || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Rules Acceptance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Rules & Regulations Accepted
          </h4>
          <div className="space-y-2">
            {formatRules(application.rules).map((rule, index) => (
              <div key={index} className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700">{rule}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Signatures */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Digital Signatures
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Student's Signature:</span>
              <p className="text-gray-800 font-mono bg-gray-50 p-2 rounded border">
                {application.studentSignature || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Parent/Guardian's Signature:</span>
              <p className="text-gray-800 font-mono bg-gray-50 p-2 rounded border">
                {application.parentSignature || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Admin Remarks */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Admin Remarks
          </h4>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Add verification remarks or comments..."
          />
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reject Application</h3>
            <p className="text-gray-600 mb-4">
              Please provide a reason for rejecting this application:
            </p>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Reason for rejection..."
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onUpdateStatus(application.id, 'rejected', remarks);
                  setShowRejectModal(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
              >
                Reject Application
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostelApplicationsManager;
