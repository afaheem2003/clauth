// app/api/plushies/approve/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**  POST { id } – when an admin clicks “Approve”
 *   • captures every uncaptured Stripe payment-intent
 *   • marks each preorder → COLLECTED  (if capture succeeded)
 *   • marks paymentIntent → SUCCEEDED / FAILED
 *   • finally sets plushie.status → IN_PRODUCTION
 */
export async function POST(req) {
  /* ────────────── auth guard ────────────── */
  const session = await getServerSession(authOptions);
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'Missing plushie id' }, { status: 400 });
  }

  /* ────────────── fetch target plushie & preorders ────────────── */
  const plushie = await prisma.plushie.findUnique({
    where: { id, status: 'PENDING' },
    include: {
      preorders: {
        where: { status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { payment: true }
      }
    }
  });

  if (!plushie)
    return NextResponse.json({ error: 'Plushie not found / not pending' }, { status: 404 });

  if (plushie.pledged < plushie.minimumGoal)
    return NextResponse.json({ error: 'Goal not yet reached' }, { status: 409 });

  /* ────────────── iterate preorders ────────────── */
  const captureResults = [];

  for (const po of plushie.preorders) {
    const intentRow = po.payment;
    if (!intentRow?.intentId) {
      captureResults.push({ preorderId: po.id, ok: false, reason: 'No paymentIntentId' });
      continue;
    }

    try {
      // 1) Fetch current status of payment intent from Stripe
      const pi = await stripe.paymentIntents.retrieve(intentRow.intentId);

      if (pi.status === 'requires_capture') {
        // 2) Capture the payment
        await stripe.paymentIntents.capture(intentRow.intentId);

        // 3) Update database after capture
        await prisma.$transaction([
          prisma.paymentIntent.update({
            where: { id: intentRow.id },
            data: { status: 'SUCCEEDED' },
          }),
          prisma.preorder.update({
            where: { id: po.id },
            data: { status: 'COLLECTED' },
          }),
        ]);

        captureResults.push({ preorderId: po.id, ok: true });
      } else {
        captureResults.push({
          preorderId: po.id,
          ok: false,
          reason: `PaymentIntent is already ${pi.status}`,
        });
      }
    } catch (err) {
      console.error(`❌ Capture failed for preorder ${po.id}`, err);

      if (intentRow?.id) {
        await prisma.paymentIntent.update({
          where: { id: intentRow.id },
          data: { status: 'FAILED' },
        });
      }

      captureResults.push({ preorderId: po.id, ok: false, reason: err.message });
    }
  }

  /* ────────────── promote plushie if at least one capture worked ────────────── */
  const anySucceeded = captureResults.some(r => r.ok);
  if (anySucceeded) {
    await prisma.plushie.update({
      where: { id },
      data: { status: 'IN_PRODUCTION' }
    });
  }

  return NextResponse.json({
    success: anySucceeded,
    captured: captureResults.filter(r => r.ok).length,
    failed: captureResults.filter(r => !r.ok)
  });
}
