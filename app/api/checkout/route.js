'use server';

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import Stripe from "stripe";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

export async function POST(req) {
  const session = await getServerSession(authOptions);
  const {
    clothingItemId,
    imageUrl,
    quantity = 1,
    size,
    returnTo = "/discover",
    guestEmail,
  } = await req.json();

  if (!clothingItemId) {
    return NextResponse.json({ error: 'Missing clothingItemId' }, { status: 400 });
  }

  if (!size) {
    return NextResponse.json({ error: 'Size is required' }, { status: 400 });
  }

  const userId = session?.user?.uid || null;
  const qty = Math.max(1, parseInt(quantity, 10));
  const priceInCents = 5499;
  const origin = req.headers.get("origin");

  // --- Fetch Clothing Item Name ---
  let clothingItemName = 'Clothing Item'; // Default name
  if (clothingItemId) {
    try {
      const item = await prisma.clothingItem.findUnique({
        where: { id: clothingItemId },
        select: { name: true, price: true },
      });
      if (item && item.name) {
        clothingItemName = item.name;
      }
    } catch (dbError) {
      console.error("Error fetching clothing item details:", dbError);
    }
  }
  // --- End Fetch Clothing Item Name ---

  const base = origin + returnTo;
  const successUrl = `${base}?success=true&clothingItemId=${clothingItemId}`;
  const cancelUrl = `${base}?canceled=true&clothingItemId=${clothingItemId}`;
  const fullImage = imageUrl && imageUrl.startsWith("http") ? imageUrl : `${origin}${imageUrl || ''}`;

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
              name: clothingItemName,
              images: [fullImage].filter(Boolean),
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
        clothingItemId,
        quantity: qty.toString(),
        size,
        guestEmail: guestEmail || "",
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}
