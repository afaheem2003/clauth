import { NextResponse } from 'next/server';
import { getAIDesignerInsights, generateLandscapeImageWithOpenAI, generatePortraitWithOpenAI, editImageWithReference, editLandscapeWithReference, getAIInpaintingInsights } from '@/services/openaiService';
import { createClient } from "@supabase/supabase-js";
import { ANGLES, getAngleImagePath } from '@/utils/imageProcessing';
import { canUserGenerate, consumeCreditsForGeneration } from '@/lib/rateLimiting';
import { 
  getApproachForQuality, 
  getGenerationMethodForApproach, 
  getEditingMethodForApproach, 
  splitCompositeImage, 
  uploadPanelsToStorage, 
  createPortraitPanels 
} from '@/utils/designHelpers';
import sharp from 'sharp';

// Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function to convert gender values for OpenAI
function convertGenderForAI(gender) {
  switch (gender) {
    case 'MASCULINE':
      return 'male';
    case 'FEMININE':
      return 'female';
    case 'UNISEX':
    default:
      return 'unisex';
  }
}

export async function POST(req) {
  try {
    const data = await req.json();
    const { itemType, itemTypeSpecific, gender = 'UNISEX', color, userPrompt, modelDescription, userId, inpaintingMask, originalImage, quality = 'medium', isWaitlistApplication = false } = data;

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

    // DON'T consume credits yet - wait until generation is successful
    
    // Store original credit check for later consumption
    const originalCreditsRemaining = creditCheck.creditsRemaining;

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
              originalColor: color,
              gender: convertGenderForAI(gender)
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

      // SUCCESS: Consume credits only after successful generation and upload
      try {
        await consumeCreditsForGeneration(userId, quality);
        console.log(`[API] ✅ Credits consumed for successful inpainting generation (${quality})`);
      } catch (error) {
        console.error('Error consuming credits after successful generation:', error);
        // Don't fail the request if credit consumption fails - generation was successful
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
      console.log("[API] Is waitlist application:", isWaitlistApplication);
      
      // Step 1: Get AI insights
      let insights;
      try {
        insights = await getAIDesignerInsights({
          itemDescription: isWaitlistApplication ? userPrompt : `${itemType} in ${color}`,
          frontDesign: userPrompt,
          backDesign: userPrompt,
          modelDetails: modelDescription || "Generate appropriate model description",
          gender: convertGenderForAI(gender)
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
        // Landscape generation approach
        console.log("[API] ✅ CONFIRMED: Using landscape generation approach");
        console.log("[API] Generating with insights:", insights.promptJsonData);
        console.log("[API] Quality level:", quality);
        
        imageData = await generateLandscapeImageWithOpenAI(insights.promptJsonData.description, {
              size: "1536x1024",
              quality: quality,
              itemDescription: isWaitlistApplication ? userPrompt : `${itemType} in ${color}`,
              frontDesign: insights.promptJsonData.frontDetails,
              backDesign: insights.promptJsonData.backDetails,
          modelDetails: insights.promptJsonData.modelDetails,
              gender: convertGenderForAI(gender)
        });

        // Split the generated image into panels
        try {
          const imageBuffer = Buffer.from(imageData, 'base64');
          angleBuffers = await splitCompositeImage(imageBuffer);
        } catch (error) {
          console.error('Error splitting generated image:', error);
          return NextResponse.json({ 
            error: `Failed to process generated image: ${error.message}` 
          }, { status: 500 });
        }
        
      } else if (generationMethod === 'GENERATE_INDIVIDUAL_PORTRAITS') {
        // Portrait generation approach
        console.log("[API] ✅ CONFIRMED: Using portrait generation approach");
        console.log("[API] Generating individual front and back portraits with reference consistency");
        console.log("[API] Quality level:", quality);
        
        // Generate front image first
        console.log("[API] Step 1: Generating front view");
        const frontImageData = await generatePortraitWithOpenAI(insights.promptJsonData.description, {
              size: "1024x1536",
              quality: quality,
              itemDescription: isWaitlistApplication ? userPrompt : `${itemType} in ${color}`,
              frontDesign: insights.promptJsonData.frontDetails,
          modelDetails: insights.promptJsonData.modelDetails,
              gender: convertGenderForAI(gender)
        });

        // Generate back image using front as reference for consistency
        console.log("[API] Step 2: Generating back view with front reference for consistency");
        const backImageData = await generatePortraitWithOpenAI(insights.promptJsonData.description, {
              size: "1024x1536", 
              quality: quality,
          itemDescription: isWaitlistApplication ? userPrompt : `${itemType} in ${color}`,
          backDesign: insights.promptJsonData.backDetails,
          modelDetails: insights.promptJsonData.modelDetails,
          gender: convertGenderForAI(gender),
          referenceImage: frontImageData // Pass front image as reference for consistency
        });
        
        // Create panels from individual portraits
        try {
          const frontImageBuffer = Buffer.from(frontImageData, 'base64');
          const backImageBuffer = Buffer.from(backImageData, 'base64');
          angleBuffers = await createPortraitPanels(frontImageBuffer, backImageBuffer);

          // For portrait approach, we create a composite for consistency
          // This ensures both approaches return the same data structure
          const compositeWidth = 1536;
          const compositeHeight = 1024;
          
          // Create composite by placing panels side by side
          imageData = await sharp({
            create: {
              width: compositeWidth,
              height: compositeHeight,
              channels: 3,
              background: { r: 255, g: 255, b: 255 }
            }
          })
          .composite([
            { input: angleBuffers[ANGLES.FRONT], left: 0, top: 0 },
            { input: angleBuffers[ANGLES.BACK], left: Math.floor(compositeWidth/2), top: 0 }
          ])
          .png()
          .toBuffer()
          .then(buffer => buffer.toString('base64'));
          
        } catch (error) {
          console.error('Error creating portrait panels:', error);
          return NextResponse.json({ 
            error: `Failed to process generated portraits: ${error.message}` 
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

      // SUCCESS: Consume credits only after successful generation and upload
      try {
        await consumeCreditsForGeneration(userId, quality);
        console.log(`[API] ✅ Credits consumed for successful generation (${quality})`);
      } catch (error) {
        console.error('Error consuming credits after successful generation:', error);
        // Don't fail the request if credit consumption fails - generation was successful
      }

      // Return the generated design with all necessary URLs
      return NextResponse.json({
        success: true,
        aiDescription: insights.promptJsonData.description,
        angleUrls,
        frontImage: angleUrls[ANGLES.FRONT],
        backImage: angleUrls[ANGLES.BACK],
        compositeImage: imageData
      });
    }

  } catch (error) {
    console.error('Error in design generation:', error);
    
    // Return appropriate error based on the error type
    if (error.message?.includes('OpenAI')) {
      return NextResponse.json({ 
        error: 'AI service temporarily unavailable. Please try again in a moment.' 
      }, { status: 503 });
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      return NextResponse.json({ 
        error: 'Service is busy. Please try again in a few minutes.' 
      }, { status: 429 });
    } else if (error.message?.includes('safety system')) {
      return NextResponse.json({ 
        error: 'Your request was flagged by our content safety system. Please try with different wording.' 
      }, { status: 400 });
    } else {
      return NextResponse.json({ 
        error: 'An unexpected error occurred. Please try again.' 
      }, { status: 500 });
    }
  }
} 