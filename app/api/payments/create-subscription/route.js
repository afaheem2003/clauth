import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId } = await request.json();
    
    // Define your subscription plans with actual Stripe price IDs
    const plans = {
      'creator': {
        priceId: 'price_1RX5cMRgxXa12fTw2kN2DeeF', // $9/month - Confirmed working
        name: 'Creator',
        price: 9,
      },
      'pro_creator': {
        priceId: 'price_1RX5cjRgxXa12fTwn1CqVF2v', // $15/month - Confirmed working
        name: 'Creator Pro',
        price: 15,
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    console.log('🔍 Creating subscription with:', {
      planId,
      priceId: plan.priceId,
      hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
      stripeKeyPrefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...'
    });

    // Test if the price exists
    try {
      const testPrice = await stripe.prices.retrieve(plan.priceId);
      console.log('✅ Price found:', testPrice.id, testPrice.unit_amount);
    } catch (error) {
      console.error('❌ Price not found:', error.message);
      return NextResponse.json({ error: `Price not found: ${plan.priceId}` }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create or get customer
    let customer;
    if (user.stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
        // Customer doesn't exist, create a new one
        customer = await stripe.customers.create({
          email: session.user.email,
          name: session.user.name,
        });
        
        await prisma.user.update({
          where: { email: session.user.email },
          data: { stripeCustomerId: customer.id }
        });
      }
    } else {
      customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
      });
      
      await prisma.user.update({
        where: { email: session.user.email },
        data: { stripeCustomerId: customer.id }
      });
    }

    // Create subscription checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId, // ✅ Use the actual price ID for recurring subscriptions
          quantity: 1,
        },
      ],
      mode: 'subscription', // ✅ Changed from 'payment' to 'subscription'
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/upgrade`,
      metadata: {
        userId: user.id,
        planId: planId,
        type: 'subscription',
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
  }
} 