import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.uid;

  const {
    plushieId,
    imageUrl,
    quantity = 1,
    returnTo = "/discover",
  } = await req.json();

  const qty = Math.max(1, parseInt(quantity, 10));
  const priceInCents = 5499;
  const origin = req.headers.get("origin");

  const base = origin + returnTo;
  const successUrl = `${base}?success=true&plushieId=${plushieId}`;
  const cancelUrl = `${base}?canceled=true&plushieId=${plushieId}`;
  const fullImage = imageUrl.startsWith("http") ? imageUrl : `${origin}${imageUrl}`;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: priceInCents,
            product_data: {
              name: `Pre‑order Plushie (${plushieId})`,
              images: [fullImage],
            },
          },
          quantity: qty,
        },
      ],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual",
      },
      shipping_address_collection: {
        allowed_countries: ["US", "CA", "GB", "AU"],
      },
      billing_address_collection: "required",
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: userId,
      metadata: { plushieId, quantity: qty.toString() },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json(
      { error: "Could not create checkout session" },
      { status: 500 }
    );
  }
}
