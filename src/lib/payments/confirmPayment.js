// src/lib/payments/confirmPayment.js

import { prisma } from "@/lib/prisma";

export async function confirmPayment(paymentId, success) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });

    if (!payment) throw new Error("Payment not found");

    if (payment.status === "SUCCEEDED") {
      return payment;
    }

    if (!["PENDING", "PROCESSING"].includes(payment.status)) {
      throw new Error("Payment is already finalized");
    }

    if (payment.order.status !== "PENDING") {
      throw new Error("Order is no longer payable");
    }

    const updated = await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: success ? "SUCCEEDED" : "FAILED",
      },
    });

    if (success) {
      await tx.order.update({
        where: { id: payment.orderId },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }

    return updated;
  });
}
