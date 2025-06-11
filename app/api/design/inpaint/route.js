import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getUserCredits, canUserGenerate, consumeCreditsForGeneration } from '@/lib/rateLimiting';
import { getAIInpaintingInsights, inpaintImageWithOpenAI } from '@/services/openaiService';
import sharp from 'sharp';

// Helper function to create a full mask for complete image editing
async function createFullMask() {
  const maskSize = 1536 * 1024 * 4; // RGBA
  const maskBuffer = Buffer.alloc(maskSize, 255); // White mask
  return maskBuffer.toString('base64');
}

// Helper function to create a portrait-sized mask for portrait editing
async function createPortraitMask() {
  try {
    const maskBuffer = await sharp({
      create: {
        width: 1024,
        height: 1536,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    return maskBuffer.toString('base64');
  } catch (error) {
    console.error('Error creating portrait mask:', error);
    throw new Error(`Failed to create portrait mask: ${error.message}`);
  }
}

// Helper function to create appropriately sized mask based on actual image dimensions
async function createAppropriateNavigationMask(imageBase64) {
  try {
    // Convert base64 to buffer to check dimensions
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const metadata = await sharp(imageBuffer).metadata();
    
    console.log(`[Mask Creator] Detected image dimensions: ${metadata.width}x${metadata.height}`);
    
    // Create mask matching the exact image dimensions
    const maskBuffer = await sharp({
      create: {
        width: metadata.width,
        height: metadata.height,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();
    
    console.log(`[Mask Creator] Created mask: ${metadata.width}x${metadata.height}`);
    return maskBuffer.toString('base64');
  } catch (error) {
    console.error('Error creating appropriate mask:', error);
    throw new Error(`Failed to create appropriate mask: ${error.message}`);
  }
}

// Helper function to convert image URL or data URI to base64
async function convertImageToBase64(imageSource) {
  console.log("[Image Converter] Converting image source to base64...");
  
  if (!imageSource) {
    throw new Error("No image source provided");
  }

  try {
    // Check if it's already a data URI
    if (imageSource.startsWith('data:image/')) {
      console.log("[Image Converter] Source is data URI, extracting base64");
      const base64Part = imageSource.split(',')[1];
      if (!base64Part) {
        throw new Error("Invalid data URI format");
      }
      return base64Part;
    }
    
    // Check if it's a URL
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      console.log("[Image Converter] Source is URL, fetching image data");
      const response = await fetch(imageSource);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.log("[Image Converter] Fetched image, buffer size:", buffer.length);
      
      return buffer.toString('base64');
    }
    
    // Assume it's already base64
    console.log("[Image Converter] Source assumed to be base64");
    return imageSource;
    
  } catch (error) {
    console.error("[Image Converter] Error converting image:", error);
    throw new Error(`Failed to convert image to base64: ${error.message}`);
  }
}

// Helper function to split the inpainted image back into front/back panels
async function splitCompositeImage(imageBuffer) {
  console.log("[Inpaint Splitter] Processing composite image...");
  
  const metadata = await sharp(imageBuffer).metadata();
  console.log("[Inpaint Splitter] Image dimensions:", metadata.width, "x", metadata.height);
  
  const panels = {};
  
  try {
    const extractPanel = async (left, width, name) => {
      const panel = await sharp(imageBuffer)
        .extract({ 
          left: left, 
          top: 0, 
          width: width, 
          height: metadata.height 
        })
        .png()
        .toBuffer();
      
      console.log(`[Inpaint Splitter] Extracted ${name} panel: ${width}x${metadata.height}`);
      return panel;
    };

    // Split into front and back (landscape format)
    if (metadata.width === 1536 && metadata.height === 1024) {
      panels.front = await extractPanel(0, 768, 'front');
      panels.back = await extractPanel(768, 768, 'back');
    } else {
      throw new Error(`Unexpected image dimensions: ${metadata.width}x${metadata.height}`);
    }

    console.log("[Inpaint Splitter] Successfully split composite image");
    return panels;
  } catch (error) {
    console.error("[Inpaint Splitter] Error splitting image:", error);
    throw new Error(`Failed to split inpainted image: ${error.message}`);
  }
}

// Helper function to upload panels to storage and get URLs
async function uploadPanelsToStorage(angleBuffers, userId) {
  const angleUrls = {};
  
  for (const [angle, buffer] of Object.entries(angleBuffers)) {
    try {
      // Convert buffer to base64 for storage
      const base64Image = buffer.toString('base64');
      const dataUri = `data:image/png;base64,${base64Image}`;
      
      // For now, return the data URI directly
      // In production, you'd upload to cloud storage and return the URL
      angleUrls[angle] = dataUri;
      
      console.log(`[Upload] Successfully processed ${angle} panel`);
    } catch (error) {
      console.error(`[Upload] Error processing ${angle} panel:`, error);
      throw new Error(`Failed to process ${angle} panel`);
    }
  }
  
  return angleUrls;
}

// Helper function to get approach based on quality level from environment variables
function getApproachForQuality(quality) {
  const qualityKey = `QUALITY_${quality.toUpperCase()}_APPROACH`;
  const approach = process.env[qualityKey];
  
  console.log(`[Quality Lookup] Checking env var: ${qualityKey} = ${approach}`);
  
  if (!approach) {
    console.warn(`[Quality Lookup] ⚠️ No approach defined for quality: ${quality}, defaulting to PORTRAIT`);
    return 'PORTRAIT';
  }
  
  const normalizedApproach = approach.toUpperCase();
  console.log(`[Quality Lookup] ✅ Quality ${quality} → Approach: ${normalizedApproach}`);
  
  return normalizedApproach;
}

// Helper function to get editing method based on approach
function getEditingMethodForApproach(approach) {
  const methods = {
    'PORTRAIT': 'EDIT_INDIVIDUAL_PORTRAITS',
    'LANDSCAPE': 'EDIT_COMPOSITE_THEN_SPLIT'
  };
  
  const method = methods[approach];
  if (!method) {
    throw new Error(`Unknown approach: ${approach}. Supported: PORTRAIT, LANDSCAPE`);
  }
  
  console.log(`[Method Lookup] ✅ Approach ${approach} → Method: ${method}`);
  return method;
}

function validateAndCorrectDimensions(width, height, approach) {
  console.log(`[Dimension Validator] Input dimensions: ${width}x${height}, Approach: ${approach}`);
  
  // OpenAI supported dimensions
  const supportedSizes = [
    { width: 1024, height: 1024 },
    { width: 1024, height: 1536 },
    { width: 1536, height: 1024 }
  ];
  
  // FORCE correct dimensions based on approach - no exceptions
  let correctedSize;
  if (approach === 'PORTRAIT') {
    // For portrait approach, ALWAYS force 1024x1536 regardless of input
    correctedSize = '1024x1536';
    console.log(`[Dimension Validator] FORCING portrait size: ${correctedSize} (was ${width}x${height})`);
  } else if (approach === 'LANDSCAPE') {
    // For landscape approach, ALWAYS force 1536x1024 regardless of input
    correctedSize = '1536x1024';
    console.log(`[Dimension Validator] FORCING landscape size: ${correctedSize} (was ${width}x${height})`);
  } else {
    // Default fallback - determine by aspect ratio but still force valid sizes
    const aspectRatio = width / height;
    if (aspectRatio > 1) {
      // Landscape
      correctedSize = '1536x1024';
    } else {
      // Portrait or square
      correctedSize = '1024x1536';
    }
    console.log(`[Dimension Validator] Using aspect ratio fallback: ${correctedSize} (was ${width}x${height})`);
  }
  
  console.log(`[Dimension Validator] FINAL SIZE: ${correctedSize}`);
  return correctedSize;
}

export async function POST(req) {
  try {
    console.log("[Inpaint API] Starting inpaint request...");
    
    const session = await getServerSession(authOptions);
    console.log("[Inpaint API] Session check:", !!session?.user?.uid);
    
    if (!session?.user?.uid) {
      console.log("[Inpaint API] No valid session");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log("[Inpaint API] Request body keys:", Object.keys(body));
    const { originalImage, frontImage, backImage, prompt, userId, quality = 'medium', originalDescription } = body;

    // Validate that we have at least some images to work with
    if (!originalImage && !frontImage && !backImage) {
      console.log("[Inpaint API] No images provided");
      return NextResponse.json({ error: 'At least one image (original, front, or back) is required for editing' }, { status: 400 });
    }

    // Validate that we have either complete portrait pair OR composite image
    const hasPortraitPair = frontImage && backImage;
    const hasComposite = originalImage;
    
    if (!hasPortraitPair && !hasComposite) {
      console.log("[Inpaint API] Incomplete image set");
      return NextResponse.json({ 
        error: 'Either provide both front and back images, or provide the original composite image' 
      }, { status: 400 });
    }

    if (!prompt || !prompt.trim()) {
      console.log("[Inpaint API] Missing or empty prompt");
      return NextResponse.json({ error: 'Edit instructions are required' }, { status: 400 });
    }

    console.log("[Inpaint API] Available images - Original:", !!originalImage, "Front:", !!frontImage, "Back:", !!backImage);
    console.log("[Inpaint API] Checking user credits for quality:", quality);
    // Check user credits and limits
    const canGenerate = await canUserGenerate(session.user.uid, quality);
    console.log("[Inpaint API] Credit check result:", canGenerate);
    if (!canGenerate.canGenerate) {
      return NextResponse.json({ error: canGenerate.reason }, { status: 429 });
    }

    console.log("[Inpaint API] Processing inpainting request");
    console.log("[Inpaint API] Quality:", quality);
    console.log("[Inpaint API] Prompt:", prompt);

    // Step 1: Get AI insights for the inpainting request
    let insights;
    try {
      console.log("[Inpaint API] Getting AI insights...");
      insights = await getAIInpaintingInsights(prompt, 'clothing item', 'original color', originalDescription);
      console.log("[Inpaint API] AI insights received:", !!insights);
    } catch (error) {
      console.error('Error getting AI inpainting insights:', error);
      return NextResponse.json({ 
        error: `Failed to process edit instructions: ${error.message}` 
      }, { status: 500 });
    }

    // Step 2: Determine approach based on quality level from environment variables
    let approach, editingMethod;
    try {
      console.log("[Inpaint API] Looking up approach for quality level:", quality);
      approach = getApproachForQuality(quality);
      editingMethod = getEditingMethodForApproach(approach);
      console.log("[Inpaint API] ✅ Quality-based approach determined:");
      console.log("[Inpaint API]   Quality:", quality);
      console.log("[Inpaint API]   Approach:", approach);
      console.log("[Inpaint API]   Editing Method:", editingMethod);
    } catch (error) {
      console.error('Error determining approach from quality:', error);
      return NextResponse.json({ 
        error: `Failed to determine editing approach: ${error.message}` 
      }, { status: 500 });
    }

    // Step 3: Validate required images based on determined approach
    if (approach === 'PORTRAIT') {
      if (!frontImage || !backImage) {
        console.log("[Inpaint API] Missing required images for PORTRAIT approach");
        return NextResponse.json({ 
          error: 'Front and back images are required for portrait approach' 
        }, { status: 400 });
      }
    } else if (approach === 'LANDSCAPE') {
      if (!originalImage) {
        console.log("[Inpaint API] Missing required image for LANDSCAPE approach");
        return NextResponse.json({ 
          error: 'Original composite image is required for landscape approach' 
        }, { status: 400 });
      }
    }

    // Step 4: Perform inpainting based on approach
    let imageData;
    try {
      console.log("[Inpaint API] Performing inpainting using method:", editingMethod);
      console.log("[Inpaint API] Approach:", approach);
      
      if (editingMethod === 'EDIT_INDIVIDUAL_PORTRAITS') {
        console.log("[Inpaint API] ✅ CONFIRMED: Using portrait-based editing approach - editing individual portraits");
        console.log("[Inpaint API] ✅ GUARANTEED: Will return 1024x1536 portrait images");
        
        try {
          // Convert images to base64 first
          const frontImageBase64 = await convertImageToBase64(frontImage);
          const backImageBase64 = await convertImageToBase64(backImage);
          
          // Validate image dimensions for portrait approach
          const frontBuffer = Buffer.from(frontImageBase64, 'base64');
          const backBuffer = Buffer.from(backImageBase64, 'base64');
          const frontMeta = await sharp(frontBuffer).metadata();
          const backMeta = await sharp(backBuffer).metadata();
          
          console.log(`[Inpaint API] Validating dimensions - Front: ${frontMeta.width}x${frontMeta.height}, Back: ${backMeta.width}x${backMeta.height}`);
          
          // Check if images are actually portrait format
          const frontIsPortrait = frontMeta.height > frontMeta.width;
          const backIsPortrait = backMeta.height > backMeta.width;
          
          if (!frontIsPortrait || !backIsPortrait) {
            console.error(`[Inpaint API] ❌ DIMENSION MISMATCH: Portrait approach selected but received landscape images`);
            console.error(`[Inpaint API] Front: ${frontMeta.width}x${frontMeta.height} (portrait: ${frontIsPortrait})`);
            console.error(`[Inpaint API] Back: ${backMeta.width}x${backMeta.height} (portrait: ${backIsPortrait})`);
            return NextResponse.json({ 
              error: `Portrait editing approach selected but received landscape images (${frontMeta.width}x${frontMeta.height}). Please ensure you're editing portrait images or change quality settings.` 
            }, { status: 400 });
          }
          
          // Create appropriate masks based on actual image dimensions
          const frontMask = await createAppropriateNavigationMask(frontImageBase64);
          const backMask = await createAppropriateNavigationMask(backImageBase64);
          
          // Force correct dimensions for this approach
          const frontSize = validateAndCorrectDimensions(frontMeta.width, frontMeta.height, approach);
          const backSize = validateAndCorrectDimensions(backMeta.width, backMeta.height, approach);
          
          console.log(`[Inpaint API] Front image size: ${frontSize}`);
          console.log(`[Inpaint API] Back image size: ${backSize}`);
          
          // Edit front portrait
          const frontEditedData = await inpaintImageWithOpenAI(
            frontImageBase64,
            frontMask,
            {
              frontModifications: insights.inpaintingData.frontModifications,
              backModifications: "No changes to back view.",
              preservationNote: insights.inpaintingData.preservationNote,
              modificationSummary: insights.inpaintingData.modificationSummary
            },
            {
              size: frontSize,
              quality: quality,
              originalItemType: 'clothing item',
              originalColor: 'original color'
            }
          );

          // Edit back portrait
          const backEditedData = await inpaintImageWithOpenAI(
            backImageBase64,
            backMask,
            {
              frontModifications: "No changes to front view.",
              backModifications: insights.inpaintingData.backModifications,
              preservationNote: insights.inpaintingData.preservationNote,
              modificationSummary: insights.inpaintingData.modificationSummary
            },
            {
              size: backSize,
              quality: quality,
              originalItemType: 'clothing item',
              originalColor: 'original color'
            }
          );

          // Consume credits for the edit
          try {
            console.log("[Inpaint API] Consuming credits...");
            await consumeCreditsForGeneration(session.user.uid, quality);
            console.log("[Inpaint API] Credits consumed successfully");
          } catch (error) {
            console.error('Error consuming credits:', error);
            // Don't fail the request if credit consumption fails, just log it
          }

          // Return the edited portraits as separate images, not combined
          console.log("[Inpaint API] Successfully completed portrait editing");
          return NextResponse.json({
            success: true,
            aiDescription: insights.inpaintingData.updatedDesignDescription,
            angleUrls: {
              front: `data:image/png;base64,${frontEditedData}`,
              back: `data:image/png;base64,${backEditedData}`
            },
            frontImage: frontEditedData,
            backImage: backEditedData
          });
          
        } catch (portraitError) {
          console.error('[Inpaint API] Portrait editing failed:', portraitError);
          // For portrait approach, no fallback - maintain consistency
          console.error('[Inpaint API] No fallback for portrait approach to maintain format consistency');
          throw new Error(`Portrait editing failed: ${portraitError.message}`);
        }
        
      } else if (editingMethod === 'EDIT_COMPOSITE_THEN_SPLIT') {
        console.log("[Inpaint API] ✅ CONFIRMED: Using landscape composite editing approach");
        
        try {
          const originalImageBase64 = await convertImageToBase64(originalImage);
          const landscapeMask = await createAppropriateNavigationMask(originalImageBase64);
          
          // Force correct dimensions for this approach
          const compositeSize = validateAndCorrectDimensions(1536, 1024, approach);
          console.log(`[Inpaint API] Composite image size: ${compositeSize}`);
          
          imageData = await inpaintImageWithOpenAI(
            originalImageBase64,
            landscapeMask,
            insights.inpaintingData,
            {
              size: compositeSize,
              quality: quality,
              originalItemType: 'clothing item',
              originalColor: 'original color'
            }
          );

          // Split the inpainted image and store the panels
          let angleBuffers;
          try {
            console.log("[Inpaint API] Splitting image...");
            const imageBuffer = Buffer.from(imageData, 'base64');
            angleBuffers = await splitCompositeImage(imageBuffer);
            console.log("[Inpaint API] Image split, panels:", Object.keys(angleBuffers));
          } catch (error) {
            console.error('Error splitting inpainted image:', error);
            return NextResponse.json({ 
              error: `Failed to process edited image: ${error.message}` 
            }, { status: 500 });
          }

          // Upload the inpainted panels
          let angleUrls;
          try {
            console.log("[Inpaint API] Uploading panels...");
            angleUrls = await uploadPanelsToStorage(angleBuffers, userId);
            console.log("[Inpaint API] Panels uploaded, URLs:", Object.keys(angleUrls));
          } catch (error) {
            console.error('Error uploading inpainted panels:', error);
            return NextResponse.json({ 
              error: `Failed to save edited image: ${error.message}` 
            }, { status: 500 });
          }

          // Consume credits for the edit
          try {
            console.log("[Inpaint API] Consuming credits...");
            await consumeCreditsForGeneration(session.user.uid, quality);
            console.log("[Inpaint API] Credits consumed successfully");
          } catch (error) {
            console.error('Error consuming credits:', error);
          }

          console.log("[Inpaint API] Successfully completed landscape composite editing");
          return NextResponse.json({
            success: true,
            aiDescription: insights.inpaintingData.updatedDesignDescription,
            angleUrls,
            compositeImage: imageData
          });
          
        } catch (landscapeError) {
          console.error('[Inpaint API] Landscape editing failed:', landscapeError);
          // For landscape approach, no fallback - maintain consistency  
          console.error('[Inpaint API] No fallback for landscape approach to maintain format consistency');
          throw new Error(`Landscape editing failed: ${landscapeError.message}`);
        }
      } else {
        throw new Error(`Unknown editing method: ${editingMethod}`);
      }
      
      console.log("[Inpaint API] Inpainting completed, image data length:", imageData?.length);
    } catch (error) {
      console.error('Error in inpainting:', error);
      return NextResponse.json({ 
        error: `Failed to apply changes: ${error.message}` 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Inpaint API] Unexpected error in design inpainting:', error);
    console.error('[Inpaint API] Error stack:', error.stack);
    return NextResponse.json(
      { error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
}