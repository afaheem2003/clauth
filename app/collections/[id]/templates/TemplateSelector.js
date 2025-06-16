'use client'

import { useState } from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'
import { 
  ViewColumnsIcon, 
  PhotoIcon, 
  Squares2X2Icon, 
  DocumentTextIcon 
} from '@heroicons/react/24/outline'

// Preview Components
const GalleryPreview = ({ isSelected }) => (
  <div className="h-24 p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
    <div className="grid grid-cols-3 gap-2 h-full">
      <div className={`${isSelected ? 'bg-gradient-to-br from-blue-100 to-blue-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded-md shadow-sm`}></div>
      <div className={`${isSelected ? 'bg-gradient-to-br from-purple-100 to-purple-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded-md shadow-sm`}></div>
      <div className={`${isSelected ? 'bg-gradient-to-br from-green-100 to-green-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded-md shadow-sm`}></div>
    </div>
  </div>
)

const GridPreview = ({ isSelected }) => (
  <div className="h-24 p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
    <div className="grid grid-cols-4 gap-1.5 h-full">
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`${isSelected ? 'bg-gradient-to-br from-indigo-100 to-indigo-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded shadow-sm`}></div>
      ))}
    </div>
  </div>
)

const MinimalistPreview = ({ isSelected }) => (
  <div className="h-24 p-3 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
    <div className="space-y-3 h-full">
      <div className="flex gap-3 items-center h-8">
        <div className={`${isSelected ? 'bg-gradient-to-br from-rose-100 to-rose-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded w-12 h-full shadow-sm`}></div>
        <div className="flex-1 space-y-1.5">
          <div className={`${isSelected ? 'bg-gray-800' : 'bg-gray-400'} rounded-full h-2 w-3/4`}></div>
          <div className={`${isSelected ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-1.5 w-1/2`}></div>
        </div>
      </div>
      <div className="flex gap-3 items-center h-8">
        <div className="flex-1 space-y-1.5">
          <div className={`${isSelected ? 'bg-gray-800' : 'bg-gray-400'} rounded-full h-2 w-3/4`}></div>
          <div className={`${isSelected ? 'bg-gray-600' : 'bg-gray-300'} rounded-full h-1.5 w-1/2`}></div>
        </div>
        <div className={`${isSelected ? 'bg-gradient-to-br from-amber-100 to-amber-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded w-12 h-full shadow-sm`}></div>
      </div>
    </div>
  </div>
)

const MagazinePreview = ({ isSelected }) => (
  <div className="h-24 p-2 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
    <div className="space-y-2 h-full">
      <div className="flex gap-2 h-14">
        <div className={`${isSelected ? 'bg-gradient-to-br from-emerald-100 to-emerald-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded flex-1 shadow-sm`}></div>
        <div className="flex-1 space-y-1.5 py-1">
          <div className={`${isSelected ? 'bg-gray-900' : 'bg-gray-500'} rounded h-2.5 w-full`}></div>
          <div className={`${isSelected ? 'bg-gray-700' : 'bg-gray-400'} rounded h-1.5 w-4/5`}></div>
          <div className={`${isSelected ? 'bg-gray-600' : 'bg-gray-300'} rounded h-1.5 w-3/5`}></div>
          <div className={`${isSelected ? 'bg-gray-500' : 'bg-gray-300'} rounded h-1.5 w-2/5`}></div>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-1 h-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`${isSelected ? 'bg-gradient-to-br from-teal-100 to-teal-200' : 'bg-gradient-to-br from-gray-200 to-gray-300'} rounded-sm shadow-sm`}></div>
        ))}
      </div>
    </div>
  </div>
)

const TEMPLATES = [
  {
    id: 'gallery',
    name: 'Gallery',
    description: 'Visual focus with masonry layout',
    icon: PhotoIcon,
    preview: 'Perfect for showcasing images',
    PreviewComponent: GalleryPreview
  },
  {
    id: 'grid',
    name: 'Grid',
    description: 'Clean uniform squares',
    icon: Squares2X2Icon,
    preview: 'Organized and structured',
    PreviewComponent: GridPreview
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    description: 'Clean with lots of whitespace',
    icon: ViewColumnsIcon,
    preview: 'Simple and elegant',
    PreviewComponent: MinimalistPreview
  },
  {
    id: 'magazine',
    name: 'Magazine',
    description: 'Editorial style layout',
    icon: DocumentTextIcon,
    preview: 'Editorial presentation',
    PreviewComponent: MagazinePreview
  }
]

export default function TemplateSelector({ 
  currentTemplate, 
  onTemplateChange, 
  isOpen, 
  onClose 
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(currentTemplate)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleSave = async () => {
    if (selectedTemplate === currentTemplate) {
      onClose()
      return
    }

    setIsUpdating(true)
    try {
      await onTemplateChange(selectedTemplate)
      onClose()
    } catch (error) {
      console.error('Failed to update template:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-light text-gray-900">Choose Template</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {TEMPLATES.map((template) => {
              const Icon = template.icon
              const PreviewComponent = template.PreviewComponent
              const isSelected = selectedTemplate === template.id
              
              return (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-6 rounded-2xl border-2 transition-all duration-200 text-left relative group ${
                    isSelected 
                      ? 'border-black bg-gray-50 shadow-lg' 
                      : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <CheckIcon className="h-4 w-4 text-white" />
                    </div>
                  )}
                  
                  <div className="flex items-center mb-4">
                    <Icon className={`h-8 w-8 mr-3 ${
                      isSelected ? 'text-black' : 'text-gray-600 group-hover:text-gray-800'
                    }`} />
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        isSelected ? 'text-black' : 'text-gray-900'
                      }`}>
                        {template.name}
                      </h3>
                      <p className={`text-sm ${
                        isSelected ? 'text-gray-700' : 'text-gray-600'
                      }`}>
                        {template.description}
                      </p>
                    </div>
                  </div>

                  <p className={`text-sm mb-4 ${
                    isSelected ? 'text-gray-800' : 'text-gray-500'
                  }`}>
                    {template.preview}
                  </p>

                  {/* Template Preview */}
                  <div className="p-3 bg-white rounded-lg border border-gray-100">
                    <PreviewComponent isSelected={isSelected} />
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 hover:text-gray-900 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex items-center px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 font-medium"
            >
              {isUpdating ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Apply Template
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 