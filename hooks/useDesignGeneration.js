import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useDesignGeneration() {
  const { data: session } = useSession()
  const [currentDesign, setCurrentDesign] = useState({
    aiDescription: '',
    frontImage: null,
    backImage: null,
    compositeImage: null
  })
  const [designHistory, setDesignHistory] = useState([])
  const [generationsUsed, setGenerationsUsed] = useState(0)
  const [loadingStates, setLoadingStates] = useState({
    image: false,
    description: false,
    regenerating: false
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Helper function to extract color from prompt
  const extractColorFromPrompt = useCallback((prompt) => {
    const colorWords = [
      'black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'brown', 'gray', 'grey', 
      'orange', 'navy', 'maroon', 'teal', 'gold', 'silver', 'beige', 'tan', 'olive', 'burgundy',
      'turquoise', 'lime', 'coral', 'salmon', 'lavender', 'mint', 'cream', 'charcoal', 'royal blue',
      'forest green', 'hot pink', 'bright red', 'dark blue', 'light blue', 'pale pink'
    ];
    
    
    const lowerPrompt = prompt.toLowerCase();
    for (const color of colorWords) {
      if (lowerPrompt.includes(color)) {
        return color;
      }
    }
    
    // Check for color patterns like "red and white" or "blue with yellow"
    const colorPattern = /\b(red|blue|green|yellow|purple|pink|brown|gray|grey|orange|navy|maroon|teal|gold|silver|beige|tan|olive|burgundy|turquoise|lime|coral|salmon|lavender|mint|cream|charcoal|black|white)\b/i;
    const match = lowerPrompt.match(colorPattern);
    return match ? match[1] : null;
  }, [])

  const generateDesign = useCallback(async (params = {}) => {
    // Clear previous messages
    setError('')
    setSuccess('')
    
    setLoadingStates(prev => ({ ...prev, image: true, description: true }))

    try {
      // Check if this is an editing request
      const isEditing = params.isEditing || params.originalImage || params.frontImage || params.backImage
      
      if (isEditing) {
        // Enhanced edit mode with better error handling
        console.log('Edit mode: applying changes to existing design')
        
        // Determine which images to send based on what we have
        // The inpainting endpoint expects EITHER composite OR front+back, not both
        const hasIndividualImages = currentDesign.frontImage && currentDesign.backImage;
        const hasCompositeOnly = currentDesign.compositeImage && !hasIndividualImages;
        
        // Debug logging to see what's being passed
        console.log('[DEBUG] Edit params:', {
          originalImage: params.originalImage ? 'present' : 'missing',
          frontImage: params.frontImage ? 'present' : 'missing', 
          backImage: params.backImage ? 'present' : 'missing',
          currentDesign: {
            compositeImage: currentDesign.compositeImage ? 'present' : 'missing',
            frontImage: currentDesign.frontImage ? 'present' : 'missing',
            backImage: currentDesign.backImage ? 'present' : 'missing'
          }
        })
        
        console.log('[DEBUG] Image selection logic:', {
          hasIndividualImages,
          hasCompositeOnly,
          willSendComposite: hasCompositeOnly,
          willSendIndividual: hasIndividualImages
        })
        
        const editPayload = {
          // Send either composite OR front+back images, not both
          originalImage: hasCompositeOnly ? (params.originalImage || currentDesign.compositeImage) : undefined,
          frontImage: hasIndividualImages ? (params.frontImage || currentDesign.frontImage) : undefined,
          backImage: hasIndividualImages ? (params.backImage || currentDesign.backImage) : undefined,
          prompt: params.prompt || params.userPrompt || '',
          quality: params.quality || 'medium',
          targetQuality: params.targetQuality || params.quality || 'medium',
          userId: params.userSession?.user?.id || params.userSession?.user?.uid || session?.user?.id || session?.user?.uid,
          originalDescription: currentDesign.aiDescription || '',
          isQualityUpgrade: !params.prompt && !params.userPrompt && params.targetQuality !== params.quality,
          isWaitlistApplication: params.isWaitlistApplication || false
        }
        
        console.log('[DEBUG] Final edit payload:', {
          ...editPayload,
          originalImage: editPayload.originalImage ? 'present' : 'missing',
          frontImage: editPayload.frontImage ? 'present' : 'missing',
          backImage: editPayload.backImage ? 'present' : 'missing',
          prompt: editPayload.prompt ? `"${editPayload.prompt}"` : 'empty',
          isQualityUpgrade: editPayload.isQualityUpgrade
        })
        
        const editResponse = await fetch('/api/design/inpaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editPayload)
        })

        const editData = await editResponse.json()

        if (!editResponse.ok) {
          // Better error messages for edit failures with specific guidance
          if (editResponse.status === 400 && editData.error?.includes('safety system')) {
            throw new Error('Your edit request was flagged by our content safety system. Please try with simpler edit instructions, avoid brand names, and use more general terms.')
          } else if (editResponse.status === 429) {
            throw new Error('Rate limit reached. Please try again in a few minutes.')
          } else if (editResponse.status >= 500) {
            throw new Error('Our service is temporarily unavailable. Please try again in a few minutes.')
          }
          throw new Error(editData.error || 'Edit failed. Please try a different instruction or regenerate the design.')
        }

        // Apply edit successfully
        const editedDesign = {
          aiDescription: editData.aiDescription || currentDesign.aiDescription,
          frontImage: editData.angleUrls?.front || editData.frontImage,
          backImage: editData.angleUrls?.back || editData.backImage,
          compositeImage: editData.compositeImage,
          // Additional properties for history tracking
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: currentDesign.prompt + ` (Edited: ${params.prompt || params.userPrompt})`,
          quality: params.targetQuality || params.quality || 'medium',
          timestamp: new Date()
        }

        setCurrentDesign(editedDesign)
        setDesignHistory(prev => [...prev, editedDesign])
        setGenerationsUsed(prev => prev + 1)
        
        // Call refreshUsageStats if provided
        if (params.refreshUsageStats) {
          await params.refreshUsageStats()
        }
        
        // Also dispatch global event to update nav bar credits
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('creditsUpdated'));
        }
        
        setSuccess('Design edited successfully!')
        return editedDesign
      } else {
        // Regular generation with improved error handling
        const response = await fetch('/api/design/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            itemType: params.itemType || '',
            itemTypeSpecific: params.itemType || '',
            gender: params.gender || 'UNISEX',
            color: params.color || extractColorFromPrompt(params.userPrompt || '') || 'default',
            userPrompt: params.userPrompt || '',
            modelDescription: params.modelDescription || '',
            userId: params.userSession?.user?.id || params.userSession?.user?.uid || session?.user?.id || session?.user?.uid,
            quality: params.quality || 'medium',
            isWaitlistApplication: params.isWaitlistApplication || false
          })
        })

        const data = await response.json()

        if (!response.ok) {
          // Enhanced error handling with specific messages
          if (response.status === 400 && data.error?.includes('safety system')) {
            throw new Error('Your design description was flagged by our content safety system. Please try with simpler language, avoid brand names, and use more general clothing terms.')
          } else if (response.status === 429) {
            throw new Error('Our AI service is busy right now. Please wait a moment before trying again.')
          } else if (response.status >= 500) {
            throw new Error('Our service is temporarily unavailable. Please try again in a few minutes.')
          } else if (data.error?.includes('OpenAI')) {
            throw new Error('AI service temporarily unavailable. Please retry with simpler language.')
          } else if (data.error?.includes('timeout')) {
            throw new Error('Generation is taking longer than expected. Please try again with simpler language.')
          }
          throw new Error(data.error || 'Generation failed. Please try again with different wording.')
        }

        const newDesign = {
          aiDescription: data.aiDescription,
          frontImage: data.angleUrls?.front || data.frontImage,
          backImage: data.angleUrls?.back || data.backImage,
          compositeImage: data.compositeImage,
          // Additional properties for history tracking
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          prompt: params.userPrompt || '',
          quality: params.quality || 'medium',
          timestamp: new Date()
        }

        setCurrentDesign(newDesign)
        setDesignHistory(prev => [...prev, newDesign])
        setGenerationsUsed(prev => prev + 1)
        
        // Call refreshUsageStats if provided
        if (params.refreshUsageStats) {
          await params.refreshUsageStats()
        }
        
        // Also dispatch global event to update nav bar credits
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('creditsUpdated'));
        }
        
        setSuccess('Design generated successfully!')
        return newDesign
      }

    } catch (err) {
      console.error('Generation error:', err)
      const errorMessage = err.message || 'Failed to generate design'
      setError(errorMessage)
      setSuccess('') // Clear any success message when error occurs
      // Clear all loading states on error so user isn't stuck
      setLoadingStates({ image: false, description: false, regenerating: false })
      throw err // Re-throw so calling code can handle it
    } finally {
      // Ensure loading states are always cleared
      setLoadingStates(prev => ({ ...prev, image: false, description: false }))
    }
  }, [session?.user?.id, session?.user?.uid, currentDesign, extractColorFromPrompt])

  const clearError = useCallback(() => setError(''), [])
  const clearSuccess = useCallback(() => setSuccess(''), [])

  return {
    // State
    currentDesign,
    setCurrentDesign,
    designHistory,
    setDesignHistory,
    generationsUsed,
    setGenerationsUsed,
    loadingStates,
    setLoadingStates,
    error,
    success,
    
    // Actions
    generateDesign,
    clearError,
    clearSuccess,
    setError,
    setSuccess,
    extractColorFromPrompt
  }
} 