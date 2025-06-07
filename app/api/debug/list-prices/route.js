import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function GET() {
  try {
    const prices = await stripe.prices.list({ limit: 20 });
    
    return NextResponse.json({
      prices: prices.data.map(price => ({
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        type: price.type,
        product: price.product
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 