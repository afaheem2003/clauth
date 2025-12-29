// app/api/waitlist/feature-flags/route.js
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const aiGenerationEnabled = process.env.ENABLE_AI_GENERATION !== 'false'
    const waitlistEnabled = process.env.WAITLIST_ENABLED === 'true'
    
    return NextResponse.json({
      aiGenerationEnabled,
      waitlistEnabled,
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching feature flags:', error)
    }
    
    // Default values on error
    return NextResponse.json({
      aiGenerationEnabled: true,
      waitlistEnabled: true,
    })
  }
}

