import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import HostelApplicationForm from '../hostel/HostelApplicationForm';

const MyHostelApplication = ({ userEmail }) => {
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadUserApplications();
  }, [userEmail]);

  const loadUserApplications = () => {
    const allApplications = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
    // Filter applications by user email
    const userApplications = allApplications.filter(app => 
      app.studentEmail === userEmail || app.parentEmail === userEmail
    );
    setApplications(userApplications);
  };

  const deleteApplication = (applicationId) => {
    if (window.confirm('Are you sure you want to delete this application? This action cannot be undone.')) {
      const allApplications = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
      const updatedApplications = allApplications.filter(app => app.id !== applicationId);
      localStorage.setItem('hostelApplications', JSON.stringify(updatedApplications));
      loadUserApplications();
      toast.success('Application deleted successfully');
      setSelectedApplication(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_verification: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        text: 'Pending Verification',
        icon: '⏳'
      },
      approved: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        text: 'Approved',
        icon: '✅'
      },
      rejected: { 
        color: 'bg-red-100 text-red-800 border-red-200', 
        text: 'Rejected',
        icon: '❌'
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending_verification;
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (showNewForm) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => setShowNewForm(false)}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Applications
          </button>
        </div>
        <HostelApplicationForm />
      </div>
    );
  }

  if (showEditForm && selectedApplication) {
    return (
      <div>
        <div className="mb-4">
          <button
            onClick={() => {
              setShowEditForm(false);
              setSelectedApplication(null);
            }}
            className="flex items-center text-blue-600 hover:text-blue-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to My Applications
          </button>
        </div>
        <EditApplicationForm 
          application={selectedApplication}
          onSave={(updatedData) => {
            // Update the application in localStorage
            const allApplications = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
            const updatedApplications = allApplications.map(app => 
              app.id === selectedApplication.id 
                ? { ...app, ...updatedData, updatedAt: new Date().toISOString() }
                : app
            );
            localStorage.setItem('hostelApplications', JSON.stringify(updatedApplications));
            loadUserApplications();
            setShowEditForm(false);
            setSelectedApplication(null);
            toast.success('Application updated successfully!');
          }}
          onCancel={() => {
            setShowEditForm(false);
            setSelectedApplication(null);
          }}
        />
      </div>
    );
  }

  if (selectedApplication) {
    return (
      <ApplicationDetails 
        application={selectedApplication}
        onBack={() => setSelectedApplication(null)}
        onEdit={() => setShowEditForm(true)}
        onDelete={deleteApplication}
      />
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">My Hostel Applications</h2>
          <p className="text-gray-600">View and manage your hostel accommodation applications</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Found</h3>
          <p className="text-gray-600 mb-4">You haven't submitted any hostel applications yet.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Submit New Application
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      Application #{application.id}
                    </h3>
                    <p className="text-gray-600">
                      Submitted on {formatDate(application.submittedAt)}
                    </p>
                    {application.updatedAt && (
                      <p className="text-sm text-gray-500">
                        Last updated: {formatDate(application.updatedAt)}
                      </p>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(application.status)}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Student Name:</span>
                    <p className="text-gray-800">{application.fullName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Roll Number:</span>
                    <p className="text-gray-800">{application.rollNumber}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Year & Branch:</span>
                    <p className="text-gray-800">{application.year} - {application.branch}</p>
                  </div>
                </div>

                {application.verificationRemarks && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-600">Admin Remarks:</span>
                    <p className="text-gray-800 mt-1">{application.verificationRemarks}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                    {application.status === 'pending_verification' && (
                      <button
                        onClick={() => {
                          setSelectedApplication(application);
                          setShowEditForm(true);
                        }}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        Edit Application
                      </button>
                    )}
                    <button
                      onClick={() => deleteApplication(application.id)}
                      className="text-red-600 hover:text-red-800 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                  
                  {application.status === 'approved' && (
                    <div className="text-sm text-green-600 font-medium">
                      🎉 Congratulations! Your application has been approved.
                    </div>
                  )}
                  
                  {application.status === 'rejected' && (
                    <div className="text-sm text-red-600 font-medium">
                      Application was rejected. You can submit a new application.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const ApplicationDetails = ({ application, onBack, onEdit, onDelete }) => {
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
            <p className="text-gray-600">Application #{application.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {application.status === 'pending_verification' && (
            <button
              onClick={onEdit}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Edit Application
            </button>
          )}
          <button
            onClick={() => onDelete(application.id)}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Same content as ReviewForm but read-only */}
      <div className="space-y-6">
        {/* Application Status */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Application Status</h4>
          <div className="flex items-center justify-between">
            <div>
              {application.status === 'pending_verification' && (
                <span className="px-4 py-2 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⏳ Pending Verification
                </span>
              )}
              {application.status === 'approved' && (
                <span className="px-4 py-2 text-sm font-medium rounded-full bg-green-100 text-green-800 border border-green-200">
                  ✅ Approved
                </span>
              )}
              {application.status === 'rejected' && (
                <span className="px-4 py-2 text-sm font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                  ❌ Rejected
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              Submitted: {formatDate(application.submittedAt)}
            </div>
          </div>
          {application.verificationRemarks && (
            <div className="mt-4 p-3 bg-white rounded border">
              <span className="text-sm font-medium text-gray-600">Admin Remarks:</span>
              <p className="text-gray-800 mt-1">{application.verificationRemarks}</p>
            </div>
          )}
        </div>

        {/* Rest of the content same as ReviewForm */}
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
      </div>
    </div>
  );
};

const EditApplicationForm = ({ application, onSave, onCancel }) => {
  // This would be a simplified edit form - for now, we'll just show a placeholder
  // In a real implementation, you'd create a form similar to HostelApplicationForm
  // but pre-populated with existing data
  
  return (
    <div className="p-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              Edit Application
            </h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                You can only edit applications that are pending verification. 
                Once approved or rejected, applications cannot be modified.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center py-12">
        <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Edit Functionality</h3>
        <p className="text-gray-600 mb-6">
          The edit functionality would allow users to modify their application details.
          This would include a form similar to the original application form but pre-populated with existing data.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(application)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            Save Changes (Demo)
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyHostelApplication;
