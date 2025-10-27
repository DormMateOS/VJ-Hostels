import { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import StudentDetailsForm from './StudentDetailsForm';
import RulesForm from './RulesForm';
import ReviewForm from './ReviewForm';
import ProgressBar from './ProgressBar';

const HostelApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const methods = useForm({
    mode: 'onChange',
    defaultValues: {
      // Student Details
      fullName: '',
      rollNumber: '',
      year: '',
      dateOfBirth: '',
      branch: '',
      rankOrCGPA: '',
      gender: '',
      studentMobile: '',
      studentEmail: '',
      aadhaarNumber: '',
      identificationMarks: '',
      bloodGroup: '',
      majorIllness: '',
      
      // Parent Details
      fatherName: '',
      motherName: '',
      fatherContact: '',
      motherContact: '',
      parentEmail: '',
      permanentAddress: '',
      
      // Local Guardian Details
      guardianName: '',
      guardianContact: '',
      guardianEmail: '',
      guardianAddress: '',
      
      // Rules and Undertaking
      rules: {
        transportation: false,
        behavior: false,
        electricalItems: false,
        substances: false,
        dressCode: false,
        feesPolicy: false,
        timings: false,
        discipline: false,
      },
      studentSignature: '',
      parentSignature: '',
    }
  });

  const { handleSubmit, watch, trigger, getValues, reset } = methods;

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedData = localStorage.getItem('hostelApplicationData');
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      reset(parsedData);
    }
  }, [reset]);

  // Save form data to localStorage whenever form values change
  const formValues = watch();
  useEffect(() => {
    localStorage.setItem('hostelApplicationData', JSON.stringify(formValues));
  }, [formValues]);

  const nextStep = async () => {
    let fieldsToValidate = [];
    
    if (currentStep === 1) {
      fieldsToValidate = [
        'fullName', 'rollNumber', 'year', 'dateOfBirth', 'branch', 'rankOrCGPA',
        'gender', 'studentMobile', 'studentEmail', 'aadhaarNumber', 
        'identificationMarks', 'bloodGroup', 'fatherName', 'motherName',
        'fatherContact', 'motherContact', 'parentEmail', 'permanentAddress',
        'guardianName', 'guardianContact', 'guardianEmail', 'guardianAddress'
      ];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'rules.transportation', 'rules.behavior', 'rules.electricalItems',
        'rules.substances', 'rules.dressCode', 'rules.feesPolicy',
        'rules.timings', 'rules.discipline', 'studentSignature', 'parentSignature'
      ];
    }

    const isValid = await trigger(fieldsToValidate);
    
    if (isValid) {
      setCurrentStep(currentStep + 1);
    } else {
      toast.error('Please fill all required fields correctly');
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const onSubmit = (data) => {
    console.log('Form Data Submitted:', data);
    
    // Save to localStorage with submission timestamp
    const submissionData = {
      ...data,
      submittedAt: new Date().toISOString(),
      status: 'pending_verification',
      id: Date.now().toString()
    };
    
    // Save to applications list
    const existingApplications = JSON.parse(localStorage.getItem('hostelApplications') || '[]');
    existingApplications.push(submissionData);
    localStorage.setItem('hostelApplications', JSON.stringify(existingApplications));
    
    // Clear form data
    localStorage.removeItem('hostelApplicationData');
    
    setIsSubmitted(true);
    toast.success('Form submitted successfully! 🎉');
    
    // Reset form after 3 seconds
    setTimeout(() => {
      reset();
      setCurrentStep(1);
      setIsSubmitted(false);
    }, 3000);
  };

  const totalSteps = 3; // Student Details, Rules, Review

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-gray-50 p-4"
      >
        <div className="bg-white rounded-lg shadow-lg p-8 text-center max-w-md w-full">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">
            Form Submitted Successfully!
          </h2>
          <p className="text-gray-600 mb-4">
            Your hostel accommodation application has been submitted and is pending verification.
          </p>
          <div className="text-sm text-gray-500">
            You will be redirected shortly...
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            VIGNANA JYOTHI HOSTEL
          </h1>
          <h2 className="text-xl text-blue-600 font-semibold">
            Accommodation Form 2025–26
          </h2>
        </motion.div>

        {/* Progress Bar */}
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-lg overflow-hidden"
        >
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <StudentDetailsForm />
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <RulesForm />
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ReviewForm />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="px-8 py-6 bg-gray-50 border-t flex justify-between">
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className={`px-6 py-2 rounded-md font-semibold transition-colors ${
                    currentStep === 1
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                >
                  Back
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md px-6 py-2 transition-colors"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md px-6 py-2 transition-colors"
                  >
                    Submit Application
                  </button>
                )}
              </div>
            </form>
          </FormProvider>
        </motion.div>
      </div>
    </div>
  );
};

export default HostelApplicationForm;
