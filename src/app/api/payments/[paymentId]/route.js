// src/app/api/payments/[paymentId]/route.js

import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { paymentId } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: {
      id: true,
      provider: true,
      status: true,
      orderId: true,
    },
  });

  if (!payment) {
    return Response.json(
      { error: "Payment not found" },
      { status: 404 }
    );
  }

  return Response.json({
    paymentId: payment.id,
    provider: payment.provider,
    status: payment.status,
  });
}
