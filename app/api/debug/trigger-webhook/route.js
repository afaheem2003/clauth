import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Create a simple test event to see if our webhook handler processes it
    const testEvent = {
      id: 'evt_test_123',
      type: 'checkout.session.completed',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: 'cs_test_123',
          mode: 'subscription',
          status: 'complete',
          payment_status: 'paid',
          customer: 'cus_test_123',
          subscription: 'sub_test_123',
          metadata: {
            userId: 'test_user',
            planId: 'creator',
            type: 'subscription'
          }
        }
      }
    };

    // Send this test event to our webhook handler
    const webhookResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      },
      body: JSON.stringify(testEvent)
    });

    const result = await webhookResponse.text();
    
    return NextResponse.json({
      message: 'Test webhook sent',
      webhookStatus: webhookResponse.status,
      webhookResponse: result
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 