import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/authOptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function POST(req, { params }) {
  const { id } = params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // fetch preorder and its payment intent
  const preorder = await prisma.preorder.findUnique({
    where: { id },
    include: { user: true, clothingItem: true },
  });

  if (!preorder || !preorder.payment || !preorder.payment.intentId) {
    return NextResponse.json({ error: 'Preorder or payment not found' }, { status: 404 });
  }

  try {
    // issue refund on Stripe
    await stripe.refunds.create({
      payment_intent: preorder.payment.intentId,
    });

    // update status in DB
    const updated = await prisma.preorder.update({
      where: { id },
      data: { status: 'REFUNDED' },
      include: { user: true, clothingItem: true },
    });

    await prisma.paymentIntent.update({
      where: { id: preorder.payment.id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('Refund error:', err);
    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
