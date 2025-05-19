import { NextResponse } from 'next/server';
import { getAIDesignerInsights } from '@/services/openaiService'; // Adjusted path

export async function POST(req) {
  try {
    const body = await req.json();
    const creativePrompt = body.creativePrompt;

    if (!creativePrompt) {
      return NextResponse.json({ error: 'Creative prompt is required in the request body.' }, { status: 400 });
    }

    const insights = await getAIDesignerInsights(creativePrompt);
    return NextResponse.json(insights);

  } catch (error) {
    console.error("[API] Error in AI Designer Insights generation:", error.message);
    let statusCode = 500;
    if (error.message.includes("OpenAI API key is not configured")) {
        statusCode = 503; // Service Unavailable
    } else if (error.message.includes("Creative prompt cannot be empty")) {
        statusCode = 400; // Bad Request
    } else if (error.message.startsWith("OpenAI API Error")) {
        statusCode = 502; // Bad Gateway (error from upstream service)
    }

    return NextResponse.json({ error: error.message || "Failed to generate AI designer insights." }, { status: statusCode });
  }
} 