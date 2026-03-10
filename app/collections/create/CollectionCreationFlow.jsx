'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

import PurposeAndStyle from './steps/PurposeAndStyle'
import DetailsAndPersonality from './steps/DetailsAndPersonality'
import InitialCuration from './steps/InitialCuration'
import OrganizationAndNotes from './steps/OrganizationAndNotes'
import FinalTouchAndShare from './steps/FinalTouchAndShare'

const steps = [
  { id: 1, title: 'Purpose & Style', component: PurposeAndStyle },
  { id: 2, title: 'Details', component: DetailsAndPersonality },
  { id: 3, title: 'Curation', component: InitialCuration },
  { id: 4, title: 'Review', component: OrganizationAndNotes },
  { id: 5, title: 'Share', component: FinalTouchAndShare },
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
    if (showValidation) setShowValidation(false)
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.purpose && formData.style
      case 2: return formData.name?.trim() && formData.seasons && formData.seasons.length > 0
      default: return true
    }
  }

  const nextStep = () => {
    if (canProceed()) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1)
        setShowValidation(false)
      }
    } else {
      setShowValidation(true)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1)
  }

  const handleComplete = async () => {
    setIsCreating(true)
    try {
      const response = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        const collection = await response.json()
        router.push(`/collections/create/confirmation?id=${collection.id}`)
      } else {
        throw new Error('Failed to create collection')
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Failed to create collection. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const CurrentStepComponent = steps[currentStep - 1].component

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-10">
          <p className="text-xs font-medium tracking-widest uppercase text-gray-400 mb-2">New Collection</p>
          <h1 className="text-3xl font-light text-gray-900 tracking-tight">
            {steps[currentStep - 1].title}
          </h1>
        </div>
      </div>

      {/* Step progress */}
      <div className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`flex-1 py-4 text-center border-b-2 transition-colors ${
                  step.id === currentStep
                    ? 'border-gray-900 text-gray-900'
                    : step.id < currentStep
                    ? 'border-gray-300 text-gray-400'
                    : 'border-transparent text-gray-300'
                }`}
              >
                <span className="text-xs font-medium tracking-widest uppercase">
                  {step.id}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <CurrentStepComponent
              formData={formData}
              updateFormData={updateFormData}
              user={user}
              showValidation={showValidation}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-6 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="text-xs font-medium tracking-widest uppercase text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-300 tracking-widest">
              {currentStep} / {steps.length}
            </span>
            <button
              onClick={currentStep === steps.length ? handleComplete : nextStep}
              disabled={isCreating}
              className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isCreating
                ? 'Creating...'
                : currentStep === steps.length
                ? 'Create Collection'
                : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
