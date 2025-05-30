'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

// Step Components
import PurposeAndStyle from './steps/PurposeAndStyle'
import DetailsAndPersonality from './steps/DetailsAndPersonality'
import InitialCuration from './steps/InitialCuration'
import OrganizationAndNotes from './steps/OrganizationAndNotes'
import FinalTouchAndShare from './steps/FinalTouchAndShare'

const steps = [
  { id: 1, title: 'Purpose & Style', component: PurposeAndStyle },
  { id: 2, title: 'Details & Personality', component: DetailsAndPersonality },
  { id: 3, title: 'Initial Curation', component: InitialCuration },
  { id: 4, title: 'Organization & Notes', component: OrganizationAndNotes },
  { id: 5, title: 'Final Touch & Share', component: FinalTouchAndShare },
]

export default function WardrobeCreationFlow({ user }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    purpose: '',
    style: '',
    name: '',
    season: '',
    occasions: [],
    colorPalette: [],
    items: [],
    privacy: 'private',
    notes: '',
    collections: []
  })

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center ${
                step.id === currentStep
                  ? 'text-blue-600'
                  : step.id < currentStep
                  ? 'text-green-600'
                  : 'text-gray-400'
              }`}
            >
              <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 
                ${
                  step.id === currentStep
                    ? 'border-blue-600 bg-blue-50'
                    : step.id < currentStep
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300'
                }`}
              >
                {step.id}
              </div>
              <span className="ml-2 text-sm font-medium hidden sm:block">
                {step.title}
              </span>
              {step.id !== steps.length && (
                <div className="hidden sm:block w-full bg-gray-200 h-0.5 mx-4" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-sm p-6"
        >
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            user={user}
          />
        </motion.div>
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className={`flex items-center px-4 py-2 rounded-md 
            ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-300'
            }`}
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Previous
        </button>
        <button
          onClick={nextStep}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {currentStep === steps.length ? 'Complete' : 'Next'}
          {currentStep !== steps.length && (
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          )}
        </button>
      </div>
    </div>
  )
} 