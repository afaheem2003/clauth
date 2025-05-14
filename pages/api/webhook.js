// pages/api/webhook.js
import { buffer } from 'micro';
import Stripe from 'stripe';
import prisma from '@/lib/prisma';
import { sendReceiptWithPDF } from '@/lib/sendReceiptWithPDF';

export const config = {
  api: {
    bodyParser: false, // Stripe needs the raw body
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-11-15',
});

function mapStripePaymentStatus(status) {
  switch (status) {
    case 'paid': return 'SUCCEEDED';
    case 'unpaid':
    case 'requires_payment_method':
    case 'no_payment_required': return 'FAILED';
    default: return 'REQUIRES_CAPTURE';
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  if (!sig) return res.status(400).send('Missing Stripe Signature');

  let event;
  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    console.log('✅ Stripe event:', event.type);
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { plushieId, quantity = '1' } = session.metadata || {};
    const userId = session.client_reference_id;
    const qty = parseInt(quantity, 10);
    const cents = session.amount_total || 0;
    const email = session.customer_details?.email;
    const name = session.customer_details?.name || 'friend';
    const address = session.customer_details?.address;

    try {
      const payment = await prisma.paymentIntent.create({
        data: {
          provider: 'stripe',
          intentId: session.payment_intent,
          clientSecret: session.payment_intent_data?.client_secret || null,
          status: mapStripePaymentStatus(session.payment_status),
          fullName: name,
          address1: address?.line1 || '',
          address2: address?.line2 || null,
          city: address?.city || '',
          state: address?.state || '',
          zip: address?.postal_code || '',
          country: address?.country || '',
        },
      });

      await prisma.preorder.create({
        data: {
          userId: userId || null,
          guestEmail: userId ? null : email,
          plushieId,
          price: cents / 100,
          quantity: qty,
          status: 'CONFIRMED',
          paymentIntentId: payment.id,
        },
      });

      await prisma.plushie.update({
        where: { id: plushieId },
        data: { pledged: { increment: qty } },
      });

      const plushie = await prisma.plushie.findUnique({
        where: { id: plushieId },
        select: { name: true },
      });

      if (email && process.env.EMAIL_ENABLED === 'true') {
        await sendReceiptWithPDF({
          to: email,
          name,
          email,
          plushie: plushie?.name || 'Plushie',
          qty,
          total: cents / 100,
        });
      }

      console.log('✅ Successfully processed preorder for plushie:', plushieId);
    } catch (err) {
      console.error('❌ Error processing preorder:', err);
    }
  }

  res.status(200).json({ received: true });
}
