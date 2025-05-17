import { NextResponse } from "next/server";
import sanitizePrompt from "@/utils/sanitizePrompt";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@supabase/supabase-js";

// ✅ Ensure this route runs server-side
export const runtime = "nodejs";

// ✅ Create a private Supabase server-side client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { prompt, userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing user ID" }, { status: 401 });
    }

    const sanitizedPrompt = sanitizePrompt(prompt);
    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

    if (useMockApi) {
      const mockImages = [
        "/images/plushie-1.png",
        "/images/plushie-2.png",
        "/images/plushie-3.png",
      ];
      const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
      return NextResponse.json({ imageUrl: randomImage });
    }

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
      return NextResponse.json({ error: "Missing Stability API key" }, { status: 500 });
    }

    // 🧠 Generate image from Stability AI
    const formData = new FormData();
    formData.append("prompt", sanitizedPrompt);
    formData.append("model", "stable-diffusion-xl");
    formData.append("width", "512");
    formData.append("height", "512");
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

    // 📦 Upload the image to Supabase storage
    const filename = `${userId}/${uuidv4()}.png`;
    const imageBuffer = Buffer.from(data.image, "base64");

    const { error: uploadError } = await supabase.storage
      .from("plushies")
      .upload(filename, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ Supabase upload error:", uploadError);
      return NextResponse.json({ error: "Image upload failed" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("plushies").getPublicUrl(filename);

    return NextResponse.json({ imageUrl: publicUrl });

  } catch (error) {
    console.error("🔥 Unexpected Error:", error);
    return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
  }
}
