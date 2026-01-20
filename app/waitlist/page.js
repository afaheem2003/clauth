'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import NextImage from 'next/image'
import { CLOTHING_CATEGORIES } from '@/app/constants/clothingCategories'
import { useDesignGeneration } from '@/hooks/useDesignGeneration'
import DesignImageDisplay from '@/components/design/DesignImageDisplay'
import DesignMessages from '@/components/design/DesignMessages'
import ItemTypeSelector from '@/components/design/ItemTypeSelector'
import ImageCropper from '@/components/design/ImageCropper'

export default function WaitlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // #region agent log
  useEffect(() => {
    fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:16',message:'WaitlistPage component mounted/rendered',data:{status,hasSession:!!session,userRole:session?.user?.role,timestamp:new Date().toISOString()},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
  })
  // #endregion
  
  // Feature flag: Check if AI generation is enabled
  // Default to false so AI features are hidden until API confirms they're enabled
  const [aiGenerationEnabled, setAiGenerationEnabled] = useState(false)
  const [waitlistEnabled, setWaitlistEnabled] = useState(true)
  const hasLoadedProgress = useRef(false)
  
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:27',message:'Feature flags fetch started',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    // Check server-side feature flags
    fetch('/api/waitlist/feature-flags')
      .then(res => res.json())
      .then(data => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:30',message:'Feature flags received',data:{aiGenerationEnabled:data.aiGenerationEnabled,waitlistEnabled:data.waitlistEnabled},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setAiGenerationEnabled(data.aiGenerationEnabled === true)
        setWaitlistEnabled(data.waitlistEnabled !== false) // Default to true if not specified
      })
      .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:34',message:'Feature flags fetch failed',data:{error:err?.message},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setAiGenerationEnabled(false)
        setWaitlistEnabled(true)
      })
  }, [])
  
  // Use shared design generation hook
  const {
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
    generateDesign,
    clearError,
    clearSuccess,
    setError,
    setSuccess,
    extractColorFromPrompt
  } = useDesignGeneration()
  
  const [step, setStep] = useState(0) // 0: How it Works, 1: Input, 2: Generate/Edit, 3: Referrals, 4: Confirmation
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProgress, setIsLoadingProgress] = useState(false)
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false) // Track if user has tried to submit
  
  // Quality tracking - 2 Studio (medium) + 1 Runway (high)
  const [qualitiesUsed, setQualitiesUsed] = useState({
    studio: 0,  // medium quality generations
    runway: 0   // high quality generations
  })
  const [selectedQuality, setSelectedQuality] = useState('studio') // User-selected quality for next generation
  
  // Upload mode state - toggle between AI generation and user uploads
  // Force upload mode if AI generation is disabled
  const [uploadMode, setUploadMode] = useState(!aiGenerationEnabled)
  const [uploadedFrontImage, setUploadedFrontImage] = useState(null)
  const [uploadedBackImage, setUploadedBackImage] = useState(null)
  const [uploadValidationMessages, setUploadValidationMessages] = useState({ front: '', back: '' })
  const [uploadValidating, setUploadValidating] = useState({ front: false, back: false })
  
  // Image cropper state
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    image: null,
    type: null // 'front' or 'back'
  })
  
  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    selectedCategory: '',
    itemType: '',
    gender: 'UNISEX',
    referralCodes: ['', '', ''],
    modelDescription: '',
    remainingOutfit: '',
    editInstructions: ''
  })

  // Redirect if already approved or admin
  // Admins should always bypass waitlist, regardless of waitlist mode
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:103',message:'Redirect useEffect triggered',data:{status,hasSession:!!session,userRole:session?.user?.role,userStatus:session?.user?.waitlistStatus,waitlistEnabled,sessionEmail:session?.user?.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    if (status !== 'loading') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:106',message:'Status is not loading, checking admin',data:{isAdmin:session?.user?.role==='ADMIN',role:session?.user?.role},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B'})}).catch(()=>{});
      // #endregion
      // Always redirect admins
      if (session?.user?.role === 'ADMIN') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:109',message:'ADMIN REDIRECT TRIGGERED - Calling router.push',data:{role:session.user.role,email:session.user.email},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
        router.push('/')
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:112',message:'router.push called, returning',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
        return
      }
      // Redirect approved users only if waitlist mode is enabled
      if (waitlistEnabled && session?.user?.waitlistStatus === 'APPROVED') {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ee61a447-aaff-48fb-9929-56461307e2f0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'waitlist/page.js:119',message:'Approved user redirect triggered',data:{waitlistStatus:session.user.waitlistStatus},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,C'})}).catch(()=>{});
        // #endregion
        router.push('/')
      }
    }
  }, [session, waitlistEnabled, status, router])

  // Progress saving and loading (skip for admins since they'll be redirected)
  useEffect(() => {
    if (session?.user?.uid && !hasLoadedProgress.current && session?.user?.role !== 'ADMIN') {
      hasLoadedProgress.current = true
      loadProgress()
    }
  }, [session?.user?.uid, session?.user?.role])

  // Handle click outside for dropdown menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      const menu = document.getElementById('reset-menu');
      const button = event.target.closest('[data-menu-trigger]');
      if (menu && !menu.contains(event.target) && !button) {
        menu.classList.add('hidden');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [])

  // Force upload mode when AI generation is disabled
  useEffect(() => {
    if (!aiGenerationEnabled) {
      setUploadMode(true)
    }
  }, [aiGenerationEnabled])
  
  // Auto-select runway when studio is no longer available
  useEffect(() => {
    if (qualitiesUsed.studio >= 2 && qualitiesUsed.runway < 1 && selectedQuality === 'studio') {
      setSelectedQuality('runway')
      console.log('Auto-selected Runway quality since Studio is no longer available')
    }
  }, [qualitiesUsed.studio, qualitiesUsed.runway, selectedQuality])

  // Save progress whenever state changes (debounced)
  useEffect(() => {
    if (session?.user?.uid && (step > 1 || generationsUsed > 0)) {
      const timeoutId = setTimeout(() => {
        saveProgress()
      }, 1000) // Debounce for 1 second
      
      return () => clearTimeout(timeoutId)
    }
  }, [session?.user?.uid, step, generationsUsed, currentDesign, designHistory, formData, qualitiesUsed, selectedQuality, uploadMode, uploadedFrontImage, uploadedBackImage])

  const saveProgress = async () => {
    if (!session?.user?.uid) return
    
    const progressData = {
      step,
      generationsUsed,
      currentDesign,
      designHistory,
      qualitiesUsed,
      selectedQuality,
      formData,
      uploadMode,
      uploadedFrontImage,
      uploadedBackImage
    }
    
    try {
      const response = await fetch('/api/waitlist/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.includes('application already submitted')) {
          // User has submitted an application, redirect to status page
          router.push('/waitlist-status')
          return
        }
        throw new Error(errorData.error || 'Failed to save progress')
      }
      
      console.log('Progress saved to database')
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const loadProgress = async () => {
    if (!session?.user?.uid) return
    
    setIsLoadingProgress(true)
    try {
      const response = await fetch('/api/waitlist/progress')
      
      if (!response.ok) {
        throw new Error('Failed to load progress')
      }
      
      const data = await response.json()
      
      if (data.hasSubmittedApplication) {
        // User has already submitted an application, redirect to status page
        setIsLoadingProgress(false) // Set loading to false before redirect
        router.push('/waitlist-status')
        return
      }
      
      if (data.progress) {
        const progressData = data.progress
        // Skip How it Works if user has made progress
        const targetStep = Math.max(progressData.step || 0, progressData.generationsUsed > 0 ? 1 : 0)
        setStep(targetStep)
        setGenerationsUsed(progressData.generationsUsed || 0)
        // Ensure designs have proper unique IDs
        const historyWithIds = (progressData.designHistory || []).map((design, index) => ({
          ...design,
          id: design.id || `design-loaded-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`
        }));
        
        // Ensure current design matches one in history
        let currentDesignWithId = null;
        if (progressData.currentDesign && historyWithIds.length > 0) {
          // Try to find the current design in history
          const currentInHistory = historyWithIds.find(d => {
            const currentUrl = progressData.currentDesign.frontImage || progressData.currentDesign.compositeImage || progressData.currentDesign.imageUrl;
            const historyUrl = d.frontImage || d.compositeImage || d.imageUrl;
            return currentUrl === historyUrl;
          });
          
          if (currentInHistory) {
            currentDesignWithId = currentInHistory;
          } else {
            // Current design not in history, use the latest from history
            currentDesignWithId = historyWithIds[historyWithIds.length - 1];
          }
        }
        
        setCurrentDesign(currentDesignWithId)
        setDesignHistory(historyWithIds)
        console.log('Loaded current design:', currentDesignWithId?.id);
        console.log('Loaded design history:', historyWithIds.map(d => d.id));
        
        // Convert old format to new format if needed
        if (progressData.qualitiesUsed?.low !== undefined) {
          // Old format: convert low/medium/high to studio/runway
          const oldQuality = progressData.qualitiesUsed
          setQualitiesUsed({
            studio: (oldQuality.low || 0) + (oldQuality.medium || 0),
            runway: oldQuality.high || 0
          })
        } else {
          setQualitiesUsed(progressData.qualitiesUsed || { studio: 0, runway: 0 })
        }
        
        setSelectedQuality(progressData.selectedQuality === 'low' || progressData.selectedQuality === 'medium' ? 'studio' : progressData.selectedQuality || 'studio')
        setUploadMode(progressData.uploadMode || false)
        setUploadedFrontImage(progressData.uploadedFrontImage || null)
        setUploadedBackImage(progressData.uploadedBackImage || null)
        setFormData(progressData.formData || {
          name: '',
          description: '',
          prompt: '',
          selectedCategory: '',
          itemType: '',
          gender: 'UNISEX',
          referralCodes: ['', '', ''],
          modelDescription: '',
          remainingOutfit: '',
          editInstructions: ''
        })
        console.log('Progress loaded from database')
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    } finally {
      setIsLoadingProgress(false)
    }
  }

  const clearProgress = async () => {
    if (!session?.user?.uid) return
    
    try {
      const response = await fetch('/api/waitlist/progress', {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear progress')
      }
      
      console.log('Progress cleared from database')
    } catch (error) {
      console.error('Failed to clear progress:', error)
    }
  }

  // Image upload handler - validates content, then opens cropper for user to manually crop
  const handleImageUpload = async (file, type) => {
    if (!file) return
    
    // Validate file size (max 10MB for user uploads)
    if (file.size > 10 * 1024 * 1024) {
      setError(`${type === 'front' ? 'Front' : 'Back'} image file size must be less than 10MB`)
      return
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`Please upload a valid image file (PNG, JPG, etc.) for ${type} view`)
      return
    }
    
    // Set validating state
    setUploadValidating(prev => ({ ...prev, [type]: true }))
    setUploadValidationMessages(prev => ({ ...prev, [type]: 'Validating image...' }))
    clearError()
    
    // Load image and check if it's large enough
    const reader = new FileReader()
    reader.onloadend = async () => {
      const img = new Image()
      img.onload = async () => {
        const width = img.width
        const height = img.height
        
        console.log(`[Upload] ${type} image dimensions: ${width}x${height}`)
        
        // Check if image is large enough to crop to target dimensions
        const targetWidth = 683
        const targetHeight = 1024
        
        if (width < targetWidth || height < targetHeight) {
          setError(`Image is too small. Minimum dimensions: ${targetWidth}×${targetHeight}px. Your image: ${width}×${height}px`)
          setUploadValidating(prev => ({ ...prev, [type]: false }))
          setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
          return
        }
        
        // Validate image content with AI
        try {
          console.log(`[Upload] Validating ${type} image content...`)
          const validationResponse = await fetch('/api/design/validate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: reader.result,
              type: type
            })
          })
          
          if (!validationResponse.ok) {
            throw new Error('Failed to validate image')
          }
          
          const validationData = await validationResponse.json()
          const validation = validationData.validation
          
          console.log(`[Upload] Validation result:`, validation)
          
          if (!validation.isValid) {
            // Image failed validation
            const violationsList = validation.violations && validation.violations.length > 0
              ? '\n\n• ' + validation.violations.join('\n• ')
              : ''
            
            const errorMessage = `${type === 'front' ? 'Front' : 'Back'} image validation failed:\n\n${validation.reason}${violationsList}${validation.suggestions ? '\n\nSuggestion: ' + validation.suggestions : ''}`
            
            setError(errorMessage)
            setUploadValidating(prev => ({ ...prev, [type]: false }))
            setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
            return
          }
          
          console.log(`[Upload] ${type} image passed validation`)
          
        } catch (validationError) {
          console.error(`[Upload] Validation error:`, validationError)
          setError(`Failed to validate ${type} image. Please try again.`)
          setUploadValidating(prev => ({ ...prev, [type]: false }))
          setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
          return
        }
        
        // Clear validating state
        setUploadValidating(prev => ({ ...prev, [type]: false }))
        setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
        
        // Check if dimensions match exactly - no need to crop
        if (width === targetWidth && height === targetHeight) {
          console.log(`[Upload] ${type} image has perfect dimensions, skipping crop`)
          if (type === 'front') {
            setUploadedFrontImage(reader.result)
            setUploadValidationMessages(prev => ({ ...prev, front: '✓ Image ready' }))
          } else {
            setUploadedBackImage(reader.result)
            setUploadValidationMessages(prev => ({ ...prev, back: '✓ Image ready' }))
          }
          clearError()
          return
        }
        
        // Image needs cropping - open cropper
        console.log(`[Upload] ${type} image needs cropping, opening cropper`)
        setCropperState({
          isOpen: true,
          image: reader.result,
          type: type
        })
        clearError()
      }
      
      img.onerror = () => {
        setError(`Failed to load ${type} image. Please try a different file.`)
        setUploadValidating(prev => ({ ...prev, [type]: false }))
        setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
      }
      
      img.src = reader.result
    }
    
    reader.onerror = () => {
      setError(`Failed to read ${type} image file`)
      setUploadValidating(prev => ({ ...prev, [type]: false }))
      setUploadValidationMessages(prev => ({ ...prev, [type]: '' }))
    }
    
    reader.readAsDataURL(file)
  }
  
  // Handle crop completion
  const handleCropComplete = (croppedImage) => {
    const { type } = cropperState
    
    console.log(`[Crop Complete] Cropped ${type} image to 683x1024px`)
    
    if (type === 'front') {
      setUploadedFrontImage(croppedImage)
      setUploadValidationMessages(prev => ({ ...prev, front: '✓ Image ready' }))
    } else {
      setUploadedBackImage(croppedImage)
      setUploadValidationMessages(prev => ({ ...prev, back: '✓ Image ready' }))
    }
    
    // Close cropper
    setCropperState({
      isOpen: false,
      image: null,
      type: null
    })
  }
  
  // Handle crop cancellation
  const handleCropCancel = () => {
    console.log('[Crop Cancel] User cancelled cropping')
    setCropperState({
      isOpen: false,
      image: null,
      type: null
    })
  }

  const handleInitialSubmit = () => {
    if (uploadMode) {
      // Upload mode: validate uploads and move to step 2
      if (!uploadedFrontImage || !uploadedBackImage) {
        setError('Please upload both front and back images')
        return
      }
      
      if (!formData.prompt.trim() || !formData.itemType) {
        setError('Please fill in all required fields')
        return
      }
      
      // Set the uploaded images as current design
      setCurrentDesign({
        aiDescription: formData.prompt || `${formData.name} - ${formData.itemType}`,
        frontImage: uploadedFrontImage,
        backImage: uploadedBackImage,
        compositeImage: null
      })
      
      setStep(2) // Move to generation stage
    } else {
      // AI Generation mode: validate and move to step 2
      if (!aiGenerationEnabled) {
        setError('AI generation is currently disabled. Please use upload mode instead.')
        return
      }
      
      if (!formData.prompt.trim() || !formData.itemType) {
        setError('Please fill in all required fields')
        return
      }
      setStep(2) // Move to generation stage
      // Start generation immediately
      generateWaitlistDesign(formData.prompt)
    }
  }

  const submitApplication = async () => {
    // Clear previous messages
    setError('')
    setSuccess('')
    
    if (!currentDesign) {
      setError('Please generate a design first')
      return
    }

    if (!formData.name.trim()) {
      setHasAttemptedSubmit(true)
      setError('Please provide a name for your design')
      return
    }

    setIsLoading(true)

    try {
      const requestData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || '',
        imageUrl: currentDesign.frontImage || currentDesign.compositeImage || currentDesign.imageUrl,
        backImageUrl: currentDesign.backImage || currentDesign.backImageUrl,
        promptRaw: uploadMode ? formData.prompt : currentDesign.prompt,
        itemType: formData.itemType,
        gender: formData.gender,
        referralCodes: formData.referralCodes.filter(code => code.trim()),
        modelDescription: formData.modelDescription?.trim() || '',
        remainingOutfit: formData.remainingOutfit?.trim() || '',
        editInstructions: formData.editInstructions?.trim() || '',
        isUploadedDesign: uploadMode // Flag to indicate design type
      }

      // Only add quality for AI-generated designs
      if (!uploadMode && currentDesign.quality) {
        requestData.quality = (currentDesign.quality === 'studio' || currentDesign.quality === 'medium') ? 'medium' : 'high'
      }

      console.log('Submitting waitlist application:', requestData)

      const response = await fetch('/api/waitlist/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      const data = await response.json()

      if (!response.ok) {
        // Enhanced error handling for submission
        if (response.status === 400 && data.error?.includes('already have a pending application')) {
          throw new Error('You already have a pending application. Check your status page for updates.')
        } else if (response.status === 401 || data.error?.includes('authentication')) {
          throw new Error('Authentication required. Please sign in again.')
        } else if (response.status === 429) {
          throw new Error('Too many applications submitted. Please try again later.')
        } else if (response.status >= 500) {
          throw new Error('Server error occurred. Your application data has been preserved - please try submitting again.')
        }
        throw new Error(data.error || 'Application failed. Please try again.')
      }

      setStep(5) // Confirmation step (updated from 4 to 5)
      setSuccess('Application submitted successfully!')
      
      // Clear progress after successful submission
      clearProgress()

    } catch (err) {
      console.error('Submit application error:', err)
      setError(err.message || 'Failed to submit application')
      clearSuccess() // Clear any success message when error occurs
      // Don't change steps on error - let user retry from current state
    } finally {
      setIsLoading(false)
    }
  }

  const handleReferralCodeChange = (index, value) => {
    const newCodes = [...formData.referralCodes]
    newCodes[index] = value.toUpperCase().trim()
    setFormData(prev => ({ ...prev, referralCodes: newCodes }))
  }

  const generateWaitlistDesign = async (prompt, isEdit = false, baseDesign = null) => {
    try {
      const userPrompt = prompt || formData.prompt || '';
      
      // Use baseDesign if provided, otherwise use currentDesign
      const designToUse = baseDesign || currentDesign;
      
      // Debug logging for edits
      if (isEdit) {
        console.log('=== EDIT DEBUG ===');
        console.log('Edit prompt:', userPrompt);
        console.log('Base design provided:', !!baseDesign);
        console.log('Design to use ID:', designToUse?.id);
        console.log('Design to use quality:', designToUse?.quality);
        console.log('Design to use has frontImage:', !!designToUse?.frontImage);
        console.log('Design to use has compositeImage:', !!designToUse?.compositeImage);
        console.log('=================');
      }
      
      // Add subtle variation to prevent identical results when generating multiple designs
      let enhancedPrompt = userPrompt;
      if (!isEdit && designHistory.length > 0) {
        const variations = [
          ', with a slightly different styling approach',
          ', exploring alternative design elements',
          ', with a fresh creative perspective',
          ', with subtle variations in the design details',
          ', reimagined with a different aesthetic focus'
        ];
        const randomVariation = variations[Math.floor(Math.random() * variations.length)];
        enhancedPrompt = userPrompt + randomVariation;
      }
      
      const result = await generateDesign({
        itemType: formData.itemType || '',
        gender: formData.gender || 'UNISEX', 
        // For editing, use 'prompt' to ensure edit instructions are used
        // For regular generation, use 'userPrompt' with variations
        ...(isEdit ? { prompt: userPrompt } : { userPrompt: enhancedPrompt }),
        modelDescription: formData.modelDescription || `Professional ${formData.gender === 'MASCULINE' ? 'male' : formData.gender === 'FEMININE' ? 'female' : 'unisex'} model`,
        color: extractColorFromPrompt(userPrompt) || 'default',
        quality: selectedQuality === 'studio' ? 'medium' : 'high', // Map waitlist quality to standard quality
        isEditing: isEdit,
        originalImage: designToUse?.compositeImage,
        frontImage: designToUse?.frontImage,
        backImage: designToUse?.backImage,
        userSession: session,
        isWaitlistApplication: true
      });

      if (result) {
        // Check if this exact image already exists in history
        const resultImageUrl = result.frontImage || result.compositeImage || result.imageUrl;
        const existingDesign = designHistory.find(d => {
          const existingUrl = d.frontImage || d.compositeImage || d.imageUrl;
          return existingUrl === resultImageUrl;
        });
        
        if (existingDesign) {
          // Exact same image already exists - just set it as current, don't increment counters
          setCurrentDesign(existingDesign);
          console.log('Duplicate image found, using existing design:', existingDesign.id);
        } else {
          // New unique image - just set as current design (history already handled by hook)
          setCurrentDesign(result);
          setGenerationsUsed(prev => prev + 1);
          setQualitiesUsed(prev => ({
            ...prev,
            [selectedQuality]: prev[selectedQuality] + 1
          }));
          console.log('Set new unique design as current:', result.id);
        }
        setLoadingStates({
          image: false,
          description: false,
          regenerating: false
        });
        setStep(2);
        
        // Dispatch custom event to update nav bar credits immediately
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      }
    } catch (error) {
      console.error('Error generating design:', error);
      setLoadingStates({
        image: false,
        description: false,
        regenerating: false
      });
    }
  };

  // Quick quality upgrade function for waitlist page
  const handleQuickQualityUpgrade = async (newQuality) => {
    if (!currentDesign) {
      setError('Please generate a design first.');
      return;
    }

    try {
      setLoadingStates({ image: true, description: false, regenerating: false });
      clearError();
      
      const result = await generateDesign({
        prompt: 'Quality upgrade',
        quality: newQuality === 'studio' ? 'medium' : 'high', // Map waitlist quality to standard quality
        targetQuality: newQuality === 'studio' ? 'medium' : 'high',
        userSession: session,
        originalImage: currentDesign.compositeImage,
        frontImage: currentDesign.frontImage,
        backImage: currentDesign.backImage,
        isEditing: true,
        isWaitlistApplication: true
      });

      if (result) {
        // Check if this exact image already exists in history
        const resultImageUrl = result.frontImage || result.compositeImage || result.imageUrl;
        const existingDesign = designHistory.find(d => {
          const existingUrl = d.frontImage || d.compositeImage || d.imageUrl;
          return existingUrl === resultImageUrl;
        });
        
        if (existingDesign) {
          // Exact same image already exists - just set it as current, don't increment counters
          setCurrentDesign(existingDesign);
          console.log('Duplicate quality upgrade found, using existing design:', existingDesign.id);
        } else {
          // New unique image - just set as current design (history already handled by hook)
          setCurrentDesign(result);
          setGenerationsUsed(prev => prev + 1);
          setQualitiesUsed(prev => ({
            ...prev,
            [newQuality]: prev[newQuality] + 1
          }));
          console.log('Set new unique quality upgrade as current:', result.id);
        }
        setSelectedQuality(newQuality);
        console.log(`[Waitlist Page] Quality upgraded from ${selectedQuality} to ${newQuality}`);
        
        // Dispatch custom event to update nav bar credits immediately
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      }
    } catch (error) {
      console.error('[Waitlist Page] Quality upgrade error:', error);
      // Error is already set by the shared function
    } finally {
      setLoadingStates({ image: false, description: false, regenerating: false });
    }
  };

  if (status === 'loading' || isLoadingProgress) {
  return (
      <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-6 text-gray-600 font-light text-lg">
            {status === 'loading' ? 'Loading...' : 'Loading your progress...'}
          </p>
              </div>
            </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
          <div className="text-center">
            <h1 className="text-6xl md:text-8xl font-extralight text-black mb-8 tracking-tight">
              CLAUTH
            </h1>
            <p className="text-xl text-gray-600 mb-8 font-light">
              Show us what you've got. Submit a design to apply for early access.
            </p>
            <div className="space-y-4">
              <Link
                href="/signup"
                className="block w-full max-w-sm mx-auto bg-black text-white px-8 py-4 text-lg font-medium hover:bg-gray-900 transition-colors"
              >
                Create Account to Apply
              </Link>
              <Link
                href="/login"
                className="block w-full max-w-sm mx-auto border border-gray-300 text-gray-700 px-8 py-4 text-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-md">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              className="text-2xl font-bold text-black hover:text-gray-700 transition-all duration-300"
            >
              Clauth
            </Link>
            
            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full mx-auto mb-8 flex items-center justify-center">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
          </div>
          <h1 className="text-4xl font-light text-black mb-6">Application Submitted!</h1>
          <p className="text-xl text-gray-600 mb-8 font-light">
            You're on the list! If accepted, you'll hear back soon.
          </p>
          <p className="text-gray-500 mb-8">
            We review applications daily. Check your email for updates.
          </p>
          <Link
            href="/waitlist-status"
            className="inline-block bg-black text-white px-8 py-3 font-medium hover:bg-gray-900 transition-colors"
          >
            Check Status
          </Link>
        </div>
        </div>
      </div>
    )
  }

  // Step 0: How it Works
  if (step === 0) {
    return (
      <div className="min-h-screen bg-white">
        {/* Top Navigation Bar */}
        <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-md">
          <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
            <Link 
              href="/" 
              className="text-2xl font-bold text-black hover:text-gray-700 transition-all duration-300"
            >
              Clauth
            </Link>
            
            <div className="flex items-center gap-3">
              {session?.user ? (
                <>
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                    <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xs">
                      {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
                      {session.user.name || session.user.email}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-extralight text-black mb-4 tracking-tight">
              Welcome to CLAUTH
            </h1>
            <p className="text-xl text-gray-800 font-light mb-2">
              Ready to show us what you've got? 
            </p>
            <p className="text-lg text-gray-800 mb-2">
              Submit your best fashion design to apply for early access
            </p>
            <p className="text-sm text-gray-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2 inline-block">
              ✨ Don't worry - everyone will eventually get access! We're just managing the early rollout.
            </p>
          </div>

          <div className="space-y-12">
            {/* Process Steps */}
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-6">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Describe Your Vision</h3>
                <p className="text-gray-800 leading-relaxed">
                  Tell us about the clothing item you want to create. Pick a category, choose the type, and write a detailed description that brings your vision to life.
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-6">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Create & Perfect</h3>
                <p className="text-gray-800 leading-relaxed">
                  {aiGenerationEnabled 
                    ? 'Watch our AI bring your design to life! You get 2 Studio generations for experimenting and 1 premium Runway generation for that perfect final design.'
                    : 'Upload front and back images of your clothing design. Our system will validate and process them for your application.'
                  }
              </p>
            </div>

            <div className="text-center">
                <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center text-2xl font-light mx-auto mb-6">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Submit & Shine</h3>
                <p className="text-gray-800 leading-relaxed">
                  Add any referral codes from friends, review your masterpiece, and submit your application. We review every design personally!
                </p>
              </div>
            </div>

            {/* Generation System - Only show if AI generation is enabled */}
            {aiGenerationEnabled && (
              <div className="bg-gray-50 rounded-xl p-8">
                <h2 className="text-2xl font-light text-center mb-2 text-gray-900">Your Creative Arsenal</h2>
                <p className="text-center text-gray-800 mb-8">Here's what you get to work with</p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Studio Quality</h3>
                      <p className="text-sm text-gray-800">2 generations included</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    Perfect for brainstorming and testing ideas. Use these to explore different concepts, try variations, and refine your vision before committing to your final design.
                  </p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-purple-200 shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        Runway Quality
                        <span className="ml-2 text-yellow-500">⭐</span>
                      </h3>
                      <p className="text-sm text-gray-800">1 premium generation</p>
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    This is your showstopper! Ultra-high quality with incredible detail and realism. Save this for when you've perfected your concept and are ready for your final submission.
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900 mb-1">
                      💡 Pro Strategy
                    </p>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      Start with Studio to experiment and iterate on your ideas. Once you've nailed your concept, use Runway to create that jaw-dropping final design that'll make us say "wow!"
                    </p>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* What We're Looking For */}
            <div>
              <h2 className="text-2xl font-light text-center mb-2 text-gray-900">What Makes Us Excited</h2>
              <p className="text-center text-gray-800 mb-8">Here's what catches our attention</p>
              
              <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-green-700 flex items-center">
                    <span className="mr-2">✨</span>
                    We Love
                  </h3>
                  <ul className="space-y-4 text-gray-800">
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span>Bold, original designs that make us stop scrolling</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span>Thoughtful descriptions that show your creative process</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">•</span>
                      <span>Designs that push boundaries and challenge conventions</span>
                    </li>
                    {aiGenerationEnabled && (
                      <li className="flex items-start">
                        <span className="text-green-500 mr-3 mt-1">•</span>
                        <span>Smart use of all your generation credits</span>
                      </li>
                    )}
                  </ul>
                </div>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-red-700 flex items-center">
                    <span className="mr-2">⚠️</span>
                    Please Avoid
                  </h3>
                  <ul className="space-y-4 text-gray-800">
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      <span>Generic designs we've seen a thousand times</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      <span>Copying existing brand designs</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      <span>Inappropriate or offensive content</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-red-500 mr-3 mt-1">•</span>
                      <span>Rushing through without iterations</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="text-center bg-gray-50 rounded-xl p-8">
              <h3 className="text-2xl font-medium text-gray-900 mb-4">Ready to Create Something Amazing?</h3>
              <p className="text-gray-800 mb-6">
                Let's see what you've got! Your next great design is just a few clicks away.
              </p>
              <button
                onClick={() => setStep(1)}
                className="bg-black text-white px-10 py-4 text-lg font-medium hover:bg-gray-900 transition-colors rounded-xl shadow-sm hover:shadow-md"
              >
                Start Creating →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-300 sticky top-0 z-50 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link 
            href="/" 
            className="text-2xl font-bold text-black hover:text-gray-700 transition-all duration-300"
          >
            Clauth
          </Link>
          
          <div className="flex items-center gap-3">
            {session?.user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg">
                  <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {session.user.name?.charAt(0)?.toUpperCase() || session.user.email?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm text-gray-700 font-medium max-w-[150px] truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extralight text-black mb-4 tracking-tight">
            Apply for Early Access
          </h1>
          <p className="text-lg text-gray-800 font-light">
            {aiGenerationEnabled 
              ? 'Use 2 Studio generations to iterate, then 1 Runway generation for your final design'
              : 'Upload your clothing design images to apply for early access'
            }
          </p>
          
          {/* Sleek Reset Options - only show when there's an error or user is stuck */}
          {(step > 0 || generationsUsed > 0) && (error || (generationsUsed > 0 && !currentDesign) || loadingStates.image) && (
            <div className="mt-6">
              <div className="relative group">
                <button
                  data-menu-trigger
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  onClick={() => {
                    const menu = document.getElementById('reset-menu');
                    menu.classList.toggle('hidden');
                  }}
                >
                  ⚙️ Options
                </button>
                <div id="reset-menu" className="hidden absolute top-6 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[200px]">
                  <div className="p-1">
                    <button
                      onClick={() => {
                        document.getElementById('reset-menu').classList.add('hidden');
                        if (confirm('Start over but keep your used credits? This will reset your form but preserve the generations you\'ve already used.')) {
                          clearError()
                          clearSuccess()
                          setLoadingStates({ image: false, description: false, regenerating: false })
                          setStep(1)
                          setCurrentDesign(null)
                          setDesignHistory([])
                          setUploadMode(false)
                          setUploadedFrontImage(null)
                          setUploadedBackImage(null)
                          setUploadValidationMessages({ front: '', back: '' })
                          setUploadValidating({ front: false, back: false })
                          setHasAttemptedSubmit(false)
                          setFormData({
                            name: '',
                            description: '',
                            prompt: '',
                            selectedCategory: '',
                            itemType: '',
                            gender: 'UNISEX',
                            referralCodes: ['', '', ''],
                            modelDescription: '',
                            remainingOutfit: '',
                            editInstructions: ''
                          })
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-md transition-colors"
                    >
                      🔄 Start Over (Keep Credits)
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('reset-menu').classList.add('hidden');
                        if (confirm('Are you sure you want to completely start over? This will clear ALL your progress and reset your credits.')) {
                          clearError()
                          clearSuccess()
                          setLoadingStates({ image: false, description: false, regenerating: false })
                          setStep(0)
                          setCurrentDesign(null)
                          setDesignHistory([])
                          setGenerationsUsed(0)
                          setQualitiesUsed({ studio: 0, runway: 0 })
                          setSelectedQuality('studio')
                          setUploadMode(false)
                          setUploadedFrontImage(null)
                          setUploadedBackImage(null)
                          setUploadValidationMessages({ front: '', back: '' })
                          setUploadValidating({ front: false, back: false })
                          setHasAttemptedSubmit(false)
                          setFormData({
                            name: '',
                            description: '',
                            prompt: '',
                            selectedCategory: '',
                            itemType: '',
                            gender: 'UNISEX',
                            referralCodes: ['', '', ''],
                            modelDescription: '',
                            remainingOutfit: '',
                            editInstructions: ''
                          })
                          clearProgress()
                        }
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-md transition-colors"
                    >
                      ⚠️ Full Reset (Reset Credits)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-black text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 4 && (
                  <div className={`w-16 h-0.5 ${
                    step > stepNum ? 'bg-black' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-4 space-x-12 text-sm text-gray-800">
            <span>Input</span>
            <span>Generate</span>
            <span>Referrals</span>
            <span>Submit</span>
          </div>
        </div>

        {/* Clean inline error handling - no more ugly banners */}
        {error && step === 2 && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
                <button
                  onClick={() => {
                    clearError()
                    setLoadingStates({ image: false, description: false, regenerating: false })
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-green-700">{success}</p>
                </div>
                <button
                  onClick={clearSuccess}
                  className="text-green-500 hover:text-green-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage 1: Initial Input */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-light text-black mb-4">Describe Your Design</h2>
              <p className="text-gray-600">
                {aiGenerationEnabled 
                  ? `Tell us what you want to create. ${uploadMode ? 'Upload your own images or let AI generate them.' : "We'll generate it in the next step."}`
                  : 'Tell us about your design and upload your images.'
                }
              </p>
            </div>

            <div className="space-y-8">
              {/* Item Type Selection */}
              <ItemTypeSelector
                selectedCategory={formData.selectedCategory}
                onCategoryChange={(category) => setFormData(prev => ({ 
                  ...prev, 
                  selectedCategory: category,
                  itemType: ''
                }))}
                itemType={formData.itemType}
                onItemTypeChange={(itemType) => setFormData(prev => ({ 
                  ...prev, 
                  itemType 
                }))}
                gender={formData.gender}
                onGenderChange={(gender) => setFormData(prev => ({ 
                  ...prev, 
                  gender 
                }))}
              />

              {/* Mode Toggle */}
              {aiGenerationEnabled && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5">
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Design Creation Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setUploadMode(false)}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        !uploadMode
                          ? 'border-indigo-600 bg-white shadow-md'
                          : 'border-gray-300 bg-white/50 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl mb-2">🤖</span>
                      <span className={`block font-semibold ${!uploadMode ? 'text-indigo-700' : 'text-gray-700'}`}>
                        AI Generate
                      </span>
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        Let AI create your design
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode(true)}
                      className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all ${
                        uploadMode
                          ? 'border-indigo-600 bg-white shadow-md'
                          : 'border-gray-300 bg-white/50 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-3xl mb-2">📤</span>
                      <span className={`block font-semibold ${uploadMode ? 'text-indigo-700' : 'text-gray-700'}`}>
                        Upload Images
                      </span>
                      <span className="text-xs text-gray-600 mt-1 text-center">
                        Upload your own designs
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {uploadMode || !aiGenerationEnabled ? (
                /* UPLOAD MODE UI */
                <div className="space-y-6">
                  {/* AI Generation Tips - Collapsible (only show if AI generation is enabled) */}
                  {aiGenerationEnabled && (
                    <details className="group bg-white border border-gray-300 rounded-lg overflow-hidden">
                      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900">Need to generate images? Click for suggested tools & prompts</span>
                        </div>
                      <svg className="w-4 h-4 text-gray-500 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-200 space-y-4">
                      {/* Recommended AI Tools */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Suggested AI Tools</h4>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <a href="https://chatgpt.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:border-gray-900 transition-colors text-gray-900">
                            <span className="font-medium">ChatGPT</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <a href="https://www.midjourney.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:border-gray-900 transition-colors text-gray-900">
                            <span className="font-medium">Midjourney</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                          <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded hover:border-gray-900 transition-colors text-gray-900">
                            <span className="font-medium">Gemini (Imagen 4)</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>

                      {/* Front Image Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Suggested Front View Prompt</h4>
                          <button
                            onClick={() => {
                              const prompt = `Create a portrait-oriented fashion image.

ITEM:
${formData.itemType || '[Your item type]'} in [Your color]
${formData.prompt || '[Your design description]'}

SUGGESTIONS:
- Model: ${formData.gender === 'MASCULINE' ? 'Male' : formData.gender === 'FEMININE' ? 'Female' : 'Any'} ${formData.modelDescription ? `- ${formData.modelDescription}` : ''}
- Full-body shot showing the complete outfit
- Clean background (studio, outdoor, or your choice)
- Good lighting to show fabric details

Feel free to adjust the style, background, and model to match your creative vision!`;
                              navigator.clipboard.writeText(prompt);
                              alert('Suggested prompt copied!');
                            }}
                            className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white border border-gray-300 rounded p-3 text-xs font-mono text-gray-700 max-h-48 overflow-y-auto">
                          <div className="whitespace-pre-wrap">
{`Create a portrait-oriented fashion image.

ITEM: ${formData.itemType || '[Your item]'} in [color]
${formData.prompt ? `Design: ${formData.prompt}` : 'Design: [your description]'}

SUGGESTIONS:
- Model: ${formData.gender === 'MASCULINE' ? 'Male' : formData.gender === 'FEMININE' ? 'Female' : 'Any'} ${formData.modelDescription ? `- ${formData.modelDescription}` : ''}
- Full-body view showing complete outfit
- Clean background of your choice
- Good lighting for fabric details

Customize as you like!`}
                          </div>
                        </div>
                      </div>

                      {/* Back Image Prompt */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Suggested Back View Prompt</h4>
                          <button
                            onClick={() => {
                              const prompt = `Create a back view fashion image.

TIP: For best results, try to match the front view style.

ITEM (BACK VIEW):
${formData.itemType || '[Your item type]'} in [Your color]
${formData.prompt || '[Describe back design - logos, patterns, etc.]'}

SUGGESTIONS:
- Model facing away from camera showing back
- Similar lighting and background as front view
- Full-body view from head to toe
- Same model/styling if possible

Adapt to your creative vision!`;
                              navigator.clipboard.writeText(prompt);
                              alert('Suggested prompt copied!');
                            }}
                            className="text-xs px-2 py-1 bg-gray-900 text-white rounded hover:bg-black transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="bg-white border border-gray-300 rounded p-3 text-xs font-mono text-gray-700 max-h-48 overflow-y-auto">
                          <div className="whitespace-pre-wrap">
{`Create a back view fashion image.

TIP: Match your front view style for consistency

ITEM (BACK): ${formData.itemType || '[Your item]'} 
Back details: ${formData.prompt || '[back design elements]'}

SUGGESTIONS:
- Model facing away from camera
- Similar lighting & background as front
- Full-body view

Customize to your preference!`}
                          </div>
                        </div>
                      </div>

                      {/* Quick Tips */}
                      <div className="bg-white border border-gray-300 rounded p-3">
                        <h4 className="text-xs font-semibold text-gray-900 mb-2">💡 Helpful Tips</h4>
                        <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                          <li>These prompts are <strong>suggestions</strong> - feel free to use your own creative approach!</li>
                          <li>Use portrait orientation for best results</li>
                          <li>Save images at high resolution for best quality</li>
                          <li>Matching model and lighting between views creates a cohesive look</li>
                        </ul>
                      </div>
                    </div>
                  </details>
                  )}

                  <div className="bg-gray-100 border-l-4 border-gray-900 p-4 rounded">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-gray-900">
                          <strong>Upload Mode:</strong> Upload front and back images. 
                          <strong> Required dimensions: 683×1024px portrait.</strong>
                          {' '}If your images are larger, you&apos;ll be able to crop them to the perfect size.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Front Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Front Image <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-4">
                      {uploadValidating.front ? (
                        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                            <svg className="animate-spin h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-700 font-medium mb-1">Validating image...</p>
                            <p className="text-xs text-gray-500">Checking content and quality</p>
                          </div>
                        </div>
                      ) : uploadedFrontImage ? (
                        <div className="relative group w-full">
                          <img 
                            src={uploadedFrontImage} 
                            alt="Front view" 
                            className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-900 shadow-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedFrontImage(null);
                              setUploadValidationMessages(prev => ({ ...prev, front: '' }));
                            }}
                            className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-black shadow-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {uploadValidationMessages.front && (
                            <div className="absolute bottom-2 left-2 bg-gray-900 text-white px-3 py-1 rounded text-xs font-medium shadow-md">
                              {uploadValidationMessages.front}
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-700">
                              <span className="font-semibold">Click to upload front image</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            <p className="text-xs text-gray-900 font-medium mt-1">Ideal: 683×1024px portrait</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleImageUpload(e.target.files[0], 'front')}
                            disabled={uploadValidating.front}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Back Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Back Image <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col gap-4">
                      {uploadValidating.back ? (
                        <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                            <svg className="animate-spin h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-sm text-gray-700 font-medium mb-1">Validating image...</p>
                            <p className="text-xs text-gray-500">Checking content and quality</p>
                          </div>
                        </div>
                      ) : uploadedBackImage ? (
                        <div className="relative group w-full">
                          <img 
                            src={uploadedBackImage} 
                            alt="Back view" 
                            className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-900 shadow-lg bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setUploadedBackImage(null);
                              setUploadValidationMessages(prev => ({ ...prev, back: '' }));
                            }}
                            className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-black shadow-lg transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          {uploadValidationMessages.back && (
                            <div className="absolute bottom-2 left-2 bg-gray-900 text-white px-3 py-1 rounded text-xs font-medium shadow-md">
                              {uploadValidationMessages.back}
                            </div>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                            <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="mb-2 text-sm text-gray-700">
                              <span className="font-semibold">Click to upload back image</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                            <p className="text-xs text-gray-900 font-medium mt-1">Ideal: 683×1024px portrait</p>
                          </div>
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={(e) => handleImageUpload(e.target.files[0], 'back')}
                            disabled={uploadValidating.back}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Description for uploads */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Design Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.prompt}
                      onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                      placeholder="Describe your uploaded design... This will be shown on the published item."
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500 resize-none h-32"
                      maxLength={1000}
                      required
                    />
                  </div>
                </div>
              ) : (
                /* AI GENERATION MODE UI */
                <>
              {/* Design Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Design Prompt *
                </label>
                <textarea
                  value={formData.prompt}
                  onChange={(e) => setFormData(prev => ({ ...prev, prompt: e.target.value }))}
                  placeholder="Describe your clothing design in detail..."
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none h-32 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Model Description */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Model Description (Optional)
                </label>
                <textarea
                  value={formData.modelDescription || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, modelDescription: e.target.value }))}
                  placeholder="Describe the model wearing this item"
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Remaining Outfit Description */}
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  Remaining Outfit Description (Optional)
                </label>
                <textarea
                  value={formData.remainingOutfit || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, remainingOutfit: e.target.value }))}
                  placeholder="Describe what else the model is wearing to complete the outfit"
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none h-24 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                />
              </div>
                </>
              )}
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(0)}
                  className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 font-medium hover:bg-gray-50 transition-colors rounded-lg"
                >
                  ← Back to Guide
                </button>
                <button
                  onClick={handleInitialSubmit}
                  disabled={
                    (uploadMode && (!uploadedFrontImage || !uploadedBackImage || !formData.prompt.trim() || !formData.itemType || uploadValidating.front || uploadValidating.back)) ||
                    (!uploadMode && (!formData.prompt.trim() || !formData.itemType))
                  }
                  className="flex-1 bg-black text-white px-6 py-3 font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg"
                >
                  {uploadValidating.front || uploadValidating.back ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Validating...
                    </>
                  ) : (
                    uploadMode ? 'Continue with Uploads' : 'Continue to Generation'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: Generation & Editing */}
        {step === 2 && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-light text-black mb-4">Your Design</h2>
              {aiGenerationEnabled && (
                <div className="space-y-2">
                  <p className="text-gray-800">
                    Generation Usage: Studio ({qualitiesUsed.studio}/2) • Runway ({qualitiesUsed.runway}/1)
                  </p>
                  {generationsUsed === 0 && <p className="text-sm text-gray-600">(Ready to generate your first design)</p>}
                </div>
              )}
            </div>


            {(uploadMode || !aiGenerationEnabled) && (
              /* UPLOAD MODE UI FOR STEP 2 */
              <div className="max-w-2xl mx-auto space-y-6">
                {/* Upload Instructions */}
                <div className="bg-gray-100 border-l-4 border-gray-900 p-4 rounded">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900">
                        <strong>Upload Mode:</strong> Upload front and back images. 
                        <strong> Required dimensions: 683×1024px portrait.</strong>
                        {' '}If your images are larger, you&apos;ll be able to crop them to the perfect size.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Front Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Front Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-4">
                    {uploadValidating.front ? (
                      <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <svg className="animate-spin h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-gray-700 font-medium mb-1">Validating image...</p>
                          <p className="text-xs text-gray-500">Checking content and quality</p>
                        </div>
                      </div>
                    ) : uploadedFrontImage ? (
                      <div className="relative group w-full">
                        <img 
                          src={uploadedFrontImage} 
                          alt="Front view" 
                          className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-900 shadow-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedFrontImage(null);
                            setUploadValidationMessages(prev => ({ ...prev, front: '' }));
                          }}
                          className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-black shadow-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {uploadValidationMessages.front && (
                          <div className="absolute bottom-2 left-2 bg-gray-900 text-white px-3 py-1 rounded text-xs font-medium shadow-md">
                            {uploadValidationMessages.front}
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-700">
                            <span className="font-semibold">Click to upload front image</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                          <p className="text-xs text-gray-900 font-medium mt-1">Ideal: 683×1024px portrait</p>
                        </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'front')}
                          disabled={uploadValidating.front}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Back Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    Back Image <span className="text-red-500">*</span>
                  </label>
                  <div className="flex flex-col gap-4">
                    {uploadValidating.back ? (
                      <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <svg className="animate-spin h-12 w-12 text-gray-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <p className="text-sm text-gray-700 font-medium mb-1">Validating image...</p>
                          <p className="text-xs text-gray-500">Checking content and quality</p>
                        </div>
                      </div>
                    ) : uploadedBackImage ? (
                      <div className="relative group w-full">
                        <img 
                          src={uploadedBackImage} 
                          alt="Back view" 
                          className="w-full h-auto max-h-96 object-contain rounded-lg border-2 border-gray-900 shadow-lg bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedBackImage(null);
                            setUploadValidationMessages(prev => ({ ...prev, back: '' }));
                          }}
                          className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-2 hover:bg-black shadow-lg transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                        {uploadValidationMessages.back && (
                          <div className="absolute bottom-2 left-2 bg-gray-900 text-white px-3 py-1 rounded text-xs font-medium shadow-md">
                            {uploadValidationMessages.back}
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 hover:border-gray-400 transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                          <svg className="w-12 h-12 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="mb-2 text-sm text-gray-700">
                            <span className="font-semibold">Click to upload back image</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                          <p className="text-xs text-gray-900 font-medium mt-1">Ideal: 683×1024px portrait</p>
                          </div>
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'back')}
                          disabled={uploadValidating.back}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Design Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Design Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Name your design"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your design..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 h-24 resize-none"
                  />
                </div>

                {/* Continue Button for Upload Mode */}
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={() => {
                      if (!uploadedFrontImage || !uploadedBackImage) {
                        setError('Please upload both front and back images');
                        return;
                      }
                      if (!formData.name.trim()) {
                        setError('Please provide a name for your design');
                        return;
                      }
                      // Create a design object with uploaded images
                      setCurrentDesign({
                        frontImage: uploadedFrontImage,
                        backImage: uploadedBackImage,
                        prompt: formData.prompt,
                        itemType: formData.itemType,
                        gender: formData.gender,
                        isUploaded: true
                      });
                      setStep(3); // Skip to referrals step
                    }}
                    disabled={!uploadedFrontImage || !uploadedBackImage || uploadValidating.front || uploadValidating.back}
                    className="w-full bg-black text-white px-6 py-4 font-medium hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors rounded-lg"
                  >
                    {!uploadedFrontImage || !uploadedBackImage 
                      ? 'Upload both front and back images to continue' 
                      : 'Continue with Uploaded Images →'
                    }
                  </button>
                </div>
              </div>
            )}

            {/* AI GENERATION MODE - Quality Selection */}
            {aiGenerationEnabled && !uploadMode && (qualitiesUsed.studio < 2 || qualitiesUsed.runway < 1) && qualitiesUsed.runway === 0 && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
                  <h3 className="text-xl font-medium text-gray-900 mb-6 text-center">Choose Quality for Next Generation</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Studio Quality Option */}
                    {qualitiesUsed.studio < 2 && qualitiesUsed.runway === 0 && (
                      <button
                        onClick={() => setSelectedQuality('studio')}
                        disabled={loadingStates.image}
                        className={`group relative p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                          selectedQuality === 'studio'
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        } ${loadingStates.image ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedQuality === 'studio' ? 'bg-blue-500' : 'bg-gray-100 group-hover:bg-gray-200'
                            } transition-colors`}>
                              <svg className={`w-5 h-5 ${
                                selectedQuality === 'studio' ? 'text-white' : 'text-gray-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">Studio</h4>
                              <p className="text-sm text-gray-600">Fast iterations</p>
                            </div>
                          </div>
                          {selectedQuality === 'studio' && (
                            <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                          Perfect for testing ideas and refining your concept. Great for exploring different variations.
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                            {2 - qualitiesUsed.studio} remaining
                          </span>
                        </div>
                      </button>
                    )}

                    {/* Runway Quality Option */}
                    {qualitiesUsed.runway < 1 && (
                      <button
                        onClick={() => setSelectedQuality('runway')}
                        disabled={loadingStates.image}
                        className={`group relative p-6 text-left rounded-xl border-2 transition-all duration-200 ${
                          selectedQuality === 'runway'
                            ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                        } ${loadingStates.image ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              selectedQuality === 'runway' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gray-100 group-hover:bg-gray-200'
                            } transition-all`}>
                              <svg className={`w-5 h-5 ${
                                selectedQuality === 'runway' ? 'text-white' : 'text-gray-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                                Runway
                                <span className="ml-2 text-yellow-500">⭐</span>
                              </h4>
                              <p className="text-sm text-gray-600">Premium quality</p>
                            </div>
                          </div>
                          {selectedQuality === 'runway' && (
                            <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <p className="text-gray-700 text-sm mb-3">
                          Highest quality generation with superior detail and realism. Optional premium upgrade - you can also submit with Studio quality!
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            Final generation
                          </span>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Recommendation */}
                  {qualitiesUsed.runway === 0 && qualitiesUsed.studio > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-amber-800">
                            💡 Pro Tip
                          </p>
                          <p className="text-sm text-amber-700 mt-1">
                            {generationsUsed >= 2 ? 
                              'You can submit with Studio quality or optionally use Runway for premium quality. Remember: Runway is your final generation!' : 
                              'Use Studio to iterate first, then optionally save Runway for premium quality. Once you use Runway, you cannot generate more designs.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show message when Runway has been used */}
            {qualitiesUsed.runway > 0 && (
              <div className="max-w-2xl mx-auto mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Final Design Complete! ⭐</h3>
                    <p className="text-gray-700 mb-4">
                      {aiGenerationEnabled 
                        ? "You've used your Runway generation - the highest quality available. This is your final design and cannot be changed."
                        : "Your design images have been uploaded and validated. Ready to submit your application!"
                      }
                    </p>
                    <p className="text-sm text-purple-600 font-medium">
                      Ready to submit your masterpiece? Continue to the next step!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Only show AI generation details when AI is enabled */}
            {aiGenerationEnabled && !uploadMode && (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Left Column - Design Details */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Design Name {hasAttemptedSubmit && !formData.name.trim() && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }))
                      // Clear validation error when user starts typing
                      if (hasAttemptedSubmit && e.target.value.trim()) {
                        setHasAttemptedSubmit(false)
                      }
                    }}
                    placeholder="Name your design"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 ${
                      hasAttemptedSubmit && !formData.name.trim() ? 'border-red-300 bg-red-50' : 'border-gray-300'
                    }`}
                  />
                  {hasAttemptedSubmit && !formData.name.trim() && (
                    <p className="text-sm text-red-600 mt-1">Please provide a name for your design</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Description
                  </label>
                  {loadingStates.description ? (
                    <div className="w-full h-24 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                      <div className="text-sm text-gray-500">Generating description...</div>
                    </div>
                  ) : currentDesign?.aiDescription ? (
                    <textarea
                      value={formData.description || currentDesign.aiDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 h-24 resize-none"
                    />
                  ) : (
                    <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                      <div className="text-sm text-gray-400">Description will appear here</div>
                    </div>
                  )}
                </div>

                {currentDesign && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">Design Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Item Type:</span>
                        <span className="font-medium text-gray-900">{formData.itemType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium text-gray-900">
                          {formData.selectedCategory ? CLOTHING_CATEGORIES[formData.selectedCategory].name : 'Not selected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Gender:</span>
                        <span className="font-medium text-gray-900">{formData.gender === 'MASCULINE' ? 'Male' : formData.gender === 'FEMININE' ? 'Female' : 'Unisex'}</span>
                      </div>
                      {!uploadMode && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quality:</span>
                        <span className="font-medium text-gray-900">
                          {(currentDesign.quality === 'studio' || currentDesign.quality === 'medium') ? 'Studio' : 'Runway'}
                        </span>
                      </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit Design Section - only for AI generated designs */}
                {aiGenerationEnabled && !uploadMode && currentDesign && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Edit Instructions (Optional)
                    </label>
                    <textarea
                      value={formData.editInstructions || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, editInstructions: e.target.value }))}
                      placeholder="Describe changes you want to make to this design..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-700 h-20 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Example: "Add a small logo to the chest" or "Change the color to navy blue"
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  {aiGenerationEnabled && !uploadMode && ((qualitiesUsed.studio < 2 || qualitiesUsed.runway < 1) && qualitiesUsed.runway === 0 && currentDesign) && (
                    <button
                      onClick={() => {
                        const hasEditInstructions = formData.editInstructions?.trim()
                        if (hasEditInstructions) {
                          // Use edit functionality - pass edit instructions as the prompt
                          console.log('Edit button clicked. CurrentDesign before edit:', currentDesign?.id);
                          generateWaitlistDesign(formData.editInstructions, true, currentDesign)
                        } else {
                          // Regular regeneration
                          generateWaitlistDesign(formData.prompt)
                        }
                      }}
                      disabled={loadingStates.image}
                      className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50"
                    >
                      {loadingStates.image ? 'Generating...' : 
                       formData.editInstructions?.trim() ? 'Apply Edit' : `Generate New Version (${selectedQuality === 'runway' ? 'Runway' : 'Studio'})`}
                    </button>
                  )}

                  {/* Show generate button for first generation - only in AI mode */}
                  {aiGenerationEnabled && !uploadMode && generationsUsed === 0 && qualitiesUsed.runway === 0 && (
                    <button
                      onClick={() => generateWaitlistDesign(formData.prompt)}
                      disabled={loadingStates.image}
                      className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:opacity-50"
                    >
                      {loadingStates.image ? 'Generating...' : `Generate Design (${selectedQuality === 'runway' ? 'Runway' : 'Studio'})`}
                    </button>
                  )}
                  
                  {currentDesign && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          if (!formData.name.trim()) {
                            setHasAttemptedSubmit(true)
                            // Focus on the name field to make it obvious what's missing
                            document.querySelector('input[placeholder="Name your design"]')?.focus();
                            return;
                          }
                          setStep(3);
                        }}
                        disabled={loadingStates.image}
                        className="w-full bg-black text-white px-4 py-3 rounded-lg hover:bg-gray-900 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {loadingStates.image ? 'Generating...' : 'Continue to Referrals'}
                      </button>
                      {qualitiesUsed.runway === 0 && (
                        <p className="text-xs text-gray-600 text-center">
                          You can submit with Studio quality - no need to use Runway!
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Start over option only when there's an error or user is stuck */}
                  {(error || (generationsUsed > 0 && !currentDesign)) && (
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          if (confirm('Start over and reset everything? This will give you fresh credits to try again.')) {
                            clearError()
                            clearSuccess()
                            setLoadingStates({ image: false, description: false, regenerating: false })
                            setStep(1)
                            setCurrentDesign(null)
                            setDesignHistory([])
                            setGenerationsUsed(0)
                            setQualitiesUsed({ studio: 0, runway: 0 })
                            setSelectedQuality('studio')
                            setUploadMode(false)
                            setUploadedFrontImage(null)
                            setUploadedBackImage(null)
                            setUploadValidationMessages({ front: '', back: '' })
                            setUploadValidating({ front: false, back: false })
                            setHasAttemptedSubmit(false)
                            setFormData({
                              name: '',
                              description: '',
                              prompt: '',
                              selectedCategory: '',
                              itemType: '',
                              gender: 'UNISEX',
                              referralCodes: ['', '', ''],
                              modelDescription: '',
                              remainingOutfit: '',
                              editInstructions: ''
                            })
                            clearProgress()
                          }
                        }}
                        className="w-full bg-gradient-to-r from-gray-50 to-gray-100 text-gray-600 px-4 py-2.5 rounded-lg hover:from-blue-50 hover:to-blue-100 hover:text-blue-700 transition-all duration-200 font-medium text-sm border border-gray-200 hover:border-blue-200"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>🔄</span>
                          <span>Start Over (Reset Credits)</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Generated Image */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">{uploadMode ? 'Uploaded Design' : 'Generated Design'}</h4>
                <DesignImageDisplay
                  currentDesign={currentDesign}
                  loadingStates={loadingStates}
                  quality={currentDesign?.quality || selectedQuality}
                  showQualityIndicator={!uploadMode}
                  onQualityUpgrade={!uploadMode ? handleQuickQualityUpgrade : null}
                  creditsAvailable={qualitiesUsed}
                  designHistory={designHistory}
                />
              </div>
            </div>
            )}

                        {/* Design History */}
            {aiGenerationEnabled && !uploadMode && designHistory.length > 1 && (
              <div className="mt-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">Design History</h3>
                    <p className="text-sm text-gray-600">Your creative journey • {designHistory.length} variations</p>
                  </div>
                  {currentDesign?.id !== designHistory[designHistory.length - 1]?.id && (
                    <button
                      onClick={() => {
                        const latestDesign = designHistory[designHistory.length - 1];
                        console.log('Back to latest clicked. Latest design:', latestDesign?.id);
                        setCurrentDesign(latestDesign);
                      }}
                      className="group flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-blue-700 hover:text-blue-800 px-4 py-2.5 rounded-xl font-medium text-sm border border-blue-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Back to Latest</span>
                    </button>
                  )}
                </div>
                
                <div className="relative">
                  <div className="flex space-x-5 overflow-x-auto pb-6 scrollbar-hide">
                    {designHistory.map((design, index) => {
                      const isLatest = index === designHistory.length - 1
                      const isCurrent = currentDesign?.id === design.id
                      const imageUrl = design.frontImage || design.compositeImage || design.imageUrl
                      
                      // Debug logging - only log once per render
                      if (isCurrent && index === 0) {
                        console.log('Rendering design history. Current design ID:', currentDesign?.id);
                        console.log('Design history IDs:', designHistory.map(d => d.id));
                      }
                      
                      // Only render if we have a valid image URL
                      if (!imageUrl) {
                        return null
                      }
                      
                      return (
                        <div key={design.id} className="flex-shrink-0 group">
                          <div 
                            className={`relative rounded-2xl overflow-hidden transition-all duration-300 transform ${
                              isCurrent 
                                ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-xl scale-105' 
                                : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 hover:ring-offset-white shadow-lg hover:shadow-xl hover:scale-102 cursor-pointer'
                            }`}
                            onClick={() => {
                              if (!isCurrent) {
                                console.log('Selecting design:', design.id);
                                setCurrentDesign(design);
                              }
                            }}
                          >
                            <div className="relative">
                              <NextImage
                                src={imageUrl}
                                alt={`Design ${index + 1}`}
                                width={140}
                                height={186}
                                className="transition-all duration-300 group-hover:brightness-110"
                              />
                              

                              
                              {/* Latest badge */}
                              {isLatest && (
                                <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm border border-emerald-400/50 shadow-sm">
                                  Latest
                                </div>
                              )}
                              
                              {/* Current viewing overlay - only for current design */}
                              {isCurrent && (
                                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/30 via-transparent to-transparent pointer-events-none">
                                  <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
                                    <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border border-blue-400/50 shadow-lg">
                                      Viewing
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Hover overlay - only for non-current designs - removed to fix stuck overlay issue */}
                            </div>
                          </div>
                          
                          {/* Design info */}
                          <div className="mt-3 text-center space-y-1">
                            <p className={`text-sm font-medium ${isCurrent ? 'text-blue-700' : 'text-gray-700'}`}>
                              Design {index + 1}
                            </p>
                            {!uploadMode && design.quality && (
                            <div className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${
                              (design.quality === 'studio' || design.quality === 'medium')
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-600'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                (design.quality === 'studio' || design.quality === 'medium')
                                  ? 'bg-blue-400'
                                  : 'bg-purple-400'
                              }`}></div>
                              <span>{(design.quality === 'studio' || design.quality === 'medium') ? 'Studio' : 'Runway'}</span>
                            </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  

                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-1">Design Gallery</p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Each design shows a unique variation of your prompt. Click any design to preview it. Your <span className="font-medium text-gray-900">currently viewed design</span> will be used for submission.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Referral Codes */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-light text-black mb-4">Referral Codes (Optional)</h2>
              <p className="text-gray-800">
                Have friends on CLAUTH? Add their referral codes!
              </p>
            </div>

            <div className="space-y-4">
              {formData.referralCodes.map((code, index) => (
                <div key={index} className="relative">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Referral Code {index + 1}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => handleReferralCodeChange(index, e.target.value)}
                      placeholder="Enter referral code (e.g., ABC1234)"
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent uppercase text-gray-900 placeholder-gray-600"
                      maxLength={10}
                    />
                    {formData.referralCodes.length > 3 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newCodes = formData.referralCodes.filter((_, i) => i !== index)
                          setFormData(prev => ({ ...prev, referralCodes: newCodes }))
                        }}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Remove this referral code"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              
              {formData.referralCodes.length < 10 && (
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ 
                      ...prev, 
                      referralCodes: [...prev.referralCodes, ''] 
                    }))
                  }}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Add Another Referral Code</span>
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 border border-gray-300 text-gray-900 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg font-medium"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 bg-black text-white px-4 py-3 hover:bg-gray-900 transition-colors rounded-lg font-medium"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Stage 4: Review & Submit */}
        {step === 4 && (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-light text-black mb-4">Review & Submit</h2>
              <p className="text-gray-800">
                Double-check your application before submitting.
              </p>
            </div>

            {currentDesign && (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid md:grid-cols-2 gap-6">
                  <DesignImageDisplay
                    currentDesign={currentDesign}
                    loadingStates={loadingStates}
                    showQualityIndicator={false}
                    quality={currentDesign?.quality || selectedQuality}
                    onQualityUpgrade={!uploadMode ? handleQuickQualityUpgrade : null}
                    creditsAvailable={qualitiesUsed}
                    designHistory={designHistory}
                  />

                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">{formData.name}</h3>
                    
                    {/* Show description if it exists */}
                    {(formData.description || currentDesign?.aiDescription) && (
                      <p className="text-gray-600 mb-4 italic">
                        {formData.description || currentDesign?.aiDescription}
                      </p>
                    )}
                    
                    <div className="text-sm text-gray-800 space-y-1">
                      <p><span className="font-medium">Item Type:</span> {formData.itemType}</p>
                      <p><span className="font-medium">Category:</span> {formData.selectedCategory ? CLOTHING_CATEGORIES[formData.selectedCategory].name : 'Not selected'}</p>
                      <p><span className="font-medium">Gender:</span> {formData.gender === 'MASCULINE' ? 'Male' : formData.gender === 'FEMININE' ? 'Female' : 'Unisex'}</p>
                      
                      {/* Only show AI-specific fields for AI-generated designs */}
                      {aiGenerationEnabled && !uploadMode && currentDesign && !currentDesign.isUploaded && (
                        <>
                          <p><span className="font-medium">Quality:</span> {(currentDesign.quality === 'studio' || currentDesign.quality === 'medium') ? 'Studio' : 'Runway'}</p>
                          <p><span className="font-medium">Generations used:</span> Studio ({qualitiesUsed.studio}/2) • Runway ({qualitiesUsed.runway}/1)</p>
                        </>
                      )}
                      
                      {formData.referralCodes.filter(code => code.trim()).length > 0 && (
                        <p><span className="font-medium">Referral codes:</span> {formData.referralCodes.filter(code => code.trim()).join(', ')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={() => setStep(3)}
                className="flex-1 border border-gray-300 text-gray-900 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg font-medium"
              >
                Back
              </button>
              <button
                onClick={submitApplication}
                disabled={isLoading}
                className="flex-1 bg-black text-white px-4 py-3 hover:bg-gray-900 disabled:bg-gray-400 transition-colors rounded-lg font-medium"
              >
                {isLoading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>

            {/* Additional error recovery options for submission step */}
            {error && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      Submission failed, but your design is safe!
                    </p>
                    <p className="text-sm text-amber-700 mt-1">
                      Your progress has been saved. You can try submitting again, go back to make changes, or contact support if the problem persists.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          clearError()
                          submitApplication()
                        }}
                        disabled={isLoading}
                        className="text-sm px-3 py-1 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                      >
                        Try Submitting Again
                      </button>
                      <button
                        onClick={() => {
                          clearError()
                          setStep(2)
                        }}
                        className="text-sm px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                      >
                        Go Back to Design
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Image Cropper Modal */}
      {cropperState.isOpen && (
        <ImageCropper
          image={cropperState.image}
          type={cropperState.type}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
} 