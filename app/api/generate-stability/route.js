import { NextResponse } from "next/server";
import { sanitizePrompt } from "@/app/utils/sanitizePrompt"; // Ensure this path is correct

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";

    const sanitizedPrompt = sanitizePrompt(prompt);

    if (useMockApi) {
      console.log("🟡 Mock API Mode Enabled: Returning local plushie image.");
      const mockImages = [
        "/images/plushie-1.png",
        "/images/plushie-2.png",
        "/images/plushie-3.png",
      ];
      const randomImage =
        mockImages[Math.floor(Math.random() * mockImages.length)];
      return NextResponse.json({ imageUrl: randomImage });
    }

    const STABILITY_API_KEY = process.env.STABILITY_API_KEY;
    if (!STABILITY_API_KEY) {
      console.error("❌ Missing Stability AI API Key!");
      return NextResponse.json(
        { error: "Internal server error: API key is missing." },
        { status: 500 }
      );
    }

    console.log(
      "📤 Sending sanitized prompt to Stability AI:",
      sanitizedPrompt
    );

    const formData = new FormData();
    formData.append("prompt", sanitizedPrompt);
    formData.append("model", "stable-diffusion-xl");
    formData.append("width", "512"); // Optional: 1024 is too large for plushie scale
    formData.append("height", "512");
    formData.append("steps", "30");
    formData.append("cfg_scale", "7.5");
    formData.append("samples", "1");

    const response = await fetch(
      "https://api.stability.ai/v2beta/stable-image/generate/core",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${STABILITY_API_KEY}`,
          Accept: "application/json",
        },
        body: formData,
      }
    );

    console.log("📥 Stability AI Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Stability AI API Error:", errorText);
      return NextResponse.json(
        { error: "We’re experiencing a temporary issue generating plushies." },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.image) {
      console.error("❌ Unexpected response from Stability AI:", data);
      return NextResponse.json(
        { error: "Unexpected response from AI service." },
        { status: 500 }
      );
    }

    const imageUrl = `data:image/png;base64,${data.image}`;
    console.log("✅ Plushie Generated. Returning image.");
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("🔥 Internal Server Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
