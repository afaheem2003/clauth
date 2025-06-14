import { NextResponse } from 'next/server';
import { getAIDesignerInsights, generateImageWithOpenAI, generatePortraitWithOpenAI, editImageWithReference, editLandscapeWithReference, getAIInpaintingInsights } from '@/services/openaiService';
import { createClient } from "@supabase/supabase-js";
import { ANGLES, getAngleImagePath } from '@/utils/imageProcessing';
import { canUserGenerate, consumeCreditsForGeneration } from '@/lib/rateLimiting';
import sharp from 'sharp';

// Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

// Helper function to get generation method based on approach
function getGenerationMethodForApproach(approach) {
  const methods = {
    'PORTRAIT': 'GENERATE_INDIVIDUAL_PORTRAITS',
    'LANDSCAPE': 'GENERATE_COMPOSITE_THEN_SPLIT'
  };
  
  const method = methods[approach];
  if (!method) {
    throw new Error(`Unknown approach: ${approach}. Supported: PORTRAIT, LANDSCAPE`);
  }
  
  console.log(`[Method Lookup] ✅ Approach ${approach} → Method: ${method}`);
  return method;
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
  
  console.log(`[Editing Method] Approach ${approach} → Method: ${method}`);
  return method;
}

/**
 * Splits a landscape image into two vertical panels (front and back views)
 */
async function splitCompositeImage(imageBuffer) {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // Validate image dimensions
    if (metadata.width !== 1536 || metadata.height !== 1024) {
      console.warn(`[Image Split] Expected 1536x1024 image, got ${metadata.width}x${metadata.height}`);
      // Resize to expected dimensions if needed
      imageBuffer = await sharp(imageBuffer)
        .resize(1536, 1024, { fit: 'fill' })
        .toBuffer();
      metadata.width = 1536;
      metadata.height = 1024;
    }
    
    // For a 1536x1024 image, each panel should be exactly 768x1024
    const trimPixels = 2; // Pixels to trim from each edge where panels meet
    const panelWidth = Math.floor(metadata.width / 2);
    const panelHeight = metadata.height;
    
    // Calculate starting positions with trim offsets
    const positions = [
      { left: 0, width: panelWidth - trimPixels, name: 'front' },           // Left Panel (Front)
      { left: metadata.width/2 + trimPixels, width: panelWidth - trimPixels, name: 'back' }  // Right Panel (Back)
    ];

    // Extract each panel with trimming
    const extractPanel = async (left, width, name) => {
      console.log(`[Image Split] Extracting ${name} panel from position:`, { left, width, height: panelHeight });
      const panel = await sharp(imageBuffer)
        .extract({
          left: Math.max(0, left),
          top: 0,
          width: Math.min(width, metadata.width - left),
          height: panelHeight
        })
        .resize(768, 1024, { // Resize to exact dimensions
          fit: 'fill',
          position: 'center'
        })
        .toBuffer();
      
      // Validate panel dimensions
      const panelMetadata = await sharp(panel).metadata();
      if (panelMetadata.width !== 768 || panelMetadata.height !== 1024) {
        throw new Error(`Invalid panel dimensions after split: ${panelMetadata.width}x${panelMetadata.height}`);
      }
      
      return panel;
    };

    // Extract both panels in parallel
    const panels = await Promise.all(
      positions.map(pos => extractPanel(pos.left, pos.width, pos.name))
    );

    console.log('[Image Split] Successfully split landscape image into panels');
    return {
      [ANGLES.FRONT]: panels[0],
      [ANGLES.BACK]: panels[1]
    };
  } catch (error) {
    console.error('Error splitting landscape image:', error);
    throw new Error(`Failed to split landscape image into panels: ${error.message}`);
  }
}

/**
 * Uploads split image panels to Supabase and returns their public URLs
 */
async function uploadPanelsToStorage(angleBuffers, userId) {
  const tempItemId = `temp_${Date.now()}`;
  const angleUrls = {};
  
  await Promise.all(Object.entries(angleBuffers).map(async ([angle, buffer]) => {
    const filePath = getAngleImagePath(userId, tempItemId, angle);
    
    const { error } = await supabase.storage
      .from('clothingitemimages')
      .upload(filePath, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) throw error;

    // Get the public URL for the uploaded image
    const { data: { publicUrl } } = supabase.storage
      .from('clothingitemimages')
      .getPublicUrl(filePath);

    angleUrls[angle] = publicUrl;
  }));

  return angleUrls;
}

/**
 * Creates portrait panels from front and back portrait images
 */
async function createPortraitPanels(frontImageBuffer, backImageBuffer) {
  try {
    // Resize both images to ensure consistent dimensions (768x1024)
    const frontPanel = await sharp(frontImageBuffer)
      .resize(768, 1024, { 
        fit: 'fill',
        position: 'center'
      })
      .toBuffer();

    const backPanel = await sharp(backImageBuffer)
      .resize(768, 1024, { 
        fit: 'fill',
        position: 'center'
      })
      .toBuffer();

    console.log('[Portrait Panels] Successfully created portrait panels');
    return {
      [ANGLES.FRONT]: frontPanel,
      [ANGLES.BACK]: backPanel
    };
  } catch (error) {
    console.error('Error creating portrait panels:', error);
    throw new Error(`Failed to create portrait panels: ${error.message}`);
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { itemType, color, userPrompt, modelDescription, userId, inpaintingMask, originalImage, quality = 'medium' } = data;

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    // Check credit availability and daily limits before processing
    const creditCheck = await canUserGenerate(userId, quality);
    if (!creditCheck.canGenerate) {
      return NextResponse.json({ 
        error: creditCheck.reason,
        creditsRemaining: creditCheck.creditsRemaining,
        dailyRemaining: creditCheck.dailyRemaining
      }, { status: 429 });
    }

    // Consume credits at the start to prevent race conditions
    try {
      await consumeCreditsForGeneration(userId, quality);
    } catch (error) {
      console.error('Error consuming credits:', error);
      return NextResponse.json({ 
        error: `Failed to consume ${quality} credits. ${error.message}` 
      }, { status: 400 });
    }

    // Check if this is an inpainting request
    if (originalImage) {
      // INPAINTING FLOW
      console.log("[API] Processing inpainting request");
      
      if (!userPrompt) {
        return NextResponse.json({ error: "Inpainting prompt is required" }, { status: 400 });
      }

      // Determine approach based on environment variables
      let approach, editingMethod;
      try {
        console.log("[API] Looking up approach for quality level:", quality);
        approach = getApproachForQuality(quality);
        editingMethod = getEditingMethodForApproach(approach);
        console.log("[API] ✅ Quality-based approach determined for inpainting:");
        console.log("[API]   Quality:", quality);
        console.log("[API]   Approach:", approach);
        console.log("[API]   Editing Method:", editingMethod);
      } catch (error) {
        console.error('Error determining approach from quality for inpainting:', error);
        return NextResponse.json({ 
          error: `Failed to determine inpainting approach: ${error.message}` 
        }, { status: 500 });
      }

      // Step 1: Get AI inpainting insights to structure the prompt
      let inpaintingInsights;
      try {
        inpaintingInsights = await getAIInpaintingInsights(userPrompt, itemType, color);
      } catch (error) {
        console.error('Error getting AI inpainting insights:', error);
        return NextResponse.json({ 
          error: `Failed to process inpainting instructions: ${error.message}` 
        }, { status: 500 });
      }

      // Step 2: Perform editing based on approach (no masks needed with reference-based editing)
      let imageData, angleBuffers;
      try {
        if (editingMethod === 'EDIT_COMPOSITE_THEN_SPLIT') {
          console.log("[API] ✅ CONFIRMED: Using landscape composite editing approach");
          console.log("[API] Editing with itemType:", itemType, "color:", color, "quality:", quality);
          
          // Create edit prompt from inpainting data
          const landscapeEditPrompt = `
Left Panel (Front View):
${inpaintingInsights.inpaintingData.frontModifications || "No changes to front view."}

Right Panel (Back View):
${inpaintingInsights.inpaintingData.backModifications || "No changes to back view."}
          `.trim();
          
          console.log("[API] 📋 LANDSCAPE EDIT PROMPT:", landscapeEditPrompt);
          
          imageData = await editLandscapeWithReference(
            originalImage,
            [originalImage], // Use original as reference for consistency
            landscapeEditPrompt,
            {
              size: "1536x1024",
              quality: quality,
              originalItemType: itemType,
              originalColor: color
            }
          );

          // Step 4: Split the inpainted image and store the panels
          try {
            const imageBuffer = Buffer.from(imageData, 'base64');
            angleBuffers = await splitCompositeImage(imageBuffer);
          } catch (error) {
            console.error('Error splitting inpainted image:', error);
            return NextResponse.json({ 
              error: `Failed to process inpainted image: ${error.message}` 
            }, { status: 500 });
          }
        } else if (editingMethod === 'EDIT_INDIVIDUAL_PORTRAITS') {
          // Portrait approach requires separate front/back images, not a composite
          console.log("[API] ⚠️ Portrait approach requested for inpainting but only composite image provided");
          return NextResponse.json({ 
            error: 'Portrait editing requires separate front and back images. Please use the dedicated inpainting endpoint with front and back images.' 
          }, { status: 400 });
        } else {
          return NextResponse.json({ 
            error: `Unknown editing method: ${editingMethod}` 
          }, { status: 500 });
        }
      } catch (error) {
        console.error('Error in inpainting:', error);
        return NextResponse.json({ 
          error: `Failed to inpaint image: ${error.message}` 
        }, { status: 500 });
      }

      // Step 5: Upload the inpainted panels
      let angleUrls;
      try {
        angleUrls = await uploadPanelsToStorage(angleBuffers, userId);
      } catch (error) {
        console.error('Error uploading inpainted panels:', error);
        return NextResponse.json({ 
          error: `Failed to upload inpainted image panels: ${error.message}` 
        }, { status: 500 });
      }

      // Return the inpainted result
      return NextResponse.json({
        success: true,
        aiDescription: `Updated design: ${inpaintingInsights.inpaintingData.modificationSummary}`,
        angleUrls,
        compositeImage: imageData
      });

    } else {
      // ORIGINAL GENERATION FLOW
      console.log("[API] Processing original design generation");
      
      // Step 1: Get AI insights
      let insights;
      try {
        insights = await getAIDesignerInsights({
          itemDescription: `${itemType} in ${color}`,
          frontDesign: userPrompt,
          backDesign: userPrompt,
          modelDetails: modelDescription || "Generate appropriate model description" // Pass model description or flag for auto-generation
        });
      } catch (error) {
        console.error('Error getting AI insights:', error);
        return NextResponse.json({ 
          error: `Failed to get AI insights: ${error.message}` 
        }, { status: 500 });
      }

      // Step 2: Generate the image based on quality
      let imageData, angleBuffers;
      
      // Determine approach based on environment variables
      let approach, generationMethod;
      try {
        console.log("[API] Looking up approach for quality level:", quality);
        approach = getApproachForQuality(quality);
        generationMethod = getGenerationMethodForApproach(approach);
        console.log("[API] ✅ Quality-based approach determined:");
        console.log("[API]   Quality:", quality);
        console.log("[API]   Approach:", approach);
        console.log("[API]   Generation Method:", generationMethod);
      } catch (error) {
        console.error('Error determining generation approach:', error);
        return NextResponse.json({ 
          error: `Failed to determine generation approach: ${error.message}` 
        }, { status: 500 });
      }
      
      if (generationMethod === 'GENERATE_COMPOSITE_THEN_SPLIT') {
        // LANDSCAPE: Use landscape composite approach
        try {
          console.log("[API] ✅ CONFIRMED: Generating landscape composite image");
          imageData = await generateImageWithOpenAI(
            insights.promptJsonData.description,
            {
              size: "1536x1024",
              quality: quality,
              itemDescription: `${itemType} in ${color}`,
              frontDesign: insights.promptJsonData.frontDetails,
              backDesign: insights.promptJsonData.backDetails,
              modelDetails: insights.promptJsonData.modelDetails || "Professional model with neutral expression"
            }
          );

          // Split the landscape image
          const imageBuffer = Buffer.from(imageData, 'base64');
          angleBuffers = await splitCompositeImage(imageBuffer);
          
        } catch (error) {
          console.error('Error in landscape composite generation:', error);
          return NextResponse.json({ 
            error: `Failed to generate landscape composite image: ${error.message}` 
          }, { status: 500 });
        }
      } else if (generationMethod === 'GENERATE_INDIVIDUAL_PORTRAITS') {
        // PORTRAIT: Use portrait + edit approach
        try {
          console.log(`[API] ✅ CONFIRMED: Generating individual portraits for ${quality} quality`);
          console.log(`[API] ✅ GUARANTEED: Will create 1024x1536 portrait images`);
          
          // Step 2a: Generate front portrait
          const frontImageData = await generatePortraitWithOpenAI(
            insights.promptJsonData.description,
            {
              size: "1024x1536",
              quality: quality,
              itemDescription: `${itemType} in ${color}`,
              frontDesign: insights.promptJsonData.frontDetails,
              modelDetails: insights.promptJsonData.modelDetails || "Professional model with neutral expression"
            }
          );

          // Step 2b: Edit portrait to show back view using reference-based editing
          const backViewPrompt = `
Transform this front-view portrait into a back-view portrait of the EXACT SAME model and clothing item.

CRITICAL REQUIREMENTS:
- Keep the EXACT SAME model appearance, pose style, and studio environment
- Keep the EXACT SAME clothing item and color (${color})
- Change ONLY the viewing angle from front to back
- Maintain identical lighting, background, and proportions
- Show the back design: ${insights.promptJsonData.backDetails}
- Use the provided reference image to maintain perfect consistency with the front view

CRITICAL PHOTOREALISTIC REQUIREMENTS:
- PHOTOREALISTIC quality is absolutely essential - the image must look like a real photograph
- Hyperrealistic textures, lighting, shadows, and fabric details
- Natural skin tones, realistic hair, and authentic human proportions
- Professional photography-grade realism with no artificial or cartoon-like elements

FASHION EDITORIAL STYLE REQUIREMENTS:
- FULL-BODY shot showing the complete model from head to toe
- Fashion magazine editorial photography style with professional runway model
- Camera positioned at a LOWER ANGLE (slightly below eye level) to create a more flattering, elongated silhouette
- Camera positioned at APPROPRIATE DISTANCE with generous spacing - ensure significant space between the top of the image and the model's head, and between the bottom of the image and the model's feet
- Avoid close-up or cropped shots - show the complete figure and styling with ample breathing room

The model should now be facing directly away from the camera in a full-body pose, showing the complete back view of the ${itemType} in ${color}. Keep everything else identical to the original image.

IMPORTANT: Use the provided reference image to maintain style consistency. Ensure the back view matches the design elements, colors, and overall aesthetic of the front reference image. Maintain all fictional branding and avoid any real-world brand references.
          `.trim();

          const backImageData = await editImageWithReference(
            frontImageData,
            [frontImageData], // Use front image as reference for consistency
            backViewPrompt,
            {
              size: "1024x1536", 
              quality: quality,
              originalItemType: itemType,
              originalColor: color
            }
          );

          // Step 2c: Create panels from both portraits - store as separate portraits
          const frontBuffer = Buffer.from(frontImageData, 'base64');
          const backBuffer = Buffer.from(backImageData, 'base64');
          angleBuffers = await createPortraitPanels(frontBuffer, backBuffer);

          // For portrait approach, do NOT create a composite image
          // Keep the portraits separate throughout the entire flow
          console.log(`[API] Portrait approach completed successfully for ${quality} quality`);
          
        } catch (error) {
          console.error(`Error in portrait generation for ${quality} quality:`, error);
          // For portrait approach, no fallback - maintain consistency
          console.error('[API] No fallback for portrait approach to maintain format consistency');
          return NextResponse.json({ 
            error: `Failed to generate portrait images: ${error.message}` 
          }, { status: 500 });
        }
      } else {
        return NextResponse.json({ 
          error: `Unknown generation method: ${generationMethod}` 
        }, { status: 500 });
      }

      // Step 3: Upload the panels
      let angleUrls;
      try {
        angleUrls = await uploadPanelsToStorage(angleBuffers, userId);
      } catch (error) {
        console.error('Error uploading panels:', error);
        return NextResponse.json({ 
          error: `Failed to upload image panels: ${error.message}` 
        }, { status: 500 });
      }

      // Return everything the client needs
      return NextResponse.json({
        success: true,
        aiDescription: insights.promptJsonData.description,
        angleUrls,
        ...(generationMethod === 'GENERATE_COMPOSITE_THEN_SPLIT' ? { compositeImage: imageData } : {}) // Only include compositeImage for landscape generation
      });
    }

  } catch (error) {
    console.error('Error in design generation:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
} 