import { useFormContext } from 'react-hook-form';

const StudentDetailsForm = () => {
  const { register, formState: { errors } } = useFormContext();

  const yearOptions = [
    { value: '1st Year', label: '1st Year' },
    { value: '2nd Year', label: '2nd Year' },
    { value: '3rd Year', label: '3rd Year' },
    { value: '4th Year', label: '4th Year' }
  ];

  const genderOptions = [
    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' }
  ];

  const bloodGroups = [
    'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
  ];

  return (
    <div className="p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Student & Parent Details</h3>
      
      {/* Student Details Section */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Student Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name (in CAPITAL LETTERS) *
            </label>
            <input
              type="text"
              {...register('fullName', {
                required: 'Full name is required',
                pattern: {
                  value: /^[A-Z\s]+$/,
                  message: 'Name must be in CAPITAL LETTERS only'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="JOHN DOE"
              style={{ textTransform: 'uppercase' }}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          {/* Roll Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Roll Number *
            </label>
            <input
              type="text"
              {...register('rollNumber', {
                required: 'Roll number is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="21A91A0501"
            />
            {errors.rollNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.rollNumber.message}</p>
            )}
          </div>

          {/* Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year *
            </label>
            <select
              {...register('year', {
                required: 'Year is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Year</option>
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.year && (
              <p className="mt-1 text-sm text-red-600">{errors.year.message}</p>
            )}
          </div>

          {/* Date of Birth */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth *
            </label>
            <input
              type="date"
              {...register('dateOfBirth', {
                required: 'Date of birth is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.dateOfBirth && (
              <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
            )}
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch *
            </label>
            <input
              type="text"
              {...register('branch', {
                required: 'Branch is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Computer Science Engineering"
            />
            {errors.branch && (
              <p className="mt-1 text-sm text-red-600">{errors.branch.message}</p>
            )}
          </div>

          {/* Rank or CGPA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rank or CGPA *
            </label>
            <input
              type="text"
              {...register('rankOrCGPA', {
                required: 'Rank or CGPA is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="8.5 CGPA or 1234 Rank"
            />
            {errors.rankOrCGPA && (
              <p className="mt-1 text-sm text-red-600">{errors.rankOrCGPA.message}</p>
            )}
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender *
            </label>
            <select
              {...register('gender', {
                required: 'Gender is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Gender</option>
              {genderOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.gender && (
              <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
            )}
          </div>

          {/* Student Mobile */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Mobile Number *
            </label>
            <input
              type="tel"
              {...register('studentMobile', {
                required: 'Mobile number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Mobile number must be exactly 10 digits'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9876543210"
              maxLength="10"
            />
            {errors.studentMobile && (
              <p className="mt-1 text-sm text-red-600">{errors.studentMobile.message}</p>
            )}
          </div>

          {/* Student Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Email *
            </label>
            <input
              type="email"
              {...register('studentEmail', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="student@example.com"
            />
            {errors.studentEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.studentEmail.message}</p>
            )}
          </div>

          {/* Aadhaar Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Aadhaar Number *
            </label>
            <input
              type="text"
              {...register('aadhaarNumber', {
                required: 'Aadhaar number is required',
                pattern: {
                  value: /^[0-9]{12}$/,
                  message: 'Aadhaar number must be exactly 12 digits'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="123456789012"
              maxLength="12"
            />
            {errors.aadhaarNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.aadhaarNumber.message}</p>
            )}
          </div>

          {/* Identification Marks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Identification Marks *
            </label>
            <input
              type="text"
              {...register('identificationMarks', {
                required: 'Identification marks are required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mole on left cheek"
            />
            {errors.identificationMarks && (
              <p className="mt-1 text-sm text-red-600">{errors.identificationMarks.message}</p>
            )}
          </div>

          {/* Blood Group */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Blood Group *
            </label>
            <select
              {...register('bloodGroup', {
                required: 'Blood group is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Blood Group</option>
              {bloodGroups.map(group => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
            {errors.bloodGroup && (
              <p className="mt-1 text-sm text-red-600">{errors.bloodGroup.message}</p>
            )}
          </div>

          {/* Major Illness */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Any Major Illness (Optional)
            </label>
            <textarea
              {...register('majorIllness')}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe any major illness or medical conditions (if any)"
            />
          </div>
        </div>
      </div>

      {/* Parent Details Section */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Parent Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Father's Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Name *
            </label>
            <input
              type="text"
              {...register('fatherName', {
                required: 'Father\'s name is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Father's Full Name"
            />
            {errors.fatherName && (
              <p className="mt-1 text-sm text-red-600">{errors.fatherName.message}</p>
            )}
          </div>

          {/* Mother's Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mother's Name *
            </label>
            <input
              type="text"
              {...register('motherName', {
                required: 'Mother\'s name is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Mother's Full Name"
            />
            {errors.motherName && (
              <p className="mt-1 text-sm text-red-600">{errors.motherName.message}</p>
            )}
          </div>

          {/* Father's Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Contact Number *
            </label>
            <input
              type="tel"
              {...register('fatherContact', {
                required: 'Father\'s contact number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Contact number must be exactly 10 digits'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9876543210"
              maxLength="10"
            />
            {errors.fatherContact && (
              <p className="mt-1 text-sm text-red-600">{errors.fatherContact.message}</p>
            )}
          </div>

          {/* Mother's Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mother's Contact Number *
            </label>
            <input
              type="tel"
              {...register('motherContact', {
                required: 'Mother\'s contact number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Contact number must be exactly 10 digits'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9876543210"
              maxLength="10"
            />
            {errors.motherContact && (
              <p className="mt-1 text-sm text-red-600">{errors.motherContact.message}</p>
            )}
          </div>

          {/* Parent Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent's Email *
            </label>
            <input
              type="email"
              {...register('parentEmail', {
                required: 'Parent\'s email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="parent@example.com"
            />
            {errors.parentEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.parentEmail.message}</p>
            )}
          </div>

          {/* Permanent Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permanent Address *
            </label>
            <textarea
              {...register('permanentAddress', {
                required: 'Permanent address is required'
              })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter complete permanent address"
            />
            {errors.permanentAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.permanentAddress.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Local Guardian Details Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">Local Guardian Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Guardian Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian Name *
            </label>
            <input
              type="text"
              {...register('guardianName', {
                required: 'Guardian name is required'
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Local Guardian's Full Name"
            />
            {errors.guardianName && (
              <p className="mt-1 text-sm text-red-600">{errors.guardianName.message}</p>
            )}
          </div>

          {/* Guardian Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian Contact Number *
            </label>
            <input
              type="tel"
              {...register('guardianContact', {
                required: 'Guardian contact number is required',
                pattern: {
                  value: /^[0-9]{10}$/,
                  message: 'Contact number must be exactly 10 digits'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="9876543210"
              maxLength="10"
            />
            {errors.guardianContact && (
              <p className="mt-1 text-sm text-red-600">{errors.guardianContact.message}</p>
            )}
          </div>

          {/* Guardian Email */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian Email *
            </label>
            <input
              type="email"
              {...register('guardianEmail', {
                required: 'Guardian email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="guardian@example.com"
            />
            {errors.guardianEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.guardianEmail.message}</p>
            )}
          </div>

          {/* Guardian Address */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Guardian Address *
            </label>
            <textarea
              {...register('guardianAddress', {
                required: 'Guardian address is required'
              })}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter local guardian's complete address"
            />
            {errors.guardianAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.guardianAddress.message}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailsForm;
