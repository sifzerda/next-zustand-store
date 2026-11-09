// src/lib/payments/bankTransfer.js

export const bankTransferGateway = {
  async createPayment({ payment }) {
    return {
      providerPaymentId: `BANK-${payment.id}`,
      checkoutUrl: null,
      status: "PENDING",
    };
  },

  async getPaymentStatus({ payment }) {
    return payment.status;
  },
};

