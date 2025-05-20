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
 * Splits a 2x2 composite image into four separate images
 */
async function splitCompositeImage(imageBuffer) {
  try {
    // Get image metadata
    const metadata = await sharp(imageBuffer).metadata();
    
    // For a 1024x1024 image, each quadrant should be exactly 512x512
    // Add a small padding to ensure we capture the full content
    const padding = 2; // 2 pixels padding to handle any anti-aliasing at the edges
    const quadrantWidth = Math.floor(metadata.width / 2) + padding;
    const quadrantHeight = Math.floor(metadata.height / 2) + padding;
    
    // Calculate starting positions with negative offsets to capture full content
    const positions = [
      { left: -padding, top: -padding },                    // Top Left (Front)
      { left: metadata.width/2 - padding, top: -padding },  // Top Right (Right Side)
      { left: -padding, top: metadata.height/2 - padding }, // Bottom Left (Left Side)
      { left: metadata.width/2 - padding, top: metadata.height/2 - padding } // Bottom Right (Back)
    ];

    // Extract each quadrant with padding
    const extractQuadrant = async (left, top) => {
      return sharp(imageBuffer)
        .extract({
          left: Math.max(0, left), // Ensure we don't go negative
          top: Math.max(0, top),   // Ensure we don't go negative
          width: quadrantWidth,
          height: quadrantHeight
        })
        .resize(512, 512, { // Resize to exact dimensions
          fit: 'fill',
          position: 'center'
        })
        .toBuffer();
    };

    // Extract all quadrants in parallel
    const [front, rightSide, leftSide, back] = await Promise.all(
      positions.map(pos => extractQuadrant(pos.left, pos.top))
    );

    return {
      [ANGLES.FRONT]: front,
      [ANGLES.RIGHT_SIDE]: rightSide,
      [ANGLES.LEFT_SIDE]: leftSide,
      [ANGLES.BACK]: back
    };
  } catch (error) {
    console.error('Error splitting composite image:', error);
    throw new Error('Failed to split composite image into angles');
  }
}

export async function POST(req) {
  try {
    const { prompt, userId, service = 'openai', imageOptions = {}, promptJsonData = null } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

    if (useMockApi) {
      // For mock data, return predefined URLs for all angles
      const mockUrls = {
        [ANGLES.FRONT]: "/images/clothing-item-1.png",
        [ANGLES.RIGHT_SIDE]: "/images/clothing-item-2.png",
        [ANGLES.LEFT_SIDE]: "/images/clothing-item-3.png",
        [ANGLES.BACK]: "/images/clothing-item-4.png"
      };
      return NextResponse.json({ angleUrls: mockUrls });
    }

    if (service === 'openai') {
      console.log("[API /generate-stability] Using OpenAI DALL-E for multi-angle image generation.");
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API key is not configured on the server." }, { status: 503 });
      }

      // Generate the composite image
      const imageData = await generateImageWithOpenAI(sanitizedPrompt, {
        ...imageOptions,
        promptJsonData
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
      // Default to Stability AI if service is not 'openai' or not specified
      console.log("[API /generate-stability] Using Stability AI for image generation.");
      const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
      if (!STABILITY_API_KEY) {
        return NextResponse.json({ error: "Missing Stability API key" }, { status: 500 });
      }

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
    if (error instanceof SyntaxError && error.message.includes('JSON')) {
      return NextResponse.json({ error: "Invalid JSON in request body." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Unexpected server error" }, { status: 500 });
  }
}
