// src/app/api/webhooks/stripe/route.js


import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Missing signature" },
      { status: 400 }
    );
  }

  let event;

  try {
    const body = await request.text();

    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return Response.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const session = event.data.object;

  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    if (session.payment_status === "paid") {
      await prisma.order.updateMany({
        where: {
          id: session.metadata?.orderId,
          stripeSessionId: session.id,
          status: "PENDING",
          total: session.amount_total,
          currency: session.currency,
        },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
    }
  }

  if (
    event.type === "checkout.session.expired" ||
    event.type === "checkout.session.async_payment_failed"
  ) {
    await prisma.order.updateMany({
      where: {
        id: session.metadata?.orderId,
        stripeSessionId: session.id,
        status: "PENDING",
      },
      data: {
        status:
          event.type === "checkout.session.expired"
            ? "CANCELLED"
            : "FAILED",
      },
    });
  }

  return Response.json({ received: true });
}
