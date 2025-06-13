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
  console.log("[Image Converter] Input type:", typeof imageSource);
  console.log("[Image Converter] Input length:", imageSource?.length || 'N/A');
  console.log("[Image Converter] Input preview:", imageSource?.substring(0, 100) || 'N/A');
  
  if (!imageSource) {
    throw new Error("No image source provided");
  }

  try {
    // Check if it's already a data URI
    if (imageSource.startsWith('data:image/')) {
      console.log("[Image Converter] Source is data URI, extracting base64");
      const base64Part = imageSource.split(',')[1];
      if (!base64Part) {
        throw new Error("Invalid data URI format - no base64 data found after comma");
      }
      console.log("[Image Converter] Extracted base64 length:", base64Part.length);
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
    console.error("[Image Converter] Input was:", imageSource?.substring(0, 200) || 'N/A');
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

// Helper function to combine two portrait images into a landscape composite
async function combinePortraitsToLandscape(frontImageBase64, backImageBase64) {
  try {
    console.log("[Portrait Combiner] Combining front and back portraits into landscape composite");
    
    const frontBuffer = Buffer.from(frontImageBase64, 'base64');
    const backBuffer = Buffer.from(backImageBase64, 'base64');
    
    // Get metadata to ensure we're working with portraits
    const frontMeta = await sharp(frontBuffer).metadata();
    const backMeta = await sharp(backBuffer).metadata();
    
    console.log(`[Portrait Combiner] Front: ${frontMeta.width}x${frontMeta.height}, Back: ${backMeta.width}x${backMeta.height}`);
    
    // Resize images to standard portrait size if needed
    const standardWidth = 768;
    const standardHeight = 1024;
    
    const frontResized = await sharp(frontBuffer)
      .resize(standardWidth, standardHeight)
      .png()
      .toBuffer();
      
    const backResized = await sharp(backBuffer)
      .resize(standardWidth, standardHeight)
      .png()
      .toBuffer();
    
    // Combine side by side to create 1536x1024 landscape
    const combinedBuffer = await sharp({
      create: {
        width: 1536,
        height: 1024,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: frontResized, left: 0, top: 0 },
      { input: backResized, left: 768, top: 0 }
    ])
    .png()
    .toBuffer();
    
    console.log("[Portrait Combiner] Successfully combined portraits into landscape");
    return combinedBuffer.toString('base64');
  } catch (error) {
    console.error('[Portrait Combiner] Error combining portraits:', error);
    throw new Error(`Failed to combine portraits: ${error.message}`);
  }
}

// Helper function to split landscape composite into portrait images
async function splitLandscapeToPortraits(landscapeImageBase64) {
  try {
    console.log("[Landscape Splitter] Splitting landscape composite into portraits");
    
    const imageBuffer = Buffer.from(landscapeImageBase64, 'base64');
    const metadata = await sharp(imageBuffer).metadata();
    
    console.log(`[Landscape Splitter] Input image: ${metadata.width}x${metadata.height}`);
    
    // Extract front panel (left half)
    const frontBuffer = await sharp(imageBuffer)
      .extract({ left: 0, top: 0, width: 768, height: 1024 })
      .resize(1024, 1536) // Convert to standard portrait size
      .png()
      .toBuffer();
      
    // Extract back panel (right half)  
    const backBuffer = await sharp(imageBuffer)
      .extract({ left: 768, top: 0, width: 768, height: 1024 })
      .resize(1024, 1536) // Convert to standard portrait size
      .png()
      .toBuffer();
    
    console.log("[Landscape Splitter] Successfully split landscape into portraits");
    return {
      front: frontBuffer.toString('base64'),
      back: backBuffer.toString('base64')
    };
  } catch (error) {
    console.error('[Landscape Splitter] Error splitting landscape:', error);
    throw new Error(`Failed to split landscape: ${error.message}`);
  }
}

// Helper function to determine if we need cross-quality conversion
function needsConversion(sourceApproach, targetApproach) {
  return sourceApproach !== targetApproach;
}

// Helper function to detect current image format
function detectCurrentFormat(originalImage, frontImage, backImage) {
  if (originalImage && !frontImage && !backImage) {
    return 'LANDSCAPE';
  } else if (!originalImage && frontImage && backImage) {
    return 'PORTRAIT';
  } else {
    throw new Error('Ambiguous image format - provide either composite OR front+back images');
  }
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
    const { originalImage, frontImage, backImage, prompt, userId, quality = 'medium', targetQuality, originalDescription } = body;

    // If no target quality specified, use the same quality (normal editing)
    const finalTargetQuality = targetQuality || quality;
    console.log("[Inpaint API] Quality:", quality, "Target Quality:", finalTargetQuality);

    // Validate that we have at least some images to work with
    if (!originalImage && !frontImage && !backImage) {
      console.log("[Inpaint API] No images provided");
      return NextResponse.json({ error: 'At least one image (original, front, or back) is required for editing' }, { status: 400 });
    }

    // Detect current image format and validate
    let currentFormat;
    try {
      currentFormat = detectCurrentFormat(originalImage, frontImage, backImage);
      console.log("[Inpaint API] Detected current format:", currentFormat);
    } catch (error) {
      console.log("[Inpaint API] Invalid image format");
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!prompt || !prompt.trim()) {
      console.log("[Inpaint API] Missing or empty prompt");
      return NextResponse.json({ error: 'Edit instructions are required' }, { status: 400 });
    }

    console.log("[Inpaint API] Available images - Original:", !!originalImage, "Front:", !!frontImage, "Back:", !!backImage);
    console.log("[Inpaint API] Checking user credits for target quality:", finalTargetQuality);
    // Check user credits and limits for the target quality
    const canGenerate = await canUserGenerate(session.user.uid, finalTargetQuality);
    console.log("[Inpaint API] Credit check result:", canGenerate);
    if (!canGenerate.canGenerate) {
      return NextResponse.json({ error: canGenerate.reason }, { status: 429 });
    }

    console.log("[Inpaint API] Processing inpainting request");
    console.log("[Inpaint API] Current Quality:", quality, "Target Quality:", finalTargetQuality);
    console.log("[Inpaint API] Prompt:", prompt);

    // Step 1: Get AI insights for the inpainting request
    let insights;
    try {
      console.log("[Inpaint API] Getting AI insights...");
      insights = await getAIInpaintingInsights(prompt, 'clothing item', 'original color', originalDescription);
      console.log("[Inpaint API] AI insights received:", !!insights);
      console.log("[Inpaint API] 🔍 DETAILED AI INSIGHTS:");
      console.log("[Inpaint API]   Front modifications:", insights.inpaintingData.frontModifications);
      console.log("[Inpaint API]   Back modifications:", insights.inpaintingData.backModifications);
      console.log("[Inpaint API]   Preservation note:", insights.inpaintingData.preservationNote);
      console.log("[Inpaint API]   Modification summary:", insights.inpaintingData.modificationSummary);
      console.log("[Inpaint API]   Updated design description:", insights.inpaintingData.updatedDesignDescription);
    } catch (error) {
      console.error('Error getting AI inpainting insights:', error);
      return NextResponse.json({ 
        error: `Failed to process edit instructions: ${error.message}` 
      }, { status: 500 });
    }

    // Step 2: Determine source and target approaches
    let sourceApproach, targetApproach, targetEditingMethod;
    try {
      console.log("[Inpaint API] Determining approaches...");
      
      // Get source approach from current quality or detected format
      sourceApproach = currentFormat; // We know the current format from the images provided
      
      // Get target approach from target quality environment variables
      targetApproach = getApproachForQuality(finalTargetQuality);
      targetEditingMethod = getEditingMethodForApproach(targetApproach);
      
      console.log("[Inpaint API] ✅ Cross-quality conversion analysis:");
      console.log("[Inpaint API]   Source Format:", sourceApproach);
      console.log("[Inpaint API]   Target Quality:", finalTargetQuality);
      console.log("[Inpaint API]   Target Approach:", targetApproach);
      console.log("[Inpaint API]   Target Method:", targetEditingMethod);
      console.log("[Inpaint API]   Conversion needed:", needsConversion(sourceApproach, targetApproach));
      
    } catch (error) {
      console.error('Error determining conversion approach:', error);
      return NextResponse.json({ 
        error: `Failed to determine conversion approach: ${error.message}` 
      }, { status: 500 });
    }

    // Step 3: Prepare images for editing based on conversion needs
    let workingFrontImage, workingBackImage, workingOriginalImage;
    
    try {
      console.log("[Inpaint API] ✅ CONVERSION LOGIC:");
      console.log("[Inpaint API]   Source:", sourceApproach, "→ Target:", targetApproach);
      
      if (sourceApproach === 'PORTRAIT' && targetApproach === 'PORTRAIT') {
        // PORTRAIT → PORTRAIT: No conversion needed, use images directly
        console.log("[Inpaint API] 📸 PORTRAIT → PORTRAIT: Direct editing");
        workingFrontImage = frontImage;
        workingBackImage = backImage;
        
      } else if (sourceApproach === 'LANDSCAPE' && targetApproach === 'LANDSCAPE') {
        // LANDSCAPE → LANDSCAPE: No conversion needed, use composite directly
        console.log("[Inpaint API] 🖼️ LANDSCAPE → LANDSCAPE: Direct editing");
        workingOriginalImage = originalImage;
        
      } else if (sourceApproach === 'PORTRAIT' && targetApproach === 'LANDSCAPE') {
        // PORTRAIT → LANDSCAPE: Combine portraits, edit as landscape
        console.log("[Inpaint API] 📸➡️🖼️ PORTRAIT → LANDSCAPE: Combining portraits for landscape editing");
        const frontImageBase64 = await convertImageToBase64(frontImage);
        const backImageBase64 = await convertImageToBase64(backImage);
        workingOriginalImage = await combinePortraitsToLandscape(frontImageBase64, backImageBase64);
        
      } else if (sourceApproach === 'LANDSCAPE' && targetApproach === 'PORTRAIT') {
        // LANDSCAPE → PORTRAIT: Split landscape, edit as portraits
        console.log("[Inpaint API] 🖼️➡️📸 LANDSCAPE → PORTRAIT: Splitting landscape for portrait editing");
        const originalImageBase64 = await convertImageToBase64(originalImage);
        const splitImages = await splitLandscapeToPortraits(originalImageBase64);
        workingFrontImage = splitImages.front;
        workingBackImage = splitImages.back;
        
      } else {
        throw new Error(`Unsupported conversion: ${sourceApproach} → ${targetApproach}`);
      }
      
      console.log("[Inpaint API] ✅ Images prepared for editing");
      console.log("[Inpaint API]   Working images - Original:", !!workingOriginalImage, "Front:", !!workingFrontImage, "Back:", !!workingBackImage);
      
    } catch (error) {
      console.error('Error in image format conversion:', error);
      return NextResponse.json({ 
        error: `Failed to convert image format: ${error.message}` 
      }, { status: 500 });
    }

    // Step 4: Perform inpainting based on target approach
    let imageData;
    try {
      console.log("[Inpaint API] Performing inpainting using method:", targetEditingMethod);
      console.log("[Inpaint API] Target Approach:", targetApproach);
      
      if (targetEditingMethod === 'EDIT_INDIVIDUAL_PORTRAITS') {
        console.log("[Inpaint API] ✅ CONFIRMED: Using portrait-based editing approach - editing individual portraits");
        console.log("[Inpaint API] ✅ GUARANTEED: Will return 1024x1536 portrait images");
        
        try {
          // Convert working images to base64 if they aren't already
          const frontImageBase64 = await convertImageToBase64(workingFrontImage);
          const backImageBase64 = await convertImageToBase64(workingBackImage);
          
          // Validate image dimensions for portrait approach
          console.log("[Inpaint API] Creating buffers from base64 data...");
          console.log(`[Inpaint API] Front base64 length: ${frontImageBase64.length}`);
          console.log(`[Inpaint API] Back base64 length: ${backImageBase64.length}`);
          
          let frontBuffer, backBuffer;
          try {
            frontBuffer = Buffer.from(frontImageBase64, 'base64');
            backBuffer = Buffer.from(backImageBase64, 'base64');
            console.log(`[Inpaint API] Buffers created - Front: ${frontBuffer.length} bytes, Back: ${backBuffer.length} bytes`);
          } catch (bufferError) {
            console.error("[Inpaint API] Error creating buffers:", bufferError);
            throw new Error(`Failed to create image buffers: ${bufferError.message}`);
          }
          
          let frontMeta, backMeta;
          try {
            console.log("[Inpaint API] Extracting metadata with Sharp...");
            frontMeta = await sharp(frontBuffer).metadata();
            backMeta = await sharp(backBuffer).metadata();
            console.log(`[Inpaint API] Metadata extracted - Front: ${frontMeta.width}x${frontMeta.height}, Back: ${backMeta.width}x${backMeta.height}`);
          } catch (metadataError) {
            console.error("[Inpaint API] Error extracting metadata:", metadataError);
            console.error("[Inpaint API] Front buffer first 50 bytes:", frontBuffer.slice(0, 50).toString('hex'));
            console.error("[Inpaint API] Back buffer first 50 bytes:", backBuffer.slice(0, 50).toString('hex'));
            throw new Error(`Failed to extract image metadata: ${metadataError.message}`);
          }
          
          console.log(`[Inpaint API] Validating dimensions - Front: ${frontMeta.width}x${frontMeta.height}, Back: ${backMeta.width}x${backMeta.height}`);
          
          // Create appropriate masks based on actual image dimensions
          const frontMask = await createAppropriateNavigationMask(frontImageBase64);
          const backMask = await createAppropriateNavigationMask(backImageBase64);
          
          // Force correct dimensions for this approach
          const frontSize = validateAndCorrectDimensions(frontMeta.width, frontMeta.height, targetApproach);
          const backSize = validateAndCorrectDimensions(backMeta.width, backMeta.height, targetApproach);
          
          console.log(`[Inpaint API] Front image size: ${frontSize}`);
          console.log(`[Inpaint API] Back image size: ${backSize}`);
          
          // Edit front portrait (no reference needed)
          console.log("[Inpaint API] 🔄 EDITING FRONT PORTRAIT");
          console.log("[Inpaint API] Front modifications:", insights.inpaintingData.frontModifications);
          
          const frontInpaintingData = {
            frontModifications: insights.inpaintingData.frontModifications,
            backModifications: "No changes to back view.",
            preservationNote: "Preserve the original model pose, background, lighting, and color. Only modify the front view as specified."
          };
          console.log("[Inpaint API] 📋 FRONT INPAINTING DATA:", frontInpaintingData);
          
          const frontEditedData = await inpaintImageWithOpenAI(
            frontImageBase64,
            frontMask,
            frontInpaintingData,
            {
              size: frontSize,
              quality: finalTargetQuality,
              originalItemType: 'clothing item',
              originalColor: 'original color',
              view: 'front'
            }
          );
          console.log("[Inpaint API] ✅ FRONT PORTRAIT EDITED, data length:", frontEditedData?.length);

          // Edit back portrait (use new front as style reference)
          console.log("[Inpaint API] 🔄 EDITING BACK PORTRAIT");
          console.log("[Inpaint API] Back modifications:", insights.inpaintingData.backModifications);
          console.log("[Inpaint API] Using front as reference:", !!frontEditedData);
          
          const backInpaintingData = {
            frontModifications: "No changes to front view.",
            backModifications: insights.inpaintingData.backModifications,
            preservationNote: "Preserve the original model pose, background, lighting, and color. Only modify the back view as specified."
          };
          console.log("[Inpaint API] 📋 BACK INPAINTING DATA:", backInpaintingData);
          
          const backEditedData = await inpaintImageWithOpenAI(
            backImageBase64,
            backMask,
            backInpaintingData,
            {
              size: backSize,
              quality: finalTargetQuality,
              originalItemType: 'clothing item',
              originalColor: 'original color',
              view: 'back'
            },
            [frontEditedData] // Pass the new front as a style reference
          );
          console.log("[Inpaint API] ✅ BACK PORTRAIT EDITED, data length:", backEditedData?.length);

          // Validate that we got valid edited images
          if (!frontEditedData || !backEditedData) {
            throw new Error("Failed to get valid edited images from portrait editing");
          }

          console.log("[Inpaint API] 📤 PREPARING RESPONSE");
          console.log("[Inpaint API] Front image length:", frontEditedData.length);
          console.log("[Inpaint API] Back image length:", backEditedData.length);

          // Consume credits for the TARGET quality level (not the original quality)
          try {
            console.log(`[Inpaint API] Consuming credits for TARGET quality: ${finalTargetQuality}`);
            await consumeCreditsForGeneration(session.user.uid, finalTargetQuality);
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
            backImage: backEditedData,
            targetQuality: finalTargetQuality
          });
          
        } catch (portraitError) {
          console.error('[Inpaint API] Portrait editing failed:', portraitError);
          throw new Error(`Portrait editing failed: ${portraitError.message}`);
        }
        
      } else if (targetEditingMethod === 'EDIT_COMPOSITE_THEN_SPLIT') {
        console.log("[Inpaint API] ✅ CONFIRMED: Using landscape composite editing approach");
        
        try {
          const originalImageBase64 = await convertImageToBase64(workingOriginalImage);
          const landscapeMask = await createAppropriateNavigationMask(originalImageBase64);
          
          // Force correct dimensions for this approach
          const compositeSize = validateAndCorrectDimensions(1536, 1024, targetApproach);
          console.log(`[Inpaint API] Composite image size: ${compositeSize}`);
          
          imageData = await inpaintImageWithOpenAI(
            originalImageBase64,
            landscapeMask,
            insights.inpaintingData,
            {
              size: compositeSize,
              quality: finalTargetQuality,
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

          // Consume credits for the TARGET quality level (not the original quality)
          try {
            console.log(`[Inpaint API] Consuming credits for TARGET quality: ${finalTargetQuality}`);
            await consumeCreditsForGeneration(session.user.uid, finalTargetQuality);
            console.log("[Inpaint API] Credits consumed successfully");
          } catch (error) {
            console.error('Error consuming credits:', error);
          }

          console.log("[Inpaint API] Successfully completed landscape composite editing");
          return NextResponse.json({
            success: true,
            aiDescription: insights.inpaintingData.updatedDesignDescription,
            angleUrls,
            compositeImage: imageData,
            targetQuality: finalTargetQuality
          });
          
        } catch (landscapeError) {
          console.error('[Inpaint API] Landscape editing failed:', landscapeError);
          throw new Error(`Landscape editing failed: ${landscapeError.message}`);
        }
      } else {
        throw new Error(`Unknown editing method: ${targetEditingMethod}`);
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