import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing session_id parameter' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent', 'line_items']
    });
    
    return NextResponse.json({
      session: {
        id: session.id,
        mode: session.mode,
        status: session.status,
        payment_status: session.payment_status,
        subscription: session.subscription,
        payment_intent: session.payment_intent,
        customer: session.customer,
        metadata: session.metadata,
        line_items: session.line_items
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 