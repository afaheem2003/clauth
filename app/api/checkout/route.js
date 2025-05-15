import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/lib/authOptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const {
    plushieId,
    imageUrl,
    quantity = 1,
    returnTo = "/discover",
    guestEmail,
  } = await req.json();

  const userId = session?.user?.uid || null;
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
      customer_email: guestEmail || undefined,
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
      client_reference_id: userId || undefined,
      metadata: {
        plushieId,
        quantity: qty.toString(),
        guestEmail: guestEmail || "",
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}
