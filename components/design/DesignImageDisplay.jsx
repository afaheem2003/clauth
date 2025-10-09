import { useState } from 'react'
import Image from 'next/image'

export default function DesignImageDisplay({ 
  currentDesign, 
  loadingStates, 
  className = "aspect-[683/1024]",
  showQualityIndicator = true,
  quality = 'low', // Current quality level
  onQualityUpgrade = null, // Function to handle quality upgrades
  creditsAvailable = null, // Object with available credits (e.g., { studio: 2, runway: 1 })
  designHistory = [] // Array of all designs to check if higher quality versions exist
}) {
  const [currentView, setCurrentView] = useState('front')

  if (loadingStates.image) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <div className="text-sm text-gray-500">Generating your design...</div>
        </div>
      </div>
    )
  }

  if (!currentDesign) {
    return (
      <div className={`${className} bg-gray-50 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200`}>
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">🎨</div>
          <div className="text-sm">Your design will appear here</div>
        </div>
      </div>
    )
  }

  // Helper function to get quality display info
  const getQualityInfo = (qualityLevel) => {
    switch(qualityLevel) {
      case 'low': return { icon: '✏️', name: 'Sketch Quality', color: 'text-orange-600' };
      case 'medium': return { icon: '🎨', name: 'Studio Quality', color: 'text-blue-600' };
      case 'high': return { icon: '✨', name: 'Runway Quality', color: 'text-purple-600' };
      // Waitlist page quality levels
      case 'studio': return { icon: '🎨', name: 'Studio Quality', color: 'text-blue-600' };
      case 'runway': return { icon: '✨', name: 'Runway Quality', color: 'text-purple-600' };
      default: return { icon: '✏️', name: 'Sketch Quality', color: 'text-orange-600' };
    }
  }

  // Get available upgrade options
  const getUpgradeOptions = () => {
    const upgrades = [];
    
    // Design page quality system (low/medium/high)
    if (quality === 'low') {
      upgrades.push({ level: 'medium', display: 'Studio', icon: '🎨', color: 'hover:bg-blue-50 hover:border-blue-300', gradient: 'from-blue-500 to-blue-600' });
      upgrades.push({ level: 'high', display: 'Runway', icon: '✨', color: 'hover:bg-purple-50 hover:border-purple-300', gradient: 'from-purple-500 to-purple-600' });
    } else if (quality === 'medium') {
      upgrades.push({ level: 'high', display: 'Runway', icon: '✨', color: 'hover:bg-purple-50 hover:border-purple-300', gradient: 'from-purple-500 to-purple-600' });
    }
    
    // Waitlist page quality system (studio/runway) - only show upgrade if credits are exhausted AND no higher quality design exists
    if (quality === 'studio') {
      // Check if a Runway design already exists in the history
      const hasRunwayDesign = designHistory.some(design => 
        design.quality === 'runway' || design.quality === 'high'
      );
      
      // Only show runway upgrade if:
      // 1. Runway credits are exhausted (>= 1 used means all used) AND
      // 2. No Runway design already exists in history
      if ((!creditsAvailable || creditsAvailable.runway >= 1) && !hasRunwayDesign) {
        upgrades.push({ level: 'runway', display: 'Runway', icon: '✨', color: 'hover:bg-purple-50 hover:border-purple-300', gradient: 'from-purple-500 to-purple-600' });
      }
    }
    
    return upgrades;
  }

  const upgradeOptions = getUpgradeOptions();
  const currentQualityInfo = getQualityInfo(quality);

  return (
    <div className="relative">
      <div className={`relative ${className} bg-gray-100 rounded-lg overflow-hidden shadow-md`}>
        <Image
          src={currentView === 'front' 
            ? (currentDesign.frontImage || '/images/placeholder-front.png') 
            : (currentDesign.backImage || '/images/placeholder-back.png')
          }
          alt={`${currentView} view`}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      
      {/* Navigation arrows - only show when both images exist */}
      {currentDesign.frontImage && currentDesign.backImage && (
        <>
          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
              className="bg-black/70 hover:bg-black/90 rounded-full p-3 shadow-lg transition-all duration-200 ml-3"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'front' ? 'back' : 'front')}
              className="bg-black/70 hover:bg-black/90 rounded-full p-3 shadow-lg transition-all duration-200 mr-3"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* View indicator */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'front' ? 'bg-white' : 'bg-white/50'}`}></div>
              <div className={`w-2 h-2 rounded-full transition-all duration-200 ${currentView === 'back' ? 'bg-white' : 'bg-white/50'}`}></div>
            </div>
          </div>
        </>
      )}
      
      {/* Quality indicator and upgrade buttons */}
      {showQualityIndicator && currentDesign && (
        <div className="mt-4 text-center">
          {/* Current quality indicator */}
          <p className="text-sm font-medium mb-3">
            <span className={currentQualityInfo.color}>
              {currentQualityInfo.icon} {currentQualityInfo.name}
            </span>
          </p>
          
          {/* Quality upgrade buttons */}
          {upgradeOptions.length > 0 && onQualityUpgrade && (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Upgrade Quality</p>
              <div className="flex justify-center gap-2">
                {upgradeOptions.map((upgrade) => (
                  <button
                    key={upgrade.level}
                    type="button"
                    onClick={() => onQualityUpgrade(upgrade.level)}
                    disabled={loadingStates.image}
                    className={`
                      relative overflow-hidden
                      px-4 py-2 rounded-lg
                      text-sm font-medium text-white
                      bg-gradient-to-r ${upgrade.gradient}
                      shadow-md hover:shadow-lg
                      transform hover:scale-105
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                      border border-transparent
                      focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                    `}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-base">{upgrade.icon}</span>
                      <span>Upgrade to {upgrade.display}</span>
                    </div>
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 -top-10 -left-10 bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 transition-transform duration-700 hover:translate-x-full"></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 