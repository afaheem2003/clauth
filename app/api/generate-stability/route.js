// app/api/generate-stability/route.js
import { NextResponse } from "next/server";
import sanitizePrompt from "@/app/utils/sanitizePrompt";
import {
  getStorage,
  ref,
  uploadString,
  getDownloadURL,
} from "firebase/storage";
import { initializeApp, getApps, getApp } from "firebase/app";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const storage = getStorage(app);

export async function POST(req) {
  try {
    const { prompt } = await req.json();
    const useMockApi = process.env.NEXT_PUBLIC_USE_MOCK_API === "true";
    const sanitizedPrompt = sanitizePrompt(prompt);

    if (useMockApi) {
      console.log("🟡 Mock API Mode: returning a local plushie image");
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
      console.error("❌ Missing Stability API key");
      return NextResponse.json(
        { error: "Missing Stability API key" },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append("prompt", sanitizedPrompt);
    formData.append("model", "stable-diffusion-xl");
    formData.append("width", "512");
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Stability AI Error:", errorText);
      return NextResponse.json(
        { error: "Error from Stability API" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.image) {
      return NextResponse.json(
        { error: "No image returned from AI" },
        { status: 500 }
      );
    }

    // Upload base64 image to Firebase Storage
    const filename = `plushies/${uuidv4()}.png`;
    const imageRef = ref(storage, filename);
    await uploadString(imageRef, data.image, "base64", {
      contentType: "image/png",
    });
    const firebaseImageUrl = await getDownloadURL(imageRef);

    return NextResponse.json({ imageUrl: firebaseImageUrl });
  } catch (error) {
    console.error("🔥 Unexpected Error:", error);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}
