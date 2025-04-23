// app/api/webhooks/stripe/route.js
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/app/lib/prisma";

// ensure Node.js Buffer/.text() is available
export const config = { runtime: "node" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    console.error("⚠️ Missing stripe-signature header");
    return NextResponse.json({ received: false }, { status: 400 });
  }

  const rawBody = await request.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err.message);
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session    = event.data.object;
    const meta       = session.metadata || {};
    const userId     = session.client_reference_id;
    const plushieId  = meta.plushieId;
    const qty        = parseInt(meta.quantity || "1", 10);
    const cents      = session.amount_total || 0;

    try {
      // A) record the payment intent
      const payment = await prisma.paymentIntent.create({
        data: {
          provider:     "stripe",
          intentId:     session.payment_intent,
          clientSecret: session.payment_intent_data?.client_secret || null,
          status:       session.payment_status,
        },
      });

      // B) record the preorder itself
      await prisma.preorder.create({
        data: {
          userId,
          plushieId,
          price:            cents / 100,
          quantity:         qty,
          status:           "CONFIRMED",
          paymentIntentId:  payment.id,
        },
      });

      // C) bump the plushie.pledged count so progress bar moves
      await prisma.plushie.update({
        where: { id: plushieId },
        data: { pledged: { increment: qty } },
      });

      console.log("✅ Logged preorder for", userId, plushieId, qty);
    } catch (dbErr) {
      console.error("❌ Failed to log preorder:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}
