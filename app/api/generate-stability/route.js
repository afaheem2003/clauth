import { NextResponse } from "next/server";
import sanitizePrompt from "@/utils/sanitizePrompt";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { generateImageWithOpenAI } from "@/services/openaiService";
import { ANGLES, getAngleImagePath } from '@/utils/imageProcessing';
import sharp from 'sharp';

// ✅ Ensure this route runs server-side
export const runtime = "nodejs";

// ✅ Create a private Supabase server-side client
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

export async function POST(req) {
  try {
    const { promptData, userId, service = 'openai', imageOptions = {} } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    if (!promptData) {
      return NextResponse.json({ error: "Missing prompt data" }, { status: 400 });
    }

    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

    if (useMockApi) {
      // For mock data, return predefined URLs for all angles
      const mockUrls = {
        [ANGLES.FRONT]: "/images/clothing-item-1.png",
        [ANGLES.BACK]: "/images/clothing-item-2.png"
      };
      return NextResponse.json({ angleUrls: mockUrls });
    }

    if (service === 'openai') {
      console.log("[API /generate-stability] Using OpenAI DALL-E for multi-angle image generation.");
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API key is not configured on the server." }, { status: 503 });
      }

      // Generate the composite image using the structured promptData
      const imageData = await generateImageWithOpenAI(null, {
        ...imageOptions,
        ...promptData
      });

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(imageData, 'base64');

      // Split the composite image into angles
      const angleBuffers = await splitCompositeImage(imageBuffer);
      
      // Generate a temporary ID for the clothing item
      const tempItemId = `temp_${Date.now()}`;
      
      // Upload each angle to Supabase storage
      const angleUrls = {};
      
      await Promise.all(Object.entries(angleBuffers).map(async ([angle, buffer]) => {
        const filePath = getAngleImagePath(userId, tempItemId, angle);
        
        const { data, error } = await supabase.storage
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

      return NextResponse.json({ 
        angleUrls,
        tempItemId
      });
    } else {
      // For Stability AI, we need to construct a text prompt from the structured data
      console.log("[API /generate-stability] Using Stability AI for image generation.");
      const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
      if (!STABILITY_API_KEY) {
        return NextResponse.json({ error: "Missing Stability API key" }, { status: 500 });
      }

      // Construct a text prompt from the structured data
      const textPrompt = `A ${promptData.itemDescription}. Front design: ${promptData.frontDesign}. Back design: ${promptData.backDesign}. Model: ${promptData.modelDetails}`;
      const sanitizedPrompt = sanitizePrompt(textPrompt);

      // For Stability AI, we'll generate a single front view for now
      const formData = new FormData();
      formData.append("prompt", sanitizedPrompt);
      formData.append("model", "stable-diffusion-xl");
      formData.append("width", "1024");
      formData.append("height", "1024");
      formData.append("steps", "30");
      formData.append("cfg_scale", "7.5");
      formData.append("samples", "1");

      const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Stability API Error:", errorText);
        return NextResponse.json({ error: "Error from Stability API" }, { status: response.status });
      }

      const data = await response.json();
      if (!data.image) {
        return NextResponse.json({ error: "No image returned from Stability" }, { status: 500 });
      }

      const imageBuffer = Buffer.from(data.image, "base64");
      const filename = `${userId}/${uuidv4()}.png`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('clothingitemimages')
        .upload(filename, imageBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ Supabase upload error:", JSON.stringify(uploadError, null, 2));
        return NextResponse.json({ error: "Image upload failed. Details: " + uploadError.message }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage.from('clothingitemimages').getPublicUrl(filename);
      return NextResponse.json({ imageUrl: publicUrl });
    }

  } catch (error) {
    console.error("🔥 Unexpected Error in /api/generate-stability:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
