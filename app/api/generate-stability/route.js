import { NextResponse } from "next/server";
import sanitizePrompt from "@/utils/sanitizePrompt";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";
import { generateImageWithOpenAI } from "@/services/openaiService";

// ✅ Ensure this route runs server-side
export const runtime = "nodejs";

// ✅ Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Add this log to verify the Supabase URL being used by the client
console.log("Supabase client initialized with URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);

export async function POST(req) {
  try {
    const { prompt, userId, service = 'openai', imageOptions = {}, promptJsonData = null } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

    if (useMockApi) {
      const mockImages = [
        "/images/clothing-item-1.png",
        "/images/clothing-item-2.png",
        "/images/clothing-item-3.png",
      ];
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      return NextResponse.json({ imageUrl: randomImage });
    }

    const bucketName = "clothingitemimages";

    if (service === 'openai') {
      console.log("[API /generate-stability] Using OpenAI DALL-E for multi-angle image generation.");
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: "OpenAI API key is not configured on the server." }, { status: 503 });
      }
      try {
        const b64_json = await generateImageWithOpenAI(sanitizedPrompt, {
          ...imageOptions,
          promptJsonData
        });

        const imageBuffer = Buffer.from(b64_json, "base64");
        const filename = `${userId}/${uuidv4()}_multi.png`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filename, imageBuffer, {
            contentType: "image/png",
            upsert: false,
          });

        if (uploadError) {
          console.error("❌ Supabase upload error:", JSON.stringify(uploadError, null, 2));
          return NextResponse.json({ error: "Image upload failed. Details: " + uploadError.message }, { status: 500 });
        }

        const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filename);
        return NextResponse.json({ imageUrl: publicUrl });

      } catch (openAiError) {
        console.error("❌ OpenAI DALL-E Error in API route:", openAiError);
        return NextResponse.json({ error: openAiError.message || "Error from OpenAI DALL-E service" }, { status: 500 });
      }
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
        .from(bucketName)
        .upload(filename, imageBuffer, {
          contentType: "image/png",
          upsert: false,
        });

      if (uploadError) {
        console.error("❌ Supabase upload error:", JSON.stringify(uploadError, null, 2));
        return NextResponse.json({ error: "Image upload failed. Details: " + uploadError.message }, { status: 500 });
      }

      const { data: { publicUrl } } = supabase.storage.from(bucketName).getPublicUrl(filename);
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
