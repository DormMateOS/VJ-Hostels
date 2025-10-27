import { motion } from 'framer-motion';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const progress = (currentStep / totalSteps) * 100;
  
  const steps = [
    { number: 1, title: 'Student Details' },
    { number: 2, title: 'Rules & Undertaking' },
    { number: 3, title: 'Review & Submit' }
  ];

  return (
    <div className="mb-8">
      {/* Progress Bar */}
      <div className="relative">
        <div className="flex mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
        
        {/* Step Indicators */}
        <div className="flex justify-between">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center">
              <motion.div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  currentStep >= step.number
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
                initial={{ scale: 0.8 }}
                animate={{ 
                  scale: currentStep === step.number ? 1.1 : 1,
                  backgroundColor: currentStep >= step.number ? '#2563eb' : '#d1d5db'
                }}
                transition={{ duration: 0.3 }}
              >
                {currentStep > step.number ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </motion.div>
              <span className={`mt-2 text-xs font-medium ${
                currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.title}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Current Step Info */}
      <div className="text-center mt-4">
        <span className="text-sm text-gray-600">
          Step {currentStep} of {totalSteps}
        </span>
        <div className="text-lg font-semibold text-gray-800 mt-1">
          {steps[currentStep - 1]?.title}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
