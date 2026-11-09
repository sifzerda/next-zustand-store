// src/lib/payments/square.js

import { squareRequest } from "./squareClient";

export const squareGateway = {
  async createPayment({ order, payment }) {
    const result = await squareRequest(
      "/v2/online-checkout/payment-links",
      {
        method: "POST",
        body: {
          idempotency_key: payment.id,

          quick_pay: {
            name: `Demo Store Order ${order.id}`,
            price_money: {
              amount: payment.amount,
              currency: payment.currency.toUpperCase(),
            },
            location_id: process.env.SQUARE_LOCATION_ID,
          },

          checkout_options: {
            redirect_url:
              `${process.env.NEXT_PUBLIC_APP_URL}/square/return?paymentId=${payment.id}`,
          },
        },
      }
    );

    const link = result.payment_link;

    if (!link?.id || !link?.url || !link?.order_id) {
      throw new Error("Square payment link is incomplete");
    }

    return {
      providerPaymentId: null,
      providerOrderId: link.order_id,
      providerLinkId: link.id,
      checkoutUrl: link.url,
      status: "PROCESSING",
    };
  },

  async getPaymentStatus({ payment }) {
    if (!payment.providerOrderId) {
      return "PENDING";
    }

    const result = await squareRequest(
      `/v2/orders/${payment.providerOrderId}`
    );

    return result.order?.state ?? "UNKNOWN";
  },
};

