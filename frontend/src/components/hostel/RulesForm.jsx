import { useFormContext } from 'react-hook-form';

const RulesForm = () => {
  const { register, formState: { errors } } = useFormContext();

  const rules = [
    {
      key: 'transportation',
      text: 'I will use only hostel-provided or authorized transportation'
    },
    {
      key: 'behavior',
      text: 'I will not use abusive language or indulge in violent behavior'
    },
    {
      key: 'electricalItems',
      text: 'I will not bring or use electric kettles, irons, or mixers'
    },
    {
      key: 'substances',
      text: 'I will not consume alcohol, drugs, or tobacco in the hostel'
    },
    {
      key: 'dressCode',
      text: 'I will wear proper dress code while attending college'
    },
    {
      key: 'feesPolicy',
      text: 'I understand hostel fees are non-refundable'
    },
    {
      key: 'timings',
      text: 'I will return to hostel by 6:30 PM on working days and 7:00 PM on holidays'
    },
    {
      key: 'discipline',
      text: 'I will maintain discipline and respect hostel authorities'
    }
  ];

  return (
    <div className="p-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Hostel Rules & Undertaking</h3>
      
      {/* Rules Section */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
          Mandatory Rules and Regulations
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          Please read and accept all the following rules and regulations by checking the boxes below. 
          All rules are mandatory and must be accepted to proceed.
        </p>
        
        <div className="space-y-4">
          {rules.map((rule, index) => (
            <div key={rule.key} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  {...register(`rules.${rule.key}`, {
                    required: 'This rule must be accepted'
                  })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 cursor-pointer">
                  <span className="font-semibold text-blue-600 mr-2">
                    Rule {index + 1}:
                  </span>
                  {rule.text}
                </label>
                {errors.rules?.[rule.key] && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.rules[rule.key].message}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Signatures Section */}
      <div>
        <h4 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
          Digital Signatures
        </h4>
        <p className="text-sm text-gray-600 mb-6">
          By providing your digital signatures below, you confirm that all information provided is accurate 
          and you agree to abide by all hostel rules and regulations.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Student Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student's Digital Signature *
            </label>
            <input
              type="text"
              {...register('studentSignature', {
                required: 'Student signature is required',
                minLength: {
                  value: 3,
                  message: 'Signature must be at least 3 characters'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Type your full name as signature"
            />
            {errors.studentSignature && (
              <p className="mt-1 text-sm text-red-600">{errors.studentSignature.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Type your full name exactly as it appears in your documents
            </p>
          </div>

          {/* Parent/Guardian Signature */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent/Guardian's Digital Signature *
            </label>
            <input
              type="text"
              {...register('parentSignature', {
                required: 'Parent/Guardian signature is required',
                minLength: {
                  value: 3,
                  message: 'Signature must be at least 3 characters'
                }
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Parent/Guardian full name as signature"
            />
            {errors.parentSignature && (
              <p className="mt-1 text-sm text-red-600">{errors.parentSignature.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Parent or guardian should type their full name as signature
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important Notice
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  By proceeding to the next step, you acknowledge that:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All information provided is true and accurate</li>
                  <li>You have read and understood all hostel rules</li>
                  <li>You agree to comply with all regulations</li>
                  <li>Violation of rules may result in hostel termination</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesForm;
