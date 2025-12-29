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

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Image Moderation] Checking ${type} image for inappropriate content...`);
    }

    // Use OpenAI's FREE Moderation API for content safety
    const moderationResponse = await openai.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: image, // Accepts data URLs directly
          }
        }
      ],
    });

    const result = moderationResponse.results[0];
    const flagged = result.flagged;
    const categories = result.categories;
    const categoryScores = result.category_scores;

    if (process.env.NODE_ENV === 'development') {
      console.log('[Image Moderation] Result:', {
        flagged,
        categories,
        scores: categoryScores
      });
    }

    // Define which categories are blocking for fashion uploads
    const blockingCategories = {
      sexual: categories.sexual,
      'sexual/minors': categories['sexual/minors'],
      harassment: categories.harassment,
      'harassment/threatening': categories['harassment/threatening'],
      hate: categories.hate,
      'hate/threatening': categories['hate/threatening'],
      violence: categories.violence,
      'violence/graphic': categories['violence/graphic'],
      'self-harm': categories['self-harm'],
      'self-harm/intent': categories['self-harm/intent'],
      'self-harm/instructions': categories['self-harm/instructions'],
    };

    // Check if any blocking category was flagged
    const violations = [];
    for (const [category, isFlagged] of Object.entries(blockingCategories)) {
      if (isFlagged) {
        violations.push(category.replace(/\//g, ' or '));
      }
    }

    if (flagged && violations.length > 0) {
      // Image failed moderation
      return NextResponse.json({
        success: true,
        validation: {
          isValid: false,
          reason: 'Image contains inappropriate or unsafe content that violates our community guidelines.',
          violations: violations.map(v => `Content flagged for: ${v}`),
          suggestions: 'Please upload a family-friendly image showing clothing on a model without inappropriate content.'
        }
      });
    }

    // Image passed moderation
    return NextResponse.json({
      success: true,
      validation: {
        isValid: true,
        reason: `${type === 'front' ? 'Front' : 'Back'} image passed safety checks`,
        violations: [],
        suggestions: ''
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Image Moderation] Error:', error);
    }
    
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Moderation API error: ${error.message}` },
        { status: error.status || 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to validate image. Please try again.' },
      { status: 500 }
    );
  }
}

