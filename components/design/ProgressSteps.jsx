'use client';

export default function ProgressSteps({ steps, currentStep }) {
  return (
    <div className="mb-12">
      <div className="flex justify-between items-center relative">
        {/* Add a connecting line behind the steps */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" />
        
        {steps.map((step, index) => (
          <div key={step.number} className="flex-1 relative flex justify-center">
            <div className="flex flex-col items-center relative bg-white">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                currentStep >= step.number 
                  ? 'bg-black border-black text-white' 
                  : 'bg-white border-gray-300 text-gray-500'
              }`}>
                {step.number}
              </div>
              <div className="mt-2 text-center">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 