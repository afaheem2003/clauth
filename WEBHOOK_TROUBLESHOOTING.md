# Stripe Webhook Troubleshooting Guide

## Issue: Subscription Plan Changes Not Working

### Problem

When users try to change their subscription plan, the Stripe webhook isn't getting hit, so the subscription changes aren't being processed in your application.

### Root Causes Identified

1. **Missing Webhook Event Handler**

   - Your webhook was only handling `checkout.session.completed`, `invoice.payment_succeeded`, and `customer.subscription.deleted`
   - **Missing**: `customer.subscription.updated` - the key event for subscription changes

2. **No Subscription Update API**
   - You only had APIs to create new subscriptions, not update existing ones
   - This meant every "plan change" was trying to create a new subscription instead of modifying the existing one

### Solutions Implemented

#### 1. Added Missing Webhook Handler ✅

Updated `/app/api/webhooks/stripe/route.js` to handle `customer.subscription.updated` events:

```javascript
case 'customer.subscription.updated':
  await handleSubscriptionUpdated(event.data.object);
  break;
```

#### 2. Created Subscription Update API ✅

New endpoint: `/app/api/subscription/update/route.js`

- Handles upgrades, downgrades, and cancellations
- Modifies existing subscriptions instead of creating new ones
- Properly handles prorations for plan changes

#### 3. Updated Frontend ✅

Modified `/app/credits/upgrade/page.js` to use the new update endpoint instead of always creating new subscriptions.

### Testing Your Fix

#### Method 1: Using Stripe CLI (Recommended)

1. **Start your local server:**

   ```bash
   npm run dev
   ```

2. **Forward webhooks to your local server:**

   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Test subscription changes:**
   - Go to your upgrade page: `http://localhost:3000/credits/upgrade`
   - Try changing plans
   - Watch the webhook events in your terminal

#### Method 2: Using the Test Script

```bash
node scripts/test-webhooks.js
```

Choose option 1 to start webhook forwarding.

#### Method 3: Direct Testing

Check recent webhook events:

```bash
stripe events list --limit 10
```

### Debugging Steps

1. **Check Webhook Endpoint Status:**

   ```bash
   curl -X POST http://localhost:3000/api/webhooks/stripe \
     -H "Content-Type: application/json" \
     -H "stripe-signature: test" \
     -d '{"type":"customer.subscription.updated"}'
   ```

2. **Monitor Webhook Logs:**

   - Check `webhook-debug.log` file
   - Check your server console output
   - Look for `🔄 Handling customer.subscription.updated` messages

3. **Verify Stripe Dashboard:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Check if your webhook endpoint is properly configured
   - Verify it's listening for `customer.subscription.updated` events

### Required Stripe Webhook Events

Make sure your Stripe webhook is configured to listen for these events:

- ✅ `checkout.session.completed` (new subscriptions)
- ✅ `customer.subscription.updated` (plan changes) **← This was missing!**
- ✅ `invoice.payment_succeeded` (recurring payments)
- ✅ `customer.subscription.deleted` (cancellations)

### Environment Variables to Check

Ensure these are set in your `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Common Issues & Solutions

**Issue**: Webhook signature verification fails
**Solution**: Make sure `STRIPE_WEBHOOK_SECRET` matches your Stripe endpoint secret

**Issue**: User not found for customer
**Solution**: Ensure `stripeCustomerId` is properly stored in your user records

**Issue**: Plan mapping errors
**Solution**: Verify your Stripe price IDs match the ones in your code:

- Creator Plan: `price_1RX5cMRgxXa12fTw2kN2DeeF`
- Creator Pro Plan: `price_1RX5cjRgxXa12fTwn1CqVF2v`

### Testing Subscription Changes

1. **Create a test subscription** (if you don't have one)
2. **Try upgrading** from Creator to Creator Pro
3. **Try downgrading** from Creator Pro to Creator
4. **Try canceling** (downgrade to Starter)

### Expected Webhook Flow

1. User clicks "Upgrade to Creator Pro"
2. Your app calls `/api/subscription/update`
3. Stripe modifies the existing subscription
4. Stripe sends `customer.subscription.updated` webhook
5. Your webhook handler processes the change
6. User's credits/plan are updated in your database

### Quick Test Command

Run this to test your webhook endpoint:

```bash
# Test the endpoint directly
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=1234567890,v1=test_signature" \
  -d '{
    "type": "customer.subscription.updated",
    "data": {
      "object": {
        "id": "sub_test",
        "customer": "cus_test",
        "status": "active",
        "items": {
          "data": [{
            "price": {"id": "price_1RX5cMRgxXa12fTw2kN2DeeF"}
          }]
        }
      }
    }
  }'
```

### Next Steps

1. **Test the fix** using one of the methods above
2. **Monitor your logs** to see webhook events being processed
3. **Verify subscription changes** are reflected in your database
4. **Deploy to production** once local testing passes

The main issue was that your webhook wasn't listening for subscription update events. Now that we've added the handler, your subscription changes should work properly! 🎉
