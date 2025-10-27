import { useFormContext } from 'react-hook-form';

const ReviewForm = () => {
  const { watch } = useFormContext();
  const formData = watch();

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
    <div className="p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Review Your Application</h3>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Please Review Your Information
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Please carefully review all the information below. Once you submit the application, 
                you will not be able to modify the details. If you need to make changes, 
                use the "Back" button to go to previous steps.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* Student Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Student Information
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Full Name:</span>
              <p className="text-gray-800">{formData.fullName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Roll Number:</span>
              <p className="text-gray-800">{formData.rollNumber || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Year:</span>
              <p className="text-gray-800">{formData.year || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Date of Birth:</span>
              <p className="text-gray-800">{formatDate(formData.dateOfBirth)}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Branch:</span>
              <p className="text-gray-800">{formData.branch || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Rank/CGPA:</span>
              <p className="text-gray-800">{formData.rankOrCGPA || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Gender:</span>
              <p className="text-gray-800">{formData.gender || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mobile Number:</span>
              <p className="text-gray-800">{formData.studentMobile || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Email:</span>
              <p className="text-gray-800">{formData.studentEmail || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Aadhaar Number:</span>
              <p className="text-gray-800">
                {formData.aadhaarNumber ? `****-****-${formData.aadhaarNumber.slice(-4)}` : 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Blood Group:</span>
              <p className="text-gray-800">{formData.bloodGroup || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Identification Marks:</span>
              <p className="text-gray-800">{formData.identificationMarks || 'Not provided'}</p>
            </div>
            {formData.majorIllness && (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-gray-600">Major Illness:</span>
                <p className="text-gray-800">{formData.majorIllness}</p>
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
              <p className="text-gray-800">{formData.fatherName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mother's Name:</span>
              <p className="text-gray-800">{formData.motherName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Father's Contact:</span>
              <p className="text-gray-800">{formData.fatherContact || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Mother's Contact:</span>
              <p className="text-gray-800">{formData.motherContact || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Parent's Email:</span>
              <p className="text-gray-800">{formData.parentEmail || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Permanent Address:</span>
              <p className="text-gray-800">{formData.permanentAddress || 'Not provided'}</p>
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
              <p className="text-gray-800">{formData.guardianName || 'Not provided'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Guardian Contact:</span>
              <p className="text-gray-800">{formData.guardianContact || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Guardian Email:</span>
              <p className="text-gray-800">{formData.guardianEmail || 'Not provided'}</p>
            </div>
            <div className="md:col-span-2">
              <span className="text-sm font-medium text-gray-600">Guardian Address:</span>
              <p className="text-gray-800">{formData.guardianAddress || 'Not provided'}</p>
            </div>
          </div>
        </div>

        {/* Rules Acceptance */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
            Rules & Regulations Accepted
          </h4>
          <div className="space-y-2">
            {formatRules(formData.rules).map((rule, index) => (
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
                {formData.studentSignature || 'Not provided'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Parent/Guardian's Signature:</span>
              <p className="text-gray-800 font-mono bg-gray-50 p-2 rounded border">
                {formData.parentSignature || 'Not provided'}
              </p>
            </div>
          </div>
        </div>

        {/* Final Confirmation */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                Ready to Submit
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  By clicking "Submit Application", you confirm that all the information provided above is 
                  accurate and complete. Your application will be sent for verification and you will be 
                  notified about the status via email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
