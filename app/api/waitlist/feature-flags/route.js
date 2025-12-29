// app/api/waitlist/feature-flags/route.js
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const aiGenerationEnabled = process.env.ENABLE_AI_GENERATION !== 'false'
    
    return NextResponse.json({
      aiGenerationEnabled,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching feature flags:', error)
    }
    
    // Default to enabled on error
    return NextResponse.json({
      aiGenerationEnabled: true,
    })
  }
}

