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
        priceId: 'price_1RX5cMRgxXa12fTw2kN2DeeF',
        name: 'Creator',
        price: 9,
      },
      'pro_creator': {
        priceId: 'price_1RX5cjRgxXa12fTwn1CqVF2v',
        name: 'Creator Pro',
        price: 15,
      },
      'starter': {
        priceId: null, // Free plan
        name: 'Starter',
        price: 0,
      }
    };

    const plan = plans[planId];
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's current subscription status
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: user.id }
    });

    console.log('👤 User subscription status:', {
      userId: user.id,
      stripeCustomerId: user.stripeCustomerId,
      currentSubscriptionType: userCredits?.subscriptionType,
      requestedPlan: planId
    });

    // If downgrading to free plan
    if (planId === 'starter') {
      // Find and cancel existing Stripe subscription
      if (user.stripeCustomerId) {
        try {
          const subscriptions = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: 'active',
            limit: 1,
          });

          if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            await stripe.subscriptions.update(subscription.id, {
              cancel_at_period_end: true,
            });
            
            console.log('✅ Subscription set to cancel at period end');
          }
        } catch (error) {
          console.error('Error canceling subscription:', error);
        }
      }

      // Update user to free plan immediately
      await prisma.userCredits.upsert({
        where: { userId: user.id },
        update: {
          subscriptionType: 'FREE',
          mediumCredits: 120,
          highCredits: 5,
          dailyMediumCap: 15,
          dailyHighCap: null,
          lastReset: new Date(),
        },
        create: {
          userId: user.id,
          subscriptionType: 'FREE',
          mediumCredits: 120,
          highCredits: 5,
          dailyMediumCap: 15,
          dailyHighCap: null,
          lastReset: new Date(),
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Downgraded to free plan. Subscription will cancel at period end.' 
      });
    }

    // For paid plans, check if user has existing subscription
    if (user.stripeCustomerId) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: user.stripeCustomerId,
          status: 'active',
          limit: 1,
        });

        console.log('🔍 Found subscriptions:', subscriptions.data.length);

        // If user has an active subscription, modify it
        if (subscriptions.data.length > 0) {
          const subscription = subscriptions.data[0];
          console.log('📝 Updating existing subscription:', subscription.id);
          
          // Update the subscription to the new price
          const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
            items: [{
              id: subscription.items.data[0].id,
              price: plan.priceId,
            }],
            proration_behavior: 'create_prorations', // This handles prorating the price difference
          });

          console.log('✅ Subscription updated successfully');
          
          return NextResponse.json({ 
            success: true, 
            message: 'Subscription updated successfully',
            subscriptionId: updatedSubscription.id 
          });
        } else {
          console.log('ℹ️ No active subscriptions found, will create new checkout session');
        }
      } catch (error) {
        console.error('Error checking/updating existing subscription:', error);
        // Fall through to create new subscription
      }
    } else {
      console.log('ℹ️ No Stripe customer ID found, will create new customer and checkout');
    }

    // If no existing subscription, create new one (same as before)
    // Create or get customer
    let customer;
    if (user.stripeCustomerId) {
      try {
        customer = await stripe.customers.retrieve(user.stripeCustomerId);
      } catch (error) {
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
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
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
    console.error('Subscription update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
} 