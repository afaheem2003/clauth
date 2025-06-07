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

    const { boosterId } = await request.json();
    
    // Get booster info from database or use fallback
    let booster;
    try {
      booster = await prisma.boosterPack.findUnique({
        where: { id: boosterId }
      });
    } catch (error) {
      console.log('Booster not found in DB, using fallback data');
    }

    // Fallback booster data if not in database
    const fallbackBoosters = {
      'medium_micro': {
        id: 'medium_micro',
        name: 'Starter',
        price: 6,
        mediumCredits: 80,
        highCredits: 0,
        description: 'Perfect for trying new ideas'
      },
      'medium_bulk': {
        id: 'medium_bulk',
        name: 'Creator',
        price: 10,
        mediumCredits: 200,
        highCredits: 0,
        description: 'Most popular for active creators'
      },
      'high_micro': {
        id: 'high_micro',
        name: 'Quality',
        price: 6,
        mediumCredits: 0,
        highCredits: 15,
        description: 'Premium quality generations'
      },
      'high_bulk': {
        id: 'high_bulk',
        name: 'Professional',
        price: 12,
        mediumCredits: 0,
        highCredits: 40,
        description: 'Maximum premium credits'
      }
    };

    if (!booster) {
      booster = fallbackBoosters[boosterId];
    }

    if (!booster) {
      return NextResponse.json({ error: 'Invalid booster' }, { status: 400 });
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

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${booster.name} Credit Booster`,
              description: `${booster.mediumCredits} Medium + ${booster.highCredits} High Credits`,
            },
            unit_amount: booster.price * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/credits/boost`,
      metadata: {
        userId: user.id,
        boosterId: boosterId,
        type: 'booster',
        mediumCredits: booster.mediumCredits.toString(),
        highCredits: booster.highCredits.toString(),
        boosterName: booster.name,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('Booster creation error:', error);
    return NextResponse.json({ error: 'Failed to create booster purchase' }, { status: 500 });
  }
} 