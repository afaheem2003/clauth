'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Switch as HeadlessSwitch } from '@headlessui/react'
import { 
  ArrowLeftIcon, 
  ShareIcon, 
  PencilIcon, 
  PhotoIcon, 
  XMarkIcon, 
  CheckIcon,
  PaintBrushIcon,
  ViewColumnsIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { 
  LockClosedIcon, 
  GlobeAltIcon, 
  ShoppingBagIcon 
} from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'

// Import template components
import MinimalistTemplate from './templates/MinimalistTemplate'
import GalleryTemplate from './templates/GalleryTemplate'
import GridTemplate from './templates/GridTemplate'
import MagazineTemplate from './templates/MagazineTemplate'
import TemplateSelector from './templates/TemplateSelector'

export default function CollectionDetailClient({ collection }) {
  const [isPublic, setIsPublic] = useState(collection.privacy === 'public')
  const [showBannerSettings, setShowBannerSettings] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [imageErrors, setImageErrors] = useState(new Set())
  const [imageLoading, setImageLoading] = useState(new Set())
  const [currentTemplate, setCurrentTemplate] = useState(collection.templateType || 'gallery')
  
  const [bannerSettings, setBannerSettings] = useState({
    type: collection.bannerType || 'gradient',
    image: collection.bannerImage || '',
    color: collection.bannerColor || '#667eea',
    gradientColors: collection.bannerGradient && Array.isArray(collection.bannerGradient) && collection.bannerGradient.length >= 2 
      ? collection.bannerGradient 
      : ['#667eea', '#764ba2']
  })

  // Add state for the actual hero background (separate from preview)
  const [heroBackground, setHeroBackground] = useState({
    type: collection.bannerType || 'gradient',
    image: collection.bannerImage || '',
    color: collection.bannerColor || '#667eea',
    gradientColors: collection.bannerGradient && Array.isArray(collection.bannerGradient) && collection.bannerGradient.length >= 2 
      ? collection.bannerGradient 
      : ['#667eea', '#764ba2']
  })

  const router = useRouter()

  // Debug the collection data
  useEffect(() => {
    console.log('Collection object:', collection)
    console.log('Collection name:', collection.name)
    console.log('Collection title:', collection.title)
  }, [collection])

  // Debug banner settings changes (only log when they actually change)
  const prevBannerSettings = useRef()
  useEffect(() => {
    // Track changes without logging
    prevBannerSettings.current = bannerSettings
  }, [bannerSettings])

  const handleImageError = (itemId, reason = 'Unknown') => {
    setImageErrors(prev => new Set([...prev, itemId]))
    setImageLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
  }

  const handleImageLoad = (itemId, event) => {
    // Check if image actually has content
    if (event.target.naturalWidth === 0 || event.target.naturalHeight === 0) {
      handleImageError(itemId, 'Zero dimensions')
      return
    }
    
    // Remove from loading state
    setImageLoading(prev => {
      const newSet = new Set(prev)
      newSet.delete(itemId)
      return newSet
    })
  }

  const getImageUrl = (item) => {
    if (!item) {
      return null
    }
    
    // Check frontImage first, then imageUrl
    let url = null
    if (item.frontImage && item.frontImage.trim() !== "") {
      url = item.frontImage.trim()
    } else if (item.imageUrl && item.imageUrl.trim() !== "") {
      url = item.imageUrl.trim()
    }
    
    if (!url) {
      return null
    }
    
    // Basic URL validation
    try {
      new URL(url)
      return url
    } catch (e) {
      return null
    }
  }

  const shouldShowImage = (item) => {
    const imageUrl = getImageUrl(item)
    const hasError = imageErrors.has(item.id)
    
    return imageUrl && !hasError
  }

  const handlePrivacyChange = async (value) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacy: value ? 'public' : 'private'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update privacy')
      }

      setIsPublic(value)
      toast.success(`Collection is now ${value ? 'public' : 'private'}`)
    } catch (error) {
      console.error('Error updating privacy:', error)
      toast.error('Failed to update privacy settings')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleTemplateChange = async (templateType) => {
    try {
      const response = await fetch(`/api/collections/${collection.id}/template`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ templateType })
      })

      if (!response.ok) {
        throw new Error('Failed to update template')
      }

      setCurrentTemplate(templateType)
      toast.success('Template updated successfully')
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
      throw error
    }
  }

  const saveBannerSettings = async () => {
    setIsUpdating(true)
    try {
      console.log('Saving banner settings:', {
        bannerType: bannerSettings.type,
        bannerImage: bannerSettings.image,
        bannerColor: bannerSettings.color,
        bannerGradient: bannerSettings.gradientColors
      })

      const response = await fetch(`/api/collections/${collection.id}/banner`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bannerType: bannerSettings.type,
          bannerImage: bannerSettings.image,
          bannerColor: bannerSettings.color,
          bannerGradient: bannerSettings.gradientColors
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('API Error:', errorData)
        throw new Error(`Failed to update banner: ${response.status}`)
      }

      const result = await response.json()
      console.log('API Response:', result)

      // Update the hero background with the new settings
      setHeroBackground({
        type: bannerSettings.type,
        image: bannerSettings.image,
        color: bannerSettings.color,
        gradientColors: bannerSettings.gradientColors
      })

      console.log('Hero background updated to:', {
        type: bannerSettings.type,
        color: bannerSettings.color
      })

      toast.success('Banner updated successfully')
      setShowBannerSettings(false)
      
      // Force a small delay to ensure state updates
      setTimeout(() => {
        console.log('Current hero background after save:', heroBackground)
      }, 100)

    } catch (error) {
      console.error('Error updating banner:', error)
      toast.error(`Failed to update banner: ${error.message}`)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleBannerImageUpload = async (file) => {
    if (!file) return

    const formData = new FormData()
    formData.append('banner', file)
    formData.append('collectionId', collection.id)

    try {
      const response = await fetch('/api/collections/banner/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setBannerSettings(prev => ({
        ...prev,
        image: result.imageUrl
      }))
      
      toast.success('Banner image uploaded successfully')
    } catch (error) {
      console.error('Error uploading banner:', error)
      toast.error('Failed to upload banner image')
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: collection.name,
        text: collection.description || collection.notes,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  const getHeroBackground = () => {
    switch (heroBackground.type) {
      case 'image':
        return heroBackground.image ? {
          backgroundImage: `url(${heroBackground.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        } : { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
      
      case 'color':
        return { backgroundColor: heroBackground.color }
      
      case 'gradient':
        return {
          background: `linear-gradient(135deg, ${heroBackground.gradientColors[0]} 0%, ${heroBackground.gradientColors[1]} 100%)`
        }
      
      default:
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
    }
  }

  // Helper function to get preview background based on current banner settings
  const getPreviewBackground = () => {
    switch (bannerSettings.type) {
      case 'image':
        if (bannerSettings.image) {
          return {
            backgroundImage: `url(${bannerSettings.image})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }
        }
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
      
      case 'color':
        return { backgroundColor: bannerSettings.color }
      
      case 'gradient':
        const gradient = `linear-gradient(135deg, ${bannerSettings.gradientColors[0]} 0%, ${bannerSettings.gradientColors[1]} 100%)`
        return { background: gradient }
      
      default:
        return { background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }
    }
  }

  const ColorPicker = ({ color, onChange }) => (
    <input
      type="color"
      value={color}
      onChange={(e) => onChange(e.target.value)}
      className="w-12 h-12 rounded-lg border-2 border-gray-300 cursor-pointer"
    />
  )

  const renderTemplate = () => {
    const templateProps = {
      collection,
      imageErrors,
      imageLoading,
      onImageError: handleImageError,
      onImageLoad: handleImageLoad,
      getImageUrl,
      shouldShowImage
    }

    switch (currentTemplate) {
      case 'minimalist':
        return <MinimalistTemplate {...templateProps} />
      case 'grid':
        return <GridTemplate {...templateProps} />
      case 'magazine':
        return <MagazineTemplate {...templateProps} />
      case 'gallery':
      default:
        return <GalleryTemplate {...templateProps} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              <span className="font-medium">Back</span>
            </button>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ViewColumnsIcon className="h-5 w-5 mr-2" />
                Template
              </button>

              <button
                onClick={() => setShowBannerSettings(true)}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <PhotoIcon className="h-5 w-5 mr-2" />
                Customize Banner
              </button>

              <button
                onClick={handleShare}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShareIcon className="h-5 w-5 mr-2" />
                Share
              </button>
              
              <button
                onClick={() => router.push(`/collections/${collection.id}/edit`)}
                className="flex items-center px-4 py-2 bg-gray-900 text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <PencilIcon className="h-5 w-5 mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div 
        className="relative h-96 flex items-center justify-center text-white overflow-hidden"
        style={getHeroBackground()}
      >
        {/* Only add overlay for image backgrounds, not solid colors or gradients */}
        {heroBackground.type === 'image' && heroBackground.image && (
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        )}
        
        <div className="relative z-10 text-center max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-black bg-opacity-50 backdrop-blur-sm border border-white border-opacity-30 text-white">
              ✨ {collection.purpose || 'Fashion Collection'}
            </span>
          </div>
          
          <h1 className="text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-2xl">
            {collection.name || collection.title || 'Collection'}
          </h1>
          
          <p className="text-xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed mb-8 text-white drop-shadow-lg">
            {collection.notes || collection.description || 'A carefully curated collection of fashion pieces designed to inspire and elevate your style'}
          </p>
          
          <div className="flex items-center justify-center space-x-8 text-sm font-medium">
            <div className="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full text-white">
              <span>{collection.items?.length || 0}</span>
              <span>pieces</span>
            </div>
            {collection.season && (
              <div className="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <span className="capitalize">{collection.season}</span>
              </div>
            )}
            {collection.style && (
              <div className="flex items-center space-x-2 bg-black bg-opacity-50 backdrop-blur-sm px-4 py-2 rounded-full text-white">
                <span className="capitalize">{collection.style}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Selector Modal */}
      <TemplateSelector
        currentTemplate={currentTemplate}
        onTemplateChange={handleTemplateChange}
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* Banner Settings Modal */}
      {showBannerSettings && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-light text-gray-900">Customize Banner</h2>
                <button
                  onClick={() => setShowBannerSettings(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Banner Type Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Banner Type</h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setBannerSettings(prev => ({ ...prev, type: 'gradient' }))}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center relative group ${
                      bannerSettings.type === 'gradient' 
                        ? 'border-black bg-gray-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {bannerSettings.type === 'gradient' && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 mx-auto mb-2 shadow-sm"></div>
                    <span className={`text-sm font-semibold ${
                      bannerSettings.type === 'gradient' ? 'text-black' : 'text-gray-700'
                    }`}>Gradient</span>
                  </button>

                  <button
                    onClick={() => setBannerSettings(prev => ({ ...prev, type: 'color' }))}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center relative group ${
                      bannerSettings.type === 'color' 
                        ? 'border-black bg-gray-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {bannerSettings.type === 'color' && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div 
                      className="w-10 h-10 rounded-xl mx-auto mb-2 shadow-sm border-2 border-white" 
                      style={{ backgroundColor: bannerSettings.color }}
                    ></div>
                    <span className={`text-sm font-semibold ${
                      bannerSettings.type === 'color' ? 'text-black' : 'text-gray-700'
                    }`}>Solid Color</span>
                  </button>

                  <button
                    onClick={() => setBannerSettings(prev => ({ ...prev, type: 'image' }))}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 text-center relative group ${
                      bannerSettings.type === 'image' 
                        ? 'border-black bg-gray-50 shadow-lg' 
                        : 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md'
                    }`}
                  >
                    {bannerSettings.type === 'image' && (
                      <div className="absolute top-3 right-3 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <CheckIcon className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div className="w-10 h-10 rounded-xl bg-gray-100 mx-auto mb-2 flex items-center justify-center shadow-sm border-2 border-gray-200">
                      <PhotoIcon className="h-5 w-5 text-gray-500" />
                    </div>
                    <span className={`text-sm font-semibold ${
                      bannerSettings.type === 'image' ? 'text-black' : 'text-gray-700'
                    }`}>Image</span>
                  </button>
                </div>
              </div>

              {/* Gradient Colors */}
              {bannerSettings.type === 'gradient' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Gradient Colors</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Color</label>
                      <div className="relative">
                        <input
                          type="color"
                          value={bannerSettings.gradientColors[0] || '#667eea'}
                          onChange={(e) => setBannerSettings(prev => ({
                            ...prev,
                            gradientColors: [e.target.value, prev.gradientColors[1] || '#764ba2']
                          }))}
                          className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
                        />
                        <div 
                          className="absolute top-1 left-1 w-10 h-10 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                          style={{ backgroundColor: bannerSettings.gradientColors[0] || '#667eea' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">End Color</label>
                      <div className="relative">
                        <input
                          type="color"
                          value={bannerSettings.gradientColors[1] || '#764ba2'}
                          onChange={(e) => setBannerSettings(prev => ({
                            ...prev,
                            gradientColors: [prev.gradientColors[0] || '#667eea', e.target.value]
                          }))}
                          className="w-full h-12 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
                        />
                        <div 
                          className="absolute top-1 left-1 w-10 h-10 rounded-lg border-2 border-white shadow-sm pointer-events-none"
                          style={{ backgroundColor: bannerSettings.gradientColors[1] || '#764ba2' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Solid Color */}
              {bannerSettings.type === 'color' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Banner Color</h3>
                  <div className="relative">
                    <input
                      type="color"
                      value={bannerSettings.color || '#667eea'}
                      onChange={(e) => {
                        setBannerSettings(prev => ({ ...prev, color: e.target.value }))
                      }}
                      className="w-full h-16 rounded-xl border-2 border-gray-200 cursor-pointer shadow-sm"
                    />
                    <div 
                      className="absolute top-2 left-2 w-12 h-12 rounded-xl border-2 border-white shadow-sm pointer-events-none"
                      style={{ backgroundColor: bannerSettings.color }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Image Upload */}
              {bannerSettings.type === 'image' && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Image</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBannerImageUpload(e.target.files[0])}
                      className="hidden"
                      id="banner-upload"
                    />
                    <label htmlFor="banner-upload" className="cursor-pointer">
                      <PhotoIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <p className="text-base font-medium text-gray-700 mb-1">Click to upload image</p>
                      <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
                    </label>
                  </div>
                  {bannerSettings.image && (
                    <div className="mt-4">
                      <img
                        src={bannerSettings.image}
                        alt="Banner preview"
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Live Preview */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
                <div 
                  className="h-32 rounded-2xl flex items-center justify-center text-white relative overflow-hidden shadow-lg border-2 border-gray-200"
                  style={getPreviewBackground()}
                >
                  {/* Only add overlay for image backgrounds, not solid colors */}
                  {bannerSettings.type === 'image' && bannerSettings.image && (
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                  )}
                  <div className="relative z-10 text-center px-4">
                    <h4 className="text-xl font-bold text-white drop-shadow-lg mb-1">{collection.name || collection.title || 'Collection'}</h4>
                    <p className="text-base text-white/90 drop-shadow font-medium">{collection.items?.length || 0} pieces</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBannerSettings(false)}
                  className="flex-1 px-4 py-3 text-gray-700 hover:text-gray-900 font-semibold transition-colors border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBannerSettings}
                  disabled={isUpdating}
                  className="flex-1 px-4 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50 font-semibold shadow-lg disabled:cursor-not-allowed"
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Controls */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {isPublic ? (
                <GlobeAltIcon className="h-5 w-5 text-green-600 mr-3" />
              ) : (
                <LockClosedIcon className="h-5 w-5 text-gray-600 mr-3" />
              )}
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {isPublic ? 'Public Collection' : 'Private Collection'}
                </h3>
                <p className="text-sm text-gray-500">
                  {isPublic 
                    ? 'Anyone can view this collection' 
                    : 'Only you can view this collection'
                  }
                </p>
              </div>
            </div>
            
            <HeadlessSwitch
              checked={isPublic}
              onChange={handlePrivacyChange}
              disabled={isUpdating}
              className={`${
                isPublic ? 'bg-green-600' : 'bg-gray-200'
              } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50`}
            >
              <span
                className={`${
                  isPublic ? 'translate-x-6' : 'translate-x-1'
                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
              />
            </HeadlessSwitch>
          </div>
        </div>
      </div>

      {/* Template Content */}
      {renderTemplate()}

      {/* Footer Stats */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-light text-gray-900 mb-2">
                {collection.items?.length || 0}
              </div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                Total Pieces
              </div>
            </div>
            
            <div>
              <div className="text-3xl font-light text-gray-900 mb-2">
                {collection.occasions?.length || 1}
              </div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                Occasions
              </div>
            </div>
            
            <div>
              <div className="text-3xl font-light text-gray-900 mb-2">
                {collection.colorPalette?.length || 0}
              </div>
              <div className="text-sm font-medium text-gray-600 uppercase tracking-wider">
                Colors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}