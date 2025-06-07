// ✅ Updated Stripe webhook handler with credit system + clothing preorders
import { NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { sendReceiptWithPDF } from "@/lib/sendReceiptWithPDF";
import fs from "fs";
import path from "path";

export const config = { runtime: "node" };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
});

// Helper function to log to file for debugging
function logToFile(message) {
  try {
    const logPath = path.join(process.cwd(), 'webhook-debug.log');
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `${timestamp}: ${message}\n`);
  } catch (error) {
    // Ignore file logging errors
  }
}

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
  logToFile("🚀 WEBHOOK RECEIVED - Starting processing");
  console.log("🚀 WEBHOOK RECEIVED - Starting processing");
  console.log("📋 Request details:", {
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  });

  const sig = request.headers.get("stripe-signature");
  if (!sig) {
    logToFile("⚠️ Missing stripe-signature header");
    console.error("⚠️ Missing stripe-signature header");
    return NextResponse.json({ received: false }, { status: 400 });
  }

  logToFile(`🔐 Stripe signature found: ${sig.substring(0, 20)}...`);
  console.log("🔐 Stripe signature found:", sig.substring(0, 20) + "...");

  let rawBody;
  try {
    rawBody = await request.text();
    logToFile(`📝 Raw body length: ${rawBody.length}`);
    console.log("📝 Raw body length:", rawBody.length);
  } catch (e) {
    logToFile(`❌ Failed to read request body: ${e.message}`);
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
    logToFile(`✅ Webhook event parsed successfully: ${JSON.stringify({
      type: event.type,
      id: event.id,
      created: event.created
    })}`);
    console.log("✅ Webhook event parsed successfully:", {
      type: event.type,
      id: event.id,
      created: event.created
    });
  } catch (err) {
    logToFile(`❌ Webhook signature verification failed: ${err.message}`);
    console.error("❌ Webhook signature verification failed:", err.message);
    console.error("🔍 Environment check:", {
      hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
      secretPrefix: process.env.STRIPE_WEBHOOK_SECRET?.substring(0, 10) + "..."
    });
    return NextResponse.json({ received: false }, { status: 400 });
  }

  logToFile(`🔄 Processing event type: ${event.type}`);
  console.log("🔄 Processing event type:", event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        logToFile("📦 Handling checkout.session.completed");
        console.log("📦 Handling checkout.session.completed");
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        logToFile("💰 Handling invoice.payment_succeeded");
        console.log("💰 Handling invoice.payment_succeeded");
        await handleSubscriptionPayment(event.data.object);
        break;
      case 'customer.subscription.updated':
        logToFile("🔄 Handling customer.subscription.updated");
        console.log("🔄 Handling customer.subscription.updated");
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        logToFile("❌ Handling customer.subscription.deleted");
        console.log("❌ Handling customer.subscription.deleted");
        await handleSubscriptionCancelled(event.data.object);
        break;
      default:
        logToFile(`🔄 Unhandled event type: ${event.type}`);
        console.log(`🔄 Unhandled event type: ${event.type}`);
    }

    logToFile("✅ Webhook processing completed successfully");
    console.log("✅ Webhook processing completed successfully");
    return NextResponse.json({ received: true });
  } catch (error) {
    logToFile(`❌ Webhook handler error: ${error.message}`);
    console.error('❌ Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session) {
  console.log("📦 Handling checkout.session.completed");
  const meta = session.metadata || {};
  const userId = session.client_reference_id || meta.userId;
  const type = meta.type;

  console.log("📌 Session metadata:", { userId, type, meta });

  if (type === 'booster') {
    // Handle credit booster purchase
    await handleBoosterPurchase(session, meta);
  } else if (type === 'subscription') {
    // Handle subscription plan purchase
    await handleSubscriptionPurchase(session, meta);
  } else {
    // Handle clothing preorder (existing functionality)
    await handleClothingPreorder(session, meta);
  }
}

async function handleBoosterPurchase(session, meta) {
  console.log("💳 Processing booster purchase");
  const { userId, boosterId, mediumCredits, highCredits, boosterName } = meta;
  const amount = session.amount_total / 100;

  try {
    // Add credits to user account
    await prisma.userCredits.upsert({
      where: { userId },
      update: {
        mediumCredits: { increment: parseInt(mediumCredits) || 0 },
        highCredits: { increment: parseInt(highCredits) || 0 },
      },
      create: {
        userId,
        mediumCredits: parseInt(mediumCredits) || 0,
        highCredits: parseInt(highCredits) || 0,
        subscriptionType: 'FREE',
        dailyMediumCap: 15,
        dailyHighCap: null,
        lastReset: new Date(),
      }
    });

    // Create credit transaction record
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'BOOSTER_PURCHASE',
        mediumCreditsChange: parseInt(mediumCredits) || 0,
        highCreditsChange: parseInt(highCredits) || 0,
        reason: `${boosterName} booster purchase - $${amount}`,
      }
    });

    // Try to create booster purchase record if table exists
    try {
      await prisma.boosterPurchase.create({
        data: {
          userId,
          boosterPackId: boosterId,
          stripeSessionId: session.id,
          amount: amount,
        }
      });
    } catch (error) {
      console.log("ℹ️ BoosterPurchase table not available, skipping record");
    }

    console.log("✅ Booster purchase processed successfully");
  } catch (error) {
    console.error("❌ Failed to process booster purchase:", error);
    throw error;
  }
}

async function handleSubscriptionPurchase(session, meta) {
  console.log("📅 Processing subscription purchase");
  const { userId, planId } = meta;
  const amount = session.amount_total / 100;

  // Define plan benefits
  const planMapping = {
    'creator': { 
      mediumCredits: 250, 
      highCredits: 20, 
      dailyMediumCap: 30, 
      dailyHighCap: 6,
      subscriptionType: 'CREATOR'
    },
    'pro-creator': { 
      mediumCredits: 500, 
      highCredits: 40, 
      dailyMediumCap: 60, 
      dailyHighCap: 10,
      subscriptionType: 'CREATOR_PRO'
    },
    'pro_creator': { 
      mediumCredits: 500, 
      highCredits: 40, 
      dailyMediumCap: 60, 
      dailyHighCap: 10,
      subscriptionType: 'CREATOR_PRO'
    }
  };

  const plan = planMapping[planId];
  if (!plan) {
    console.error("❌ Invalid plan ID:", planId);
    return;
  }

  try {
    // Update user credits and subscription
    await prisma.userCredits.upsert({
      where: { userId },
      update: {
        subscriptionType: plan.subscriptionType,
        mediumCredits: plan.mediumCredits,
        highCredits: plan.highCredits,
        dailyMediumCap: plan.dailyMediumCap,
        dailyHighCap: plan.dailyHighCap,
        lastReset: new Date(),
      },
      create: {
        userId,
        subscriptionType: plan.subscriptionType,
        mediumCredits: plan.mediumCredits,
        highCredits: plan.highCredits,
        dailyMediumCap: plan.dailyMediumCap,
        dailyHighCap: plan.dailyHighCap,
        lastReset: new Date(),
      }
    });

    // Create credit transaction record
    await prisma.creditTransaction.create({
      data: {
        userId,
        type: 'MONTHLY_REFILL',
        mediumCreditsChange: plan.mediumCredits,
        highCreditsChange: plan.highCredits,
        reason: `Monthly ${plan.subscriptionType} credits reset`,
      }
    });

    console.log("✅ Subscription purchase processed successfully");
  } catch (error) {
    console.error("❌ Failed to process subscription purchase:", error);
    throw error;
  }
}

async function handleClothingPreorder(session, meta) {
  console.log("👕 Processing clothing preorder");
  const userId = session.client_reference_id;
  const clothingItemId = meta.clothingItemId;
  const qty = parseInt(meta.quantity || "1", 10);
  const size = meta.size;
  const cents = session.amount_total || 0;
  const email = session.customer_details?.email;
  const name = session.customer_details?.name || "friend";
  const address = session.customer_details?.address;

  // Validate required fields for clothing preorder
  if (!clothingItemId || !size) {
    console.log("ℹ️ Skipping clothing preorder - missing required fields");
    return;
  }

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
        size: size,
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

    console.log("✅ Clothing preorder processed successfully");
  } catch (error) {
    console.error("❌ Failed to process clothing preorder:", error);
    throw error;
  }
}

async function handleSubscriptionPayment(invoice) {
  console.log("🔄 Processing recurring subscription payment");
  // Handle recurring subscription payments
  try {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customer.id }
    });

    if (!user) {
      console.error("❌ User not found for customer:", customer.id);
      return;
    }

    // Reset monthly credits
    const userCredits = await prisma.userCredits.findUnique({
      where: { userId: user.id }
    });

    if (userCredits) {
      const planMapping = {
        'CREATOR': { mediumCredits: 250, highCredits: 20 },
        'CREATOR_PRO': { mediumCredits: 500, highCredits: 40 }
      };

      const plan = planMapping[userCredits.subscriptionType];
      if (plan) {
        await prisma.userCredits.update({
          where: { userId: user.id },
          data: {
            mediumCredits: plan.mediumCredits,
            highCredits: plan.highCredits,
            lastReset: new Date(),
          }
        });

        // Create transaction record
        await prisma.creditTransaction.create({
          data: {
            userId: user.id,
            type: 'MONTHLY_REFILL',
            mediumCreditsChange: plan.mediumCredits,
            highCreditsChange: plan.highCredits,
            reason: `Monthly ${userCredits.subscriptionType} credits reset`,
          }
        });

        console.log("✅ Monthly credits reset successfully");
      }
    }
  } catch (error) {
    console.error("❌ Failed to process subscription payment:", error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log("🔄 Processing subscription update");
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customer.id }
    });

    if (!user) {
      console.error("❌ User not found for customer:", customer.id);
      return;
    }

    // Map Stripe price IDs to plan benefits
    const priceIdMapping = {
      'price_1RX5cMRgxXa12fTw2kN2DeeF': { // $9/month - Creator Plan - Confirmed working
        mediumCredits: 250, 
        highCredits: 20, 
        dailyMediumCap: 30, 
        dailyHighCap: 6,
        subscriptionType: 'CREATOR'
      },
      'price_1RX5cjRgxXa12fTwn1CqVF2v': { // $15/month - Creator Pro Plan - Confirmed working
        mediumCredits: 500, 
        highCredits: 40, 
        dailyMediumCap: 60, 
        dailyHighCap: 10,
        subscriptionType: 'CREATOR_PRO'
      }
    };

    // Get the current price ID from the subscription
    const currentPriceId = subscription.items?.data?.[0]?.price?.id;
    console.log("🏷️ Subscription price ID:", currentPriceId);
    
    let plan = priceIdMapping[currentPriceId];
    
    // If subscription is canceled or no valid price found, downgrade to free
    if (subscription.status === 'canceled' || subscription.cancel_at_period_end || !plan) {
      plan = {
        mediumCredits: 120,
        highCredits: 5,
        dailyMediumCap: 15,
        dailyHighCap: null,
        subscriptionType: 'FREE'
      };
      console.log("⬇️ Downgrading to free plan");
    }

    // Update user credits and subscription
    await prisma.userCredits.upsert({
      where: { userId: user.id },
      update: {
        subscriptionType: plan.subscriptionType,
        mediumCredits: plan.mediumCredits,
        highCredits: plan.highCredits,
        dailyMediumCap: plan.dailyMediumCap,
        dailyHighCap: plan.dailyHighCap,
        lastReset: new Date(),
      },
      create: {
        userId: user.id,
        subscriptionType: plan.subscriptionType,
        mediumCredits: plan.mediumCredits,
        highCredits: plan.highCredits,
        dailyMediumCap: plan.dailyMediumCap,
        dailyHighCap: plan.dailyHighCap,
        lastReset: new Date(),
      }
    });

    // Create transaction record
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        type: 'MONTHLY_REFILL',
        mediumCreditsChange: plan.mediumCredits,
        highCreditsChange: plan.highCredits,
        reason: `Subscription updated to ${plan.subscriptionType}`,
      }
    });

    console.log("✅ Subscription update processed successfully");
  } catch (error) {
    console.error("❌ Failed to process subscription update:", error);
    throw error;
  }
}

async function handleSubscriptionCancelled(subscription) {
  console.log("❌ Processing subscription cancellation");
  try {
    const customer = await stripe.customers.retrieve(subscription.customer);
    const user = await prisma.user.findUnique({
      where: { stripeCustomerId: customer.id }
    });

    if (user) {
      await prisma.userCredits.update({
        where: { userId: user.id },
        data: {
          subscriptionType: 'FREE',
          dailyMediumCap: 15,
          dailyHighCap: null,
        }
      });

      console.log("✅ User downgraded to free plan");
    }
  } catch (error) {
    console.error("❌ Failed to process subscription cancellation:", error);
  }
}
