import { NextResponse } from 'next/server';
import { getAIDesignerInsights } from '@/services/openaiService';

export async function POST(req) {
  try {
    const body = await req.json();
    const { itemDescription, frontDesign, backDesign, modelDetails } = body;

    if (!itemDescription || !frontDesign || !backDesign || !modelDetails) {
      return NextResponse.json({ 
        error: 'All prompt fields (itemDescription, frontDesign, backDesign, modelDetails) are required.' 
      }, { status: 400 });
    }

    // Combine the structured fields into a comprehensive prompt
    const structuredPrompt = {
      itemDescription,
      frontDesign,
      backDesign,
      modelDetails
    };

    const insights = await getAIDesignerInsights(structuredPrompt);
    return NextResponse.json(insights);

  } catch (error) {
    console.error("[API] Error in AI Designer Insights generation:", error.message);
    let statusCode = 500;
    if (error.message.includes("OpenAI API key is not configured")) {
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes("required fields missing")) {
      statusCode = 400; // Bad Request
    } else if (error.message.startsWith("OpenAI API Error")) {
      statusCode = 502; // Bad Gateway (error from upstream service)
    }

    return NextResponse.json({ error: error.message || "Failed to generate AI designer insights." }, { status: statusCode });
  }
} 