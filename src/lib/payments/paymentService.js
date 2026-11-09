// src/lib/payments/paymentService.js

import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "./index";

export async function createPayment({ orderId, provider }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") {
    throw new Error("Order is not payable");
  }

  const gateway = getPaymentGateway(provider);

  const payment = await prisma.payment.create({
    data: {
      orderId,
      provider,
      amount: order.total,
      currency: order.currency,
    },
  });

  try {
    const result = await gateway.createPayment({
      order,
      payment,
    });

return await prisma.payment.update({
  where: { id: payment.id },
  data: {
    providerPaymentId: result.providerPaymentId ?? null,
    providerOrderId: result.providerOrderId ?? null,
    providerLinkId: result.providerLinkId ?? null,
    checkoutUrl: result.checkoutUrl ?? null,
    status: result.status,
  },
});
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    throw error;
  }
}
