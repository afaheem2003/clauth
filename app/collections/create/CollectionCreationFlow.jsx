'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

export default function CollectionCreationFlow({ user }) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [showValidation, setShowValidation] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    purpose: '',
    style: '',
    name: '',
    seasons: [],
    occasions: [],
    colorPalette: [],
    items: [],
    privacy: 'private',
    notes: ''
  })

  const updateFormData = (data) => {
    setFormData(prev => ({ ...prev, ...data }))
    if (showValidation) {
      setShowValidation(false)
    }
  }

  // Validation function for required fields
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return formData.purpose && formData.style
      case 2:
        return formData.seasons && formData.seasons.length > 0
      default:
        return true
    }
  }

  const nextStep = () => {
    if (canProceedToNextStep()) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
        setShowValidation(false)
      }
    } else {
      setShowValidation(true)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsCreating(true)
    try {
      // TODO: Implement API call to create collection
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const collection = await response.json()
        // Redirect to confirmation page with collection ID
        router.push(`/collections/create/confirmation?id=${collection.id}`)
      } else {
        throw new Error('Failed to create collection')
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      // TODO: Show error message to user
      alert('Failed to create collection. Please try again.')
    } finally {
      setIsCreating(false)
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
            showValidation={showValidation}
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
          onClick={currentStep === steps.length ? handleComplete : nextStep}
          disabled={isCreating || (currentStep !== steps.length && !canProceedToNextStep())}
          className={`flex items-center px-4 py-2 rounded-md transition-colors
            ${
              isCreating || (currentStep !== steps.length && !canProceedToNextStep())
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
          {isCreating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </>
          ) : (
            <>
              {currentStep === steps.length ? 'Create Collection' : 'Next'}
              {currentStep !== steps.length && (
                <ChevronRightIcon className="h-5 w-5 ml-2" />
              )}
            </>
          )}
        </button>
      </div>
    </div>
  )
} 