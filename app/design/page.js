'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { ANGLES } from '@/utils/imageProcessing';
import { getQualityDisplayName } from '@/utils/clientHelpers';
import QualitySelector from '@/components/credits/QualitySelector';
import ProgressSteps from '@/components/design/ProgressSteps';
import UsageStats from '@/components/design/UsageStats';
import { useDesignGeneration } from '@/hooks/useDesignGeneration';
import DesignImageDisplay from '@/components/design/DesignImageDisplay';
import DesignMessages from '@/components/design/DesignMessages';
import ItemTypeSelector from '@/components/design/ItemTypeSelector';
import ImageCropper from '@/components/design/ImageCropper';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

export default function DesignPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
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
  
  // Design page specific state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false); // For publishing
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hasPublished, setHasPublished] = useState(false); // Track if user has published

  // Challenge-related state
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [challengesLoading, setChallengesLoading] = useState(true);
  const [selectedChallengeIds, setSelectedChallengeIds] = useState([]);

  const EASTERN_TIMEZONE = 'America/New_York';

  // Form states
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('');
  const [gender, setGender] = useState('UNISEX');
  const [userPrompt, setUserPrompt] = useState('');
  const [color, setColor] = useState('');
  const [modelDescription, setModelDescription] = useState('');
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [isEditingItemName, setIsEditingItemName] = useState(false);
  const [isEditingColor, setIsEditingColor] = useState(false);

  // Inpainting states
  const [isInpaintingMode, setIsInpaintingMode] = useState(false);
  const [inpaintingPrompt, setInpaintingPrompt] = useState('');
  const [targetQuality, setTargetQuality] = useState('');

  // Quality selection state
  const [quality, setQuality] = useState('low');
  
  // Upload mode state - toggle between AI generation and user uploads
  const [uploadMode, setUploadMode] = useState(false); // Default to AI generation
  const [uploadedFrontImage, setUploadedFrontImage] = useState(null);
  const [uploadedImageView, setUploadedImageView] = useState('front'); // Track which uploaded image to show
  const [uploadedBackImage, setUploadedBackImage] = useState(null);
  const [uploadValidationMessages, setUploadValidationMessages] = useState({ front: '', back: '' });
  const [uploadValidating, setUploadValidating] = useState({ front: false, back: false });
  
  // Image cropper state
  const [cropperState, setCropperState] = useState({
    isOpen: false,
    image: null,
    type: null // 'front' or 'back'
  });
  
  // Usage tracking state
  const [usageStats, setUsageStats] = useState({
    lowCredits: 0,
    mediumCredits: 0,
    highCredits: 0,
    lowUsedToday: 0,
    mediumUsedToday: 0,
    highUsedToday: 0,
    dailyLowCap: null,
    dailyMediumCap: null,
    dailyHighCap: null,
    plan: 'Starter'
  });

  const steps = [
    { number: 1, title: 'Basic Details' },
    { number: 2, title: 'Design Specifics' },
    { number: 3, title: 'Preview & Publish' }
  ];

  // Initialize canvas when composite image is loaded or inpainting mode changes
  useEffect(() => {
    if (!isInpaintingMode) {
      return;
    }

    // Check if we have the required images based on quality level
    const hasRequiredImages = quality === 'high' 
      ? currentDesign.compositeImage  // High quality needs composite image
      : (currentDesign.frontImage && currentDesign.backImage);  // Low/medium quality needs both front and back images

    if (!hasRequiredImages) {
      setError('Please generate a design first before trying to edit it');
      setIsInpaintingMode(false);
      return;
    }
  }, [currentDesign.compositeImage, currentDesign.frontImage, currentDesign.backImage, isInpaintingMode, quality]);

  // Fetch active challenges
  const fetchActiveChallenges = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/challenges/user-active');
      if (response.ok) {
        const data = await response.json();
        setActiveChallenges(data.activeChallenges || []);
      }
    } catch (error) {
      console.error('Error fetching active challenges:', error);
    } finally {
      setChallengesLoading(false);
    }
  };

  // Fetch user usage stats
  const fetchUsageStats = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUsageStats();
      fetchActiveChallenges();
    }
  }, [session?.user?.uid, status]);

  // Handle redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  // Prevent navigation back to design page after publishing
  useEffect(() => {
    const handlePopState = (event) => {
      if (hasPublished) {
        // Prevent going back and redirect to home
        event.preventDefault();
        router.replace('/');
      }
    };

    if (hasPublished) {
      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    }
  }, [hasPublished, router]);

  // Check if user is trying to access design page after publishing (via direct URL or bookmark)
  useEffect(() => {
    const wasPublished = sessionStorage.getItem('designPublished');
    if (wasPublished === 'true') {
      // Clear the flag and redirect to home
      sessionStorage.removeItem('designPublished');
      router.replace('/');
    }
  }, [router]);

  // Load saved progress when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.uid) {
      loadSavedProgress();
    }
  }, [status, session?.user?.uid]);

  // Auto-save progress when state changes (debounced)
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.uid) {
      const timeoutId = setTimeout(() => {
        saveProgress();
      }, 2000); // Debounce for 2 seconds
      
      return () => clearTimeout(timeoutId);
    }
  }, [
    status,
    session?.user?.uid,
    currentStep,
    itemName,
    itemType,
    selectedCategory,
    gender,
    userPrompt,
    color,
    modelDescription,
    quality,
    currentDesign.aiDescription,
    currentDesign.frontImage,
    currentDesign.backImage,
    currentDesign.compositeImage,
    selectedChallengeIds,
    isInpaintingMode,
    inpaintingPrompt,
    targetQuality,
    uploadMode,
    uploadedFrontImage,
    uploadedBackImage
  ]);

  // Load saved progress
  const loadSavedProgress = async () => {
    try {
      const response = await fetch('/api/design/progress');
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          const progress = data.progress;
          
          // Check if this is a substantial cached design (has generated images)
          const hasGeneratedDesign = progress.frontImage || progress.backImage || progress.compositeImage;
          
          // Restore form state
          setCurrentStep(progress.currentStep || 1);
          setUploadMode(progress.uploadMode || false);
          setItemName(progress.itemName || '');
          setItemType(progress.itemType || '');
          setSelectedCategory(progress.selectedCategory || null);
          setGender(progress.gender || 'UNISEX');
          setUserPrompt(progress.userPrompt || '');
          setColor(progress.color || '');
          setModelDescription(progress.modelDescription || '');
          setQuality(progress.quality || 'low');
          
          // Restore upload images
          setUploadedFrontImage(progress.uploadedFrontImage || null);
          setUploadedBackImage(progress.uploadedBackImage || null);
          
          // Restore generated design data
          setCurrentDesign({
            aiDescription: progress.aiDescription || '',
            frontImage: progress.frontImage || null,
            backImage: progress.backImage || null,
            compositeImage: progress.compositeImage || null
          });
          
          // Restore challenge selection
          setSelectedChallengeIds(progress.selectedChallengeIds || []);
          
          // Restore edit mode state
          setIsInpaintingMode(progress.isInpaintingMode || false);
          setInpaintingPrompt(progress.inpaintingPrompt || '');
          setTargetQuality(progress.targetQuality || '');
          
          console.log('Design progress loaded successfully');
          
          // Show notice if there's a substantial cached design
          if (hasGeneratedDesign) {
            setSuccess('Previous design loaded from cache. If you want to start fresh, click "Start Over" above.');
            setTimeout(() => setSuccess(''), 8000); // Show for 8 seconds
          }
        }
      }
    } catch (error) {
      console.error('Failed to load design progress:', error);
    }
  };

  // Save current progress
  const saveProgress = async () => {
    if (!session?.user?.uid) return;
    
    // Only save if there's meaningful progress (beyond step 1 with empty fields)
    const hasProgress = currentStep > 1 || 
                       itemName.trim() || 
                       itemType.trim() || 
                       userPrompt.trim() || 
                       currentDesign.frontImage || 
                       currentDesign.backImage;
    
    if (!hasProgress) return;
    
    const progressData = {
      currentStep,
      uploadMode,
      itemName: itemName.trim() || null,
      itemType: itemType.trim() || null,
      gender,
      userPrompt: userPrompt.trim() || null,
      color: color.trim() || null,
      modelDescription: modelDescription.trim() || null,
      quality: uploadMode ? null : quality, // No quality for uploads
      uploadedFrontImage,
      uploadedBackImage,
      aiDescription: currentDesign.aiDescription?.trim() || null,
      frontImage: currentDesign.frontImage,
      backImage: currentDesign.backImage,
      compositeImage: currentDesign.compositeImage,
      selectedChallengeIds,
      isInpaintingMode,
      inpaintingPrompt: inpaintingPrompt?.trim() || null,
      targetQuality: targetQuality?.trim() || null
    };
    
    try {
      const response = await fetch('/api/design/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressData)
      });
      
      if (response.ok) {
        console.log('Design progress saved successfully');
      }
    } catch (error) {
      console.error('Failed to save design progress:', error);
    }
  };

  // Start over - clear all progress
  const handleStartOver = async () => {
    if (!window.confirm('Are you sure you want to start over? This will clear all your current progress and cannot be undone.')) {
      return;
    }
    
    try {
      // Clear saved progress from database
      await fetch('/api/design/progress', { method: 'DELETE' });
      
      // Reset all state to initial values
      setCurrentStep(1);
      setItemName('');
      setItemType('');
      setSelectedCategory(null);
      setGender('UNISEX');
      setUserPrompt('');
      setColor('');
      setModelDescription('');
      setQuality('low');
      setUploadMode(false);
      setUploadedFrontImage(null);
      setUploadedBackImage(null);
      setUploadValidationMessages({ front: '', back: '' });
      setUploadValidating({ front: false, back: false });
      setCurrentDesign({
        aiDescription: '',
        frontImage: null,
        backImage: null,
        compositeImage: null
      });
      setSelectedChallengeIds([]);
      setIsInpaintingMode(false);
      setInpaintingPrompt('');
      setTargetQuality('');
      setError(null);
      setIsEditingDescription(false);
      setIsEditingItemName(false);
      setIsEditingColor(false);
      
      console.log('Design progress cleared successfully');
    } catch (error) {
      console.error('Failed to clear design progress:', error);
      setError('Failed to start over. Please try again.');
    }
  };

  // Function to refresh usage stats
  const refreshUsageStats = async () => {
    if (!session?.user?.uid) return;
    
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsageStats(data.usage);
        
        // Dispatch custom event to update nav bar credits immediately
        window.dispatchEvent(new CustomEvent('creditsUpdated'));
      }
    } catch (error) {
      console.error('Error refreshing usage stats:', error);
    }
  };

  // Image upload handler - validates content, then opens cropper for user to manually crop
  const handleImageUpload = async (file, type) => {
    if (!file) return;
    
    // Validate file size (max 10MB for user uploads)
    if (file.size > 10 * 1024 * 1024) {
      setError(`${type === 'front' ? 'Front' : 'Back'} image file size must be less than 10MB`);
      return;
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(`Please upload a valid image file (PNG, JPG, etc.) for ${type} view`);
      return;
    }
    
    // Set validating state
    setUploadValidating(prev => ({ ...prev, [type]: true }));
    setUploadValidationMessages(prev => ({ ...prev, [type]: 'Validating image...' }));
    clearError();
    
    // Load image and check if it's large enough
    const reader = new FileReader();
    reader.onloadend = async () => {
      const img = new Image();
      img.onload = async () => {
        const width = img.width;
        const height = img.height;
        
        console.log(`[Upload] ${type} image dimensions: ${width}x${height}`);
        
        // Check if image is large enough to crop to target dimensions
        const targetWidth = 683;
        const targetHeight = 1024;
        
        if (width < targetWidth || height < targetHeight) {
          setError(`Image is too small. Minimum dimensions: ${targetWidth}×${targetHeight}px. Your image: ${width}×${height}px`);
          setUploadValidating(prev => ({ ...prev, [type]: false }));
          setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
          return;
        }
        
        // Validate image content with AI
        try {
          console.log(`[Upload] Validating ${type} image content...`);
          const validationResponse = await fetch('/api/design/validate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: reader.result,
              type: type
            })
          });
          
          if (!validationResponse.ok) {
            throw new Error('Failed to validate image');
          }
          
          const validationData = await validationResponse.json();
          const validation = validationData.validation;
          
          console.log(`[Upload] Validation result:`, validation);
          
          if (!validation.isValid) {
            // Image failed validation
            const violationsList = validation.violations && validation.violations.length > 0
              ? '\n\n• ' + validation.violations.join('\n• ')
              : '';
            
            const errorMessage = `${type === 'front' ? 'Front' : 'Back'} image validation failed:\n\n${validation.reason}${violationsList}${validation.suggestions ? '\n\nSuggestion: ' + validation.suggestions : ''}`;
            
            setError(errorMessage);
            setUploadValidating(prev => ({ ...prev, [type]: false }));
            setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
            return;
          }
          
          console.log(`[Upload] ${type} image passed validation`);
          
        } catch (validationError) {
          console.error(`[Upload] Validation error:`, validationError);
          setError(`Failed to validate ${type} image. Please try again.`);
          setUploadValidating(prev => ({ ...prev, [type]: false }));
          setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
          return;
        }
        
        // Clear validating state
        setUploadValidating(prev => ({ ...prev, [type]: false }));
        setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
        
        // Check if dimensions match exactly - no need to crop
        if (width === targetWidth && height === targetHeight) {
          console.log(`[Upload] ${type} image has perfect dimensions, skipping crop`);
          if (type === 'front') {
            setUploadedFrontImage(reader.result);
            setUploadValidationMessages(prev => ({ ...prev, front: '✓ Image ready' }));
          } else {
            setUploadedBackImage(reader.result);
            setUploadValidationMessages(prev => ({ ...prev, back: '✓ Image ready' }));
          }
          clearError();
          return;
        }
        
        // Image needs cropping - open cropper
        console.log(`[Upload] ${type} image needs cropping, opening cropper`);
        setCropperState({
          isOpen: true,
          image: reader.result,
          type: type
        });
        clearError();
      };
      
      img.onerror = () => {
        setError(`Failed to load ${type} image. Please try a different file.`);
        setUploadValidating(prev => ({ ...prev, [type]: false }));
        setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
      };
      
      img.src = reader.result;
    };
    
    reader.onerror = () => {
      setError(`Failed to read ${type} image file`);
      setUploadValidating(prev => ({ ...prev, [type]: false }));
      setUploadValidationMessages(prev => ({ ...prev, [type]: '' }));
    };
    
    reader.readAsDataURL(file);
  };
  
  // Handle crop completion
  const handleCropComplete = (croppedImage) => {
    const { type } = cropperState;
    
    console.log(`[Crop Complete] Cropped ${type} image to 683x1024px`);
    
    if (type === 'front') {
      setUploadedFrontImage(croppedImage);
      setUploadValidationMessages(prev => ({ ...prev, front: '✓ Image ready' }));
    } else {
      setUploadedBackImage(croppedImage);
      setUploadValidationMessages(prev => ({ ...prev, back: '✓ Image ready' }));
    }
    
    // Close cropper
    setCropperState({
      isOpen: false,
      image: null,
      type: null
    });
  };
  
  // Handle crop cancellation
  const handleCropCancel = () => {
    console.log('[Crop Cancel] User cancelled cropping');
    setCropperState({
      isOpen: false,
      image: null,
      type: null
    });
  };

  const handleGenerateDesign = async () => {
    try {
      setLoading(true);
      
      // Clear existing design to ensure fresh generation
      setCurrentDesign({
        aiDescription: '',
        frontImage: null,
        backImage: null,
        compositeImage: null
      });
      
      // Reset inpainting mode state
      setIsInpaintingMode(false);
      setInpaintingPrompt('');
      setTargetQuality('');
      
      // Extract color from prompt if not provided
      const extractedColor = color.trim() || extractColorFromPrompt(userPrompt);
      
      // Generate the design using the shared function
      const result = await generateDesign({
        itemName,
        itemType,
        userPrompt,
        gender,
        color: extractedColor,
        modelDescription,
        quality,
        userSession: session,
        refreshUsageStats,
        isEditing: false, // Explicitly set to false for fresh generation
        isWaitlistApplication: false
      });
      
      // Don't set currentStep here since it's already set in handleSubmit
      
    } catch (error) {
      console.error('Error generating design:', error);
      // Error is already set by the shared function
    } finally {
      setLoading(false);
    }
  };

  const handleInpainting = async () => {
    // Validation - allow empty prompt for quality upgrades
    const isQualityUpgrade = targetQuality && targetQuality !== quality;
    if (!inpaintingPrompt.trim() && !isQualityUpgrade) {
      setError('Please enter modification instructions.');
      return;
    }

    if (!currentDesign.compositeImage && !currentDesign.frontImage && !currentDesign.backImage) {
      setError('Please generate a design first.');
      return;
    }

    try {
      setLoading(true);
      
      // Use the shared generateDesign function with editing parameters
      const result = await generateDesign({
        prompt: inpaintingPrompt.trim() || (isQualityUpgrade ? 'Quality upgrade' : ''),
        quality: targetQuality || quality,
        targetQuality: targetQuality || quality,
        userSession: session,
        refreshUsageStats,
        originalImage: currentDesign.compositeImage,
        frontImage: currentDesign.frontImage,
        backImage: currentDesign.backImage,
        isEditing: true,
        isWaitlistApplication: false
      });

      // Update quality if it was changed (quality upgrade/downgrade)
      if (targetQuality && targetQuality !== quality) {
        setQuality(targetQuality);
        console.log(`[Design Page] Quality updated from ${quality} to ${targetQuality}`);
      }

      // Clear inpainting state
      setInpaintingPrompt('');
      setIsInpaintingMode(false);
      setTargetQuality('');

    } catch (error) {
      console.error('[Design Page] Inpainting error:', error);
      // Error is already set by the shared function
    } finally {
      setLoading(false);
    }
  };

  // Quick quality upgrade function for image display buttons
  const handleQuickQualityUpgrade = async (newQuality) => {
    if (!currentDesign.compositeImage && !currentDesign.frontImage && !currentDesign.backImage) {
      setError('Please generate a design first.');
      return;
    }

    try {
      setLoading(true);
      clearError();
      
      // Use the shared generateDesign function with quality upgrade parameters
      const result = await generateDesign({
        prompt: 'Quality upgrade',
        quality: newQuality,
        targetQuality: newQuality,
        userSession: session,
        refreshUsageStats,
        originalImage: currentDesign.compositeImage,
        frontImage: currentDesign.frontImage,
        backImage: currentDesign.backImage,
        isEditing: true,
        isWaitlistApplication: false
      });

      // Update quality
      setQuality(newQuality);
      console.log(`[Design Page] Quality upgraded from ${quality} to ${newQuality}`);

    } catch (error) {
      console.error('[Design Page] Quality upgrade error:', error);
      // Error is already set by the shared function
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (currentStep === 2) {
      if (uploadMode) {
        // Upload mode: validate uploads and move to step 3
        if (!uploadedFrontImage || !uploadedBackImage) {
          setError('Please upload both front and back images');
          return;
        }
        
        // Set the uploaded images as current design
        setCurrentDesign({
          aiDescription: userPrompt || `${itemName} - ${itemType}`,
          frontImage: uploadedFrontImage,
          backImage: uploadedBackImage,
          compositeImage: null
        });
        
        setCurrentStep(3);
      } else {
        // AI Generation mode: Generate design and move to step 3
        setCurrentStep(3);
        // Start generation after a brief delay to allow UI to update
        setTimeout(() => {
          handleGenerateDesign();
        }, 100);
      }
    } else if (currentStep === 3 && isInpaintingMode) {
      // Step 3 with inpainting mode: Do inpainting
      const isQualityUpgrade = targetQuality && targetQuality !== quality;
      if (!inpaintingPrompt.trim() && !isQualityUpgrade) {
        setError('Please provide edit instructions describing what you want to change');
        return;
      }
      await handleInpainting();
    } else {
      // Step 1: Just move to next step - no generation
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePublish = async () => {
    try {
      setLoading(true);
      setError(null);

      const imageUrls = {};
      if (currentDesign.frontImage) imageUrls[ANGLES.FRONT] = currentDesign.frontImage;
      if (currentDesign.backImage) imageUrls[ANGLES.BACK] = currentDesign.backImage;

      // Build payload differently for uploaded vs AI-generated designs
      const payload = {
        name: itemName,
        description: currentDesign.aiDescription,
        itemType,
        gender,
        imageUrls,
        color,
        isPublished: true,
        isUploadedDesign: uploadMode, // Flag to indicate design type
      };

      // Only add AI-specific fields if NOT in upload mode
      if (!uploadMode) {
        payload.promptRaw = userPrompt;
        payload.promptSanitized = currentDesign.aiDescription;
        payload.quality = quality;
        payload.promptJsonData = JSON.stringify({
          itemDescription: `${itemType} in ${color}`,
          designDetails: currentDesign.aiDescription,
          frontText: currentDesign.aiDescription,
          backText: '',
          modelDetails: modelDescription || 'Professional model',
          style: itemType,
          color,
          texture: 'Premium fabric'
        });
      }

      const response = await fetch('/api/saved-clothing-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to publish item');
      }

      const data = await response.json();
      
      // Add to selected challenge if any are selected
      if (selectedChallengeIds.length > 0) {
        for (const challengeId of selectedChallengeIds) {
          try {
            await fetch('/api/challenges/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                challengeId,
                clothingItemId: data.clothingItem.id
              }),
            });
          } catch (challengeError) {
            console.error('Failed to submit to challenge:', challengeError);
            // Don't fail the entire publish process for challenge submission errors
          }
        }
      }

      // Clear saved progress since design is now published
      // Improved error handling with retry logic
      let clearSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;
      
      while (!clearSuccess && retryCount < maxRetries) {
        try {
          const clearResponse = await fetch('/api/design/progress', { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (clearResponse.ok) {
            clearSuccess = true;
            console.log('Design progress cleared successfully');
          } else {
            const errorData = await clearResponse.json();
            throw new Error(errorData.error || 'Failed to clear progress');
          }
        } catch (progressError) {
          retryCount++;
          console.error(`Failed to clear design progress (attempt ${retryCount}/${maxRetries}):`, progressError);
          
          if (retryCount < maxRetries) {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          } else {
            // Final attempt failed - show warning but don't block publish
            console.warn('WARNING: Failed to clear design progress after all retries. Cached design may persist.');
            setError('Design published successfully, but there may be cached data. Please manually clear your design cache if needed.');
          }
        }
      }

      // If cache clearing failed completely, clear the local state to prevent immediate re-loading
      if (!clearSuccess) {
        // Reset all local state to prevent the cached design from showing
        setCurrentStep(1);
        setItemName('');
        setItemType('');
        setSelectedCategory(null);
        setGender('UNISEX');
        setUserPrompt('');
        setColor('');
        setModelDescription('');
        setQuality('low');
        setCurrentDesign({
          aiDescription: '',
          frontImage: null,
          backImage: null,
          compositeImage: null
        });
        setSelectedChallengeIds([]);
        setIsInpaintingMode(false);
        setInpaintingPrompt('');
        setTargetQuality('');
      }

      // Mark as published to prevent back navigation
      setHasPublished(true);
      
      // Set flag in sessionStorage to prevent future access to design page
      sessionStorage.setItem('designPublished', 'true');
      
      // Replace current page in history to prevent back navigation
      router.replace(`/clothing/${data.clothingItem.id}?from=design`);
    } catch (error) {
      console.error('Failed to publish item:', error);
      setError(error.message || 'Failed to publish item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!session?.user) {
    return <div className="flex justify-center items-center min-h-screen">Redirecting...</div>;
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Active Challenges Banner */}
        {!challengesLoading && activeChallenges.length > 0 && (
          <div className="mb-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-700">
            <div className="relative p-8">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                  backgroundSize: '60px 60px'
                }}></div>
              </div>
              
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                        <span className="text-2xl">🎯</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white mb-1">Active Challenges</h2>
                        <p className="text-slate-300 text-sm">
                          {activeChallenges.filter(c => !c.hasSubmitted).length} challenge{activeChallenges.filter(c => !c.hasSubmitted).length !== 1 ? 's' : ''} available today
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {activeChallenges.slice(0, 3).map((challenge) => (
                        <div key={challenge.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-white text-lg">{challenge.theme}</h3>
                                {challenge.hasSubmitted && (
                                  <span className="inline-flex items-center px-2 py-1 bg-green-500/20 text-green-300 rounded-full text-xs font-medium border border-green-500/30">
                                    ✓ Submitted
                                  </span>
                                )}
                              </div>
                              {challenge.mainItem && (
                                <p className="text-slate-300 text-sm mb-2">Required: {challenge.mainItem}</p>
                              )}
                              <p className="text-slate-400 text-xs">
                                Global Challenge
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-slate-400 text-xs mb-1">Deadline:</p>
                              <p className="text-white font-medium">
                                {dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {activeChallenges.length > 3 && (
                      <p className="text-slate-400 text-sm mt-3">
                        + {activeChallenges.length - 3} more challenge{activeChallenges.length - 3 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
          
        {/* Progress Steps */}
        <ProgressSteps steps={steps} currentStep={currentStep} />

        {/* Start Over Button - Only show if there's progress to clear */}
        {(currentStep > 1 || itemName.trim() || itemType.trim() || userPrompt.trim() || currentDesign.frontImage || currentDesign.backImage) && (
          <div className="flex justify-end mb-6">
            <button
              type="button"
              onClick={handleStartOver}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 hover:border-red-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Start Over
            </button>
          </div>
        )}

        {/* Usage Stats Display - Only show for AI generation mode */}
        {!uploadMode && <UsageStats usageStats={usageStats} />}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Item Name
                </label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g., Classic Cotton Hoodie"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                  maxLength={50}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Item Type
                </label>
                <ItemTypeSelector
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  itemType={itemType}
                  onItemTypeChange={setItemType}
                  gender={gender}
                  onGenderChange={setGender}
                />
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div className="space-y-8">
              {/* Mode Toggle */}
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

              {uploadMode ? (
                /* UPLOAD MODE UI */
                <div className="space-y-6">
                  {/* AI Generation Tips - Collapsible */}
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
${itemType || '[Your item type]'} in ${color || '[Your color]'}
${userPrompt || '[Your design description]'}

SUGGESTIONS:
- Model: ${gender === 'MASCULINE' ? 'Male' : gender === 'FEMININE' ? 'Female' : 'Any'} ${modelDescription ? `- ${modelDescription}` : ''}
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

ITEM: ${itemType || '[Your item]'} in ${color || '[color]'}
${userPrompt ? `Design: ${userPrompt}` : 'Design: [your description]'}

SUGGESTIONS:
- Model: ${gender === 'MASCULINE' ? 'Male' : gender === 'FEMININE' ? 'Female' : 'Any'} ${modelDescription ? `- ${modelDescription}` : ''}
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
${itemType || '[Your item type]'} in ${color || '[Your color]'}
${userPrompt || '[Describe back design - logos, patterns, etc.]'}

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

ITEM (BACK): ${itemType || '[Your item]'} 
Back details: ${userPrompt || '[back design elements]'}

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
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Describe your uploaded design... This will be shown on the published item."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-gray-900 placeholder-gray-500"
                      rows={4}
                      maxLength={1000}
                      required
                    />
                  </div>
                </div>
              ) : (
                /* AI GENERATION MODE UI */
                <>
                  <div className="pt-4">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Clothing Item Design Prompt
                    </label>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Describe your design vision in detail... This will be used to generate the design but won't be publicly visible."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                      rows={4}
                      maxLength={1000}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Primary Color
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g., Navy Blue, Forest Green"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-600"
                      maxLength={50}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Model and Additional Clothing Description
                    </label>
                    <p className="text-xs text-gray-600 mb-3">
                      Describe the model&apos;s appearance, pose, styling, and any additional clothing items you&apos;d like them to wear (pants, shoes, accessories, etc.). Leave blank for auto-generated professional model description.
                    </p>
                    <textarea
                      value={modelDescription}
                      onChange={(e) => setModelDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-black focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="e.g., &apos;Athletic young woman in black jeans and white sneakers with confident pose&apos; or &apos;Mature professional wearing dark slacks and dress shoes with formal styling&apos;"
                    />
                  </div>

                  <div className="pt-2">
                  <QualitySelector
                    quality={quality}
                    setQuality={setQuality}
                    disabled={loading}
                      usageStats={usageStats}
                  />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">Review & Publish Your Design</h3>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column - Details */}
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Item Details</h4>
                          <div className="mt-3 bg-gray-50 rounded-lg p-4 space-y-3">
                            <div>
                              <div className="flex items-center justify-between">
                                <dt className="text-sm font-medium text-gray-700">Item Name</dt>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingItemName(!isEditingItemName)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                              {isEditingItemName ? (
                                <input
                                  type="text"
                                  value={itemName}
                                  onChange={(e) => setItemName(e.target.value)}
                                  onBlur={() => setIsEditingItemName(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingItemName(false);
                                  }}
                                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                  autoFocus
                                />
                              ) : (
                                <dd className="mt-1 text-sm text-gray-900 font-medium">{itemName}</dd>
                              )}
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Type</dt>
                              <dd className="mt-1 text-sm text-gray-900 font-medium">{itemType}</dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-gray-700">Target Gender</dt>
                              <dd className="mt-1 text-sm text-gray-900 font-medium">
                                {gender === 'MASCULINE' && 'Men'}
                                {gender === 'FEMININE' && 'Women'}
                                {gender === 'UNISEX' && 'Unisex'}
                              </dd>
                            </div>
                            <div>
                              <div className="flex items-center justify-between">
                                <dt className="text-sm font-medium text-gray-700">Color</dt>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingColor(!isEditingColor)}
                                  className="text-gray-400 hover:text-indigo-600 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                              </div>
                              {isEditingColor ? (
                                <input
                                  type="text"
                                  value={color}
                                  onChange={(e) => setColor(e.target.value)}
                                  onBlur={() => setIsEditingColor(false)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') setIsEditingColor(false);
                                  }}
                                  className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                                  autoFocus
                                />
                              ) : (
                                <dd className="mt-1 text-sm text-gray-900 font-medium">{color}</dd>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Description</h4>
                            <button
                              type="button"
                              onClick={() => setIsEditingDescription(!isEditingDescription)}
                              className="text-gray-400 hover:text-indigo-600 transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                          <div className="mt-3">
                            {loadingStates.description ? (
                              <div className="w-full h-24 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
                                <div className="text-sm text-gray-500">Generating description...</div>
                              </div>
                            ) : isEditingDescription ? (
                              <textarea
                                value={currentDesign.aiDescription}
                                onChange={(e) => setCurrentDesign({ ...currentDesign, aiDescription: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 text-sm"
                              />
                            ) : currentDesign.aiDescription ? (
                              <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-4 font-medium leading-relaxed">{currentDesign.aiDescription}</p>
                            ) : (
                              <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-200">
                                <div className="text-sm text-gray-400">Description will appear here</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Design Display */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">
                        {uploadMode ? 'Uploaded Design' : 'Generated Design'}
                      </h4>
                      
                      {uploadMode ? (
                        /* Upload Mode - Simple Image Display */
                        <div className="relative">
                          <div className="relative aspect-[683/1024] bg-gray-100 rounded-lg overflow-hidden shadow-md">
                            {currentDesign?.frontImage ? (
                              <img
                                src={uploadedImageView === 'front' 
                                  ? currentDesign.frontImage 
                                  : (currentDesign.backImage || currentDesign.frontImage)
                                }
                                alt={`Uploaded design - ${uploadedImageView} view`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                  <div className="text-lg mb-2">📤</div>
                                  <div className="text-sm">Your uploaded design</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Navigation arrows for uploaded designs - only show when both images exist */}
                          {currentDesign?.frontImage && currentDesign?.backImage && (
                            <>
                              <div className="absolute inset-y-0 left-0 flex items-center">
                                <button
                                  type="button"
                                  onClick={() => setUploadedImageView(uploadedImageView === 'front' ? 'back' : 'front')}
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
                                  onClick={() => setUploadedImageView(uploadedImageView === 'front' ? 'back' : 'front')}
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
                                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${uploadedImageView === 'front' ? 'bg-white' : 'bg-white/50'}`}></div>
                                  <div className={`w-2 h-2 rounded-full transition-all duration-200 ${uploadedImageView === 'back' ? 'bg-white' : 'bg-white/50'}`}></div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* AI Generation Mode - Full DesignImageDisplay */
                        <DesignImageDisplay 
                          currentDesign={currentDesign}
                          loadingStates={loadingStates}
                          quality={quality}
                          showQualityIndicator={!uploadMode}
                          onQualityUpgrade={!uploadMode ? handleQuickQualityUpgrade : null}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Design Section - Only show if not in upload mode */}
              {!uploadMode && (
                <div className="mt-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Edit Design</h3>
                  </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={() => setIsInpaintingMode(!isInpaintingMode)}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-md ${
                        isInpaintingMode
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-white text-gray-700 border border-gray-300'
                      }`}
                    >
                      {isInpaintingMode ? 'Exit Edit Mode' : 'Edit Design'}
                    </button>
                    
                    {isInpaintingMode && (
                      <div className="space-y-4 bg-gray-50 rounded-lg p-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm text-blue-700">
                                <strong>How it works:</strong> Describe the changes you want to make and we&apos;ll apply them to the entire design while preserving the model and background.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Edit Instructions
                          </label>
                          <p className="text-xs text-gray-600 mb-2">
                            Describe what changes you want to make. Be specific about placement and appearance.
                            {targetQuality && targetQuality !== quality && (
                              <span className="text-green-600 font-medium"> Or leave blank to only upgrade quality.</span>
                            )}
                          </p>
                          <textarea
                            value={inpaintingPrompt}
                            onChange={(e) => setInpaintingPrompt(e.target.value)}
                            placeholder={
                              targetQuality && targetQuality !== quality 
                                ? "Optional: Add specific changes, or leave blank to only upgrade quality"
                                : "e.g., 'Add a small red heart logo to the center of the chest' or 'Change the sleeves to long sleeves'"
                            }
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-gray-900 placeholder-gray-500 text-base focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        </div>

                        {/* Target Quality Selector for Cross-Quality Editing */}
                        <div>
                          <label className="block text-sm font-medium text-gray-900 mb-2">
                            Target Quality (Optional)
                          </label>
                          <p className="text-xs text-gray-600 mb-3">
                            Choose a different quality level for your edit. Leave blank to keep current quality ({quality}).
                          </p>
                          <div className="grid grid-cols-3 gap-3">
                            <button
                              type="button"
                              onClick={() => setTargetQuality(targetQuality === 'low' ? '' : 'low')}
                              disabled={quality === 'low'}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                targetQuality === 'low'
                                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                                  : quality === 'low'
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span>✏️</span>
                                <span>Sketch</span>
                              </div>
                              {quality === 'low' && (
                                <div className="text-xs text-gray-500 mt-1">Current</div>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setTargetQuality(targetQuality === 'medium' ? '' : 'medium')}
                              disabled={quality === 'medium'}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                targetQuality === 'medium'
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : quality === 'medium'
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span>🎨</span>
                                <span>Studio</span>
                              </div>
                              {quality === 'medium' && (
                                <div className="text-xs text-gray-500 mt-1">Current</div>
                              )}
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => setTargetQuality(targetQuality === 'high' ? '' : 'high')}
                              disabled={quality === 'high'}
                              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                targetQuality === 'high'
                                  ? 'border-purple-500 bg-purple-50 text-purple-700'
                                  : quality === 'high'
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-300 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <span>✨</span>
                                <span>Runway</span>
                              </div>
                              {quality === 'high' && (
                                <div className="text-xs text-gray-500 mt-1">Current</div>
                              )}
                            </button>
                          </div>
                          
                          {targetQuality && targetQuality !== quality && (
                            <div className="mt-3">
                              {/* Check if it's an upgrade or downgrade */}
                              {(() => {
                                const qualityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
                                const currentLevel = qualityLevels[quality];
                                const targetLevel = qualityLevels[targetQuality];
                                const isUpgrade = targetLevel > currentLevel;
                                const isDowngrade = targetLevel < currentLevel;
                                
                                if (isUpgrade) {
                                  return (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <div className="flex items-center space-x-2">
                                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-8 8" />
                                        </svg>
                                        <p className="text-sm text-green-700">
                                          <strong>Quality Upgrade:</strong> Your design will be converted from {getQualityDisplayName(quality)} to {getQualityDisplayName(targetQuality)} quality.
                                        </p>
                                      </div>
                                    </div>
                                  );
                                } else if (isDowngrade) {
                                  return (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                      <div className="flex items-start space-x-2">
                                        <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0-2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L5.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <div className="text-sm text-amber-800">
                                          <p className="font-medium">Quality Downgrade Warning</p>
                                          <p className="text-xs mt-1">You&apos;re about to downgrade from {getQualityDisplayName(quality)} to {getQualityDisplayName(targetQuality)} quality. This will reduce the visual quality of your design.</p>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={handleInpainting}
                            disabled={(!inpaintingPrompt.trim() && !(targetQuality && targetQuality !== quality)) || loadingStates.image}
                            className="flex-1 px-4 py-3 text-base font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                          >
                            {loadingStates.image ? 'Applying...' : (() => {
                              if (targetQuality && targetQuality !== quality && !inpaintingPrompt.trim()) {
                                const qualityLevels = { 'low': 1, 'medium': 2, 'high': 3 };
                                const currentLevel = qualityLevels[quality];
                                const targetLevel = qualityLevels[targetQuality];
                                const isUpgrade = targetLevel > currentLevel;
                                const qualityName = getQualityDisplayName(targetQuality);
                                
                                if (isUpgrade) {
                                  return `Upgrade to ${qualityName}`;
                                } else {
                                  return `Downgrade to ${qualityName}`;
                                }
                              }
                              return 'Apply Changes';
                            })()}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              )}

              {/* Challenge Submission Section */}
              {activeChallenges.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="border-b border-gray-200 bg-slate-50 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">🎯 Challenge Submission (Optional)</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      You can submit this design to challenges or just publish it normally to your profile.
                    </p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {/* Option to skip challenges */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer ${
                            selectedChallengeIds.length === 0
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}
                          onClick={() => setSelectedChallengeIds([])}
                          >
                            {selectedChallengeIds.length === 0 && (
                              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">Just publish to my profile</h4>
                            <p className="text-gray-600 text-sm">
                              Don&apos;t submit to any challenges, just add to my clothing collection
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Challenge options */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-sm uppercase tracking-wide">Or submit to challenges:</h4>
                        {activeChallenges.map((challenge) => {
                          const isSelected = selectedChallengeIds.includes(challenge.id);
                          const isMatchingTheme = userPrompt.toLowerCase().includes(challenge.theme.toLowerCase()) ||
                                                 (challenge.mainItem && itemType.toLowerCase().includes(challenge.mainItem.toLowerCase()));
                          
                          return (
                            <div
                              key={challenge.id}
                              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                                challenge.hasSubmitted
                                  ? 'border-gray-200 bg-gray-50 opacity-60'
                                  : isSelected
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-200 hover:border-indigo-300'
                              }`}
                              onClick={() => {
                                if (challenge.hasSubmitted) return;
                                
                                if (isSelected) {
                                  setSelectedChallengeIds(prev => prev.filter(id => id !== challenge.id));
                                } else {
                                  setSelectedChallengeIds(prev => [...prev, challenge.id]);
                                }
                              }}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                      challenge.hasSubmitted
                                        ? 'border-gray-300 bg-gray-100'
                                        : isSelected
                                        ? 'border-indigo-500 bg-indigo-500'
                                        : 'border-gray-300'
                                    }`}>
                                      {challenge.hasSubmitted ? (
                                        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : isSelected ? (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      ) : null}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900">{challenge.theme}</h4>
                                        {isMatchingTheme && !challenge.hasSubmitted && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Great match!
                                          </span>
                                        )}
                                        {challenge.hasSubmitted && (
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            Already submitted
                                          </span>
                                        )}
                                      </div>
                                      {challenge.mainItem && (
                                        <p className="text-sm text-gray-600 mt-1">
                                          Required item: {challenge.mainItem}
                                        </p>
                                      )}
                                      <div className="flex items-center justify-between mt-2">
                                        <p className="text-xs text-gray-500">
                                          Global Challenge
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Deadline: {dayjs.utc(challenge.submissionDeadline).tz(EASTERN_TIMEZONE).format('h:mm A')} ET
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {selectedChallengeIds.length > 0 && (
                      <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <p className="text-sm text-indigo-700">
                          ✓ Selected {selectedChallengeIds.length} challenge{selectedChallengeIds.length !== 1 ? 's' : ''} for submission
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error and Success Messages */}
              <DesignMessages
                error={error}
                success={success}
                actions={{
                  retry: () => {
                    clearError()
                    handleGenerateDesign()
                  },
                  startOver: () => {
                    clearError()
                    handleStartOver()
                  },
                  continue: () => {
                    clearError()
                  }
                }}
                showContinue={!!(currentDesign.frontImage || currentDesign.backImage || currentDesign.compositeImage)}
                loadingStates={loadingStates}
                loading={loading}
                onClose={() => {
                  clearError()
                }}
              />


            </div>
          )}

              {/* Navigation Buttons - Outside step conditions */}
              <div className="flex justify-between pt-6">
                <div>
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(currentStep - 1)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                      Back
                    </button>
                  )}
                </div>
                <div className="flex gap-3">
                  {currentStep === 3 ? (
                    <>
                      {!uploadMode && (
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          disabled={loadingStates.image || loadingStates.description}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                        >
                          Regenerate Design
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={loadingStates.image || loadingStates.description || loading}
                        className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                          loadingStates.image || loadingStates.description || loading
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                        }`}
                      >
                        {loading ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Publishing...
                          </>
                        ) : (
                          'Publish Design'
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="submit"
                      disabled={
                        (currentStep === 1 && (!itemName.trim() || !itemType.trim())) ||
                        (currentStep === 2 && uploadMode && (!uploadedFrontImage || !uploadedBackImage || !userPrompt.trim() || uploadValidating.front || uploadValidating.back)) ||
                        (currentStep === 2 && !uploadMode && !userPrompt.trim())
                      }
                      className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm ${
                        ((currentStep === 1 && (!itemName.trim() || !itemType.trim())) ||
                         (currentStep === 2 && uploadMode && (!uploadedFrontImage || !uploadedBackImage || !userPrompt.trim() || uploadValidating.front || uploadValidating.back)) ||
                         (currentStep === 2 && !uploadMode && !userPrompt.trim()))
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-black text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900'
                      }`}
                    >
                      {uploadValidating.front || uploadValidating.back ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Validating...
                        </>
                      ) : (
                        <>
                          {currentStep === 2 ? (uploadMode ? 'Continue with Uploads' : 'Generate Design') : 'Continue'}
                          <svg className="ml-2 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
        </form>
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
  );
}