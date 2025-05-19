// ✅ Updated Stripe webhook handler with address collection + email toggle
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { sendReceiptWithPDF } from "@/lib/sendReceiptWithPDF";

export const config = { runtime: "node" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

function mapStripePaymentStatus(stripeStatus) {
  switch (stripeStatus) {
    case "paid":
      return "SUCCEEDED";
    case "unpaid":
    case "requires_payment_method":
    case "no_payment_required":
      return "FAILED";
    default:
      return "REQUIRES_CAPTURE";
  }
}

export async function POST(request) {
  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    console.error("⚠️ Missing stripe-signature header");
    return NextResponse.json({ received: false }, { status: 400 });
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch (e) {
    console.error("❌ Failed to read request body:", e);
    return NextResponse.json({ received: false }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook event parsed:", event.type);
  } catch (err) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return NextResponse.json({ received: false }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    console.log("📦 Handling checkout.session.completed");
    const session = event.data.object;
    const meta = session.metadata || {};
    const userId = session.client_reference_id;
    const clothingItemId = meta.clothingItemId;
    const qty = parseInt(meta.quantity || "1", 10);
    const cents = session.amount_total || 0;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || "friend";
    const address = session.customer_details?.address;

    console.log("📌 Session metadata:", { userId, clothingItemId, qty, cents, email });

    try {
      console.log("💳 Recording payment intent...");
      const payment = await prisma.paymentIntent.create({
        data: {
          provider: "stripe",
          intentId: session.payment_intent,
          clientSecret: session.payment_intent_data?.client_secret || null,
          status: mapStripePaymentStatus(session.payment_status),
          fullName: name,
          address1: address?.line1 || "",
          address2: address?.line2 || null,
          city: address?.city || "",
          state: address?.state || "",
          zip: address?.postal_code || "",
          country: address?.country || "",
        },
      });

      console.log("📦 Creating preorder...");
      await prisma.preorder.create({
        data: {
          userId,
          clothingItemId: clothingItemId,
          price: cents / 100,
          quantity: qty,
          status: "CONFIRMED",
          paymentIntentId: payment.id,
        },
      });

      console.log("📊 Updating clothing item pledge count...");
      await prisma.clothingItem.update({
        where: { id: clothingItemId },
        data: { pledged: { increment: qty } },
      });

      console.log("🔍 Fetching clothing item name...");
      const clothingItemData = await prisma.clothingItem.findUnique({
        where: { id: clothingItemId },
        select: { name: true },
      });

      if (email && process.env.EMAIL_ENABLED === "true") {
        console.log("📨 Sending receipt email to:", email);
        await sendReceiptWithPDF({
          to: email,
          name,
          email,
          itemName: clothingItemData?.name || "Clothing Item",
          qty,
          total: cents / 100,
        });
        console.log("✅ Receipt email sent to", email);
      } else {
        console.log("✉️ Email sending skipped (disabled or no email)");
      }

      console.log("✅ Logged preorder and processed checkout for", userId, clothingItemId, qty);
    } catch (dbErr) {
      console.error("❌ Failed to log preorder or send receipt:", dbErr);
    }
  }

  return NextResponse.json({ received: true });
}
