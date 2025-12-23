// app/api/design/validate-image/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    // Authentication check - prevent unauthorized API usage
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { image, type } = await request.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      if (process.env.NODE_ENV === 'development') {
        console.error("OPENAI_API_KEY is not set.");
      }
      return NextResponse.json(
        { error: 'Image validation service is not configured' },
        { status: 500 }
      );
    }

    // Remove data URL prefix if present
    const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

    if (process.env.NODE_ENV === 'development') {
      console.log('[Image Validation] Analyzing image...');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an image content moderator for a family-friendly fashion e-commerce platform. Your task is to validate uploaded images to ensure they meet our platform guidelines.

VALIDATION CRITERIA:

1. CLOTHING/ACCESSORY PRESENCE (REQUIRED):
   - Image MUST show a clothing item or fashion accessory
   - Acceptable items: shirts, pants, dresses, jackets, shoes, bags, hats, jewelry, etc.
   - The clothing item must be the primary focus of the image

2. MODEL PRESENCE (REQUIRED):
   - Image MUST show the clothing item being worn/modeled by a person
   - Flat lay photos or product-only shots are NOT acceptable
   - Mannequins are acceptable if the clothing is clearly displayed

3. FAMILY-FRIENDLY CONTENT (REQUIRED):
   - NO actual nudity (exposed genitals, nipples, or buttocks)
   - Swimwear (bikinis, swim trunks, one-pieces) is ACCEPTABLE
   - Activewear, sportswear, and athletic clothing is ACCEPTABLE
   - Fashion-appropriate clothing for the item type is ACCEPTABLE
   - NO extreme fetish wear or explicitly sexual content
   - NO violence, weapons, or disturbing imagery
   - NO hate symbols, offensive gestures, or inappropriate text

4. IMAGE QUALITY (REQUIRED):
   - Image must be clear and in focus
   - Clothing item must be clearly visible and identifiable
   - Adequate lighting to see the clothing details
   - NOT overly dark, blurry, or pixelated

5. PROFESSIONAL SUITABILITY (REQUIRED):
   - Image should be suitable for an e-commerce fashion platform
   - NO memes, cartoons, or non-photographic content
   - NO watermarks, logos, or excessive text overlays
   - NO inappropriate backgrounds or settings

6. PERSPECTIVE (for ${type} view):
   - ${type === 'front' ? 'Image should show the FRONT view of the clothing item' : 'Image should show the BACK view of the clothing item'}
   - Full body or upper body shots are preferred
   - The clothing item should be clearly visible from the specified angle

Your response must be a JSON object with these exact fields:
{
  "isValid": boolean,
  "reason": "Brief explanation if rejected, or confirmation if approved",
  "violations": ["array of specific issues found, empty if none"],
  "suggestions": "Brief suggestion for improvement if rejected, empty string if approved"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please validate this ${type} view image for our fashion platform. Analyze it carefully against all criteria.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const validationResult = JSON.parse(response.choices[0].message.content);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Image Validation] Result:', validationResult);
    }

    return NextResponse.json({
      success: true,
      validation: validationResult
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Image Validation] Error:', error);
    }
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Vision API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to validate image. Please try again.' },
      { status: 500 }
    );
  }
}

