// src/lib/payments/paypal.js

import { paypalRequest } from "./paypalClient";

export const paypalGateway = {
  async createPayment({ order, payment }) {
    const amount = (payment.amount / 100).toFixed(2);

    const result = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      requestId: payment.id,
      body: {
        intent: "CAPTURE",

        purchase_units: [
          {
            reference_id: order.id,
            custom_id: payment.id,
            amount: {
              currency_code: order.currency.toUpperCase(),
              value: amount,
            },
          },
        ],

        payment_source: {
          paypal: {
            experience_context: {
              return_url:
                `${process.env.NEXT_PUBLIC_APP_URL}/paypal/return?paymentId=${payment.id}`,
              cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
              user_action: "PAY_NOW",
            },
          },
        },
      },
    });

    const approval = result.links?.find((link) => link.rel === "payer-action" || link.rel === "approve");

    if (!approval?.href) {
      throw new Error("PayPal approval URL missing");
    }

    return {
      providerPaymentId: result.id,
      checkoutUrl: approval.href,
      status: "PROCESSING",
    };
  },

  async getPaymentStatus({ payment }) {
    const result = await paypalRequest(`/v2/checkout/orders/${payment.providerPaymentId}`);

    return result.status;
  },
};
