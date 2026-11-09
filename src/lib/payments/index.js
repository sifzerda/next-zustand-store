// src/lib/payments/index.js

import { stripeGateway } from "./stripe";
import { bankTransferGateway } from "./bankTransfer";

const unavailable = (name) => ({
  async createPayment() {
    throw new Error(`${name} integration is not configured`);
  },

  async getPaymentStatus() {
    throw new Error(`${name} integration is not configured`);
  },
});

const gateways = {
  STRIPE: stripeGateway,
  PAYPAL: unavailable("PayPal"),
  SQUARE: unavailable("Square"),
  BANK_TRANSFER: bankTransferGateway,
};

export function getPaymentGateway(provider) {
  const gateway = gateways[provider];

  if (!gateway) {
    throw new Error("Unsupported payment provider");
  }

  return gateway;
}
