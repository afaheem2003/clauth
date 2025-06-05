import { NextResponse } from 'next/server';
import { getAIDesignerInsights, generateImageWithOpenAI, inpaintImageWithOpenAI } from '@/services/openaiService';
import { createClient } from "@supabase/supabase-js";
import { ANGLES, getAngleImagePath } from '@/utils/imageProcessing';
import sharp from 'sharp';

// Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

export async function POST(req) {
  try {
    const data = await req.json();
    const { itemType, color, userPrompt, userId, inpaintingMask, originalImage } = data;

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    // Step 1: Get AI insights
    let insights;
    try {
      insights = await getAIDesignerInsights({
        itemDescription: `${itemType} in ${color}`,
        frontDesign: userPrompt,
        backDesign: userPrompt,
        modelDetails: "Professional model with neutral expression"
      });
    } catch (error) {
      console.error('Error getting AI insights:', error);
      return NextResponse.json({ 
        error: `Failed to get AI insights: ${error.message}` 
      }, { status: 500 });
    }

    // Step 2: Generate or inpaint the image
    let imageData;
    try {
      if (inpaintingMask && originalImage) {
        // Use inpainting if mask and original image are provided
        imageData = await inpaintImageWithOpenAI(
          userPrompt,
          originalImage,
          inpaintingMask,
          {
            size: "1536x1024",
            quality: "high"
          }
        );
      } else {
        // Use standard generation for new images
        imageData = await generateImageWithOpenAI(
          insights.promptJsonData.description,
          {
            size: "1536x1024",
            quality: "high",
            itemDescription: `${itemType} in ${color}`,
            frontDesign: insights.promptJsonData.frontDetails,
            backDesign: insights.promptJsonData.backDetails,
            modelDetails: "Professional model with neutral expression"
          }
        );
      }
    } catch (error) {
      console.error('Error in image generation/inpainting:', error);
      return NextResponse.json({ 
        error: `Failed to ${inpaintingMask ? 'inpaint' : 'generate'} image: ${error.message}` 
      }, { status: 500 });
    }

    // Step 3: Split the image and store the panels
    let angleBuffers;
    try {
      const imageBuffer = Buffer.from(imageData, 'base64');
      angleBuffers = await splitCompositeImage(imageBuffer);
    } catch (error) {
      console.error('Error splitting image:', error);
      return NextResponse.json({ 
        error: `Failed to process generated image: ${error.message}` 
      }, { status: 500 });
    }

    // Step 4: Upload the panels
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
      suggestedName: insights.promptJsonData.name,
      angleUrls,
      compositeImage: imageData // Return the full composite image for potential inpainting
    });

  } catch (error) {
    console.error('Error in design generation:', error);
    return NextResponse.json(
      { error: `Unexpected error: ${error.message}` },
      { status: 500 }
    );
  }
} 