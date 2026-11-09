// src/lib/payments/stripe.js

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeGateway = {
  async createPayment({ order, payment }) {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",

        client_reference_id: order.id,

        metadata: {
          orderId: order.id,
          paymentId: payment.id,
        },

        line_items: order.items.map((item) => ({
          price_data: {
            currency: order.currency,
            unit_amount: item.unitPrice,
            product_data: {
              name: item.product.name,
            },
          },
          quantity: item.quantity,
        })),

        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      },
      {
        idempotencyKey: `payment-${payment.id}`,
      }
    );

    return {
      providerPaymentId: session.id,
      checkoutUrl: session.url,
      status: "PROCESSING",
    };
  },

  async getPaymentStatus({ payment }) {
    const session = await stripe.checkout.sessions.retrieve(payment.providerPaymentId);

    return session.payment_status;
  },
};

export { stripe };
