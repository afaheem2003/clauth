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
  const { items = [], returnTo = "/discover", guestEmail } = await req.json();

  if (!items.length) {
    return NextResponse.json({ error: 'No items provided' }, { status: 400 });
  }

  const userId = session?.user?.uid || null;
  const origin = req.headers.get("origin");

  // Fetch all clothing items at once
  const clothingItemIds = items.map(item => item.clothingItemId);
  const clothingItems = await prisma.clothingItem.findMany({
    where: { id: { in: clothingItemIds } },
    select: { id: true, name: true, price: true, imageUrl: true },
  });

  // Create a map for quick lookup
  const clothingItemMap = clothingItems.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

  // Create line items for Stripe
  const lineItems = items.map(item => {
    const clothingItem = clothingItemMap[item.clothingItemId];
    if (!clothingItem) return null;

    const fullImage = item.imageUrl && item.imageUrl.startsWith("http") 
      ? item.imageUrl 
      : `${origin}${clothingItem.imageUrl || ''}`;

    return {
      price_data: {
        currency: "usd",
        unit_amount: Math.round(clothingItem.price * 100), // Convert to cents
        product_data: {
          name: `${clothingItem.name} (${item.size})`,
          images: [fullImage].filter(Boolean),
        },
      },
      quantity: item.quantity,
    };
  }).filter(Boolean);

  const base = origin + returnTo;
  const successUrl = `${base}?success=true`;
  const cancelUrl = `${base}?canceled=true`;

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: guestEmail || undefined,
      line_items: lineItems,
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
        items: JSON.stringify(items.map(item => ({
          clothingItemId: item.clothingItemId,
          quantity: item.quantity,
          size: item.size,
        }))),
        guestEmail: guestEmail || "",
      },
    });

    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (err) {
    console.error("❌ Stripe checkout error:", err);
    return NextResponse.json({ error: "Could not create checkout session" }, { status: 500 });
  }
}
