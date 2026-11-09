// src/app/api/webhooks/stripe/route.js

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/payments/stripe";

export const runtime = "nodejs";

export async function POST(request) {
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return Response.json(
      { error: "Missing Stripe signature" },
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
  } catch (error) {
    console.error("Invalid Stripe webhook:", error.message);

    return Response.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  const session = event.data.object;

  const successEvents = [
    "checkout.session.completed",
    "checkout.session.async_payment_succeeded",
  ];

  const failureEvents = [
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ];

  if (
    !successEvents.includes(event.type) &&
    !failureEvents.includes(event.type)
  ) {
    return Response.json({ received: true });
  }

  const paymentId = session.metadata?.paymentId;
  const orderId = session.metadata?.orderId;

  if (!paymentId || !orderId) {
    return Response.json(
      { error: "Missing payment metadata" },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { order: true },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Verify that the event belongs to this payment.
      if (
        payment.provider !== "STRIPE" ||
        payment.orderId !== orderId ||
        payment.providerPaymentId !== session.id ||
        payment.amount !== session.amount_total ||
        payment.currency !== session.currency
      ) {
        throw new Error("Payment verification failed");
      }

      const paid =
        successEvents.includes(event.type) &&
        session.payment_status === "paid";

      if (paid) {
        // Avoid applying duplicate success notifications.
        if (payment.status === "SUCCEEDED") return;

        if (
          !["PENDING", "PROCESSING"].includes(payment.status) ||
          payment.order.status !== "PENDING"
        ) {
          return;
        }

        await tx.payment.update({
          where: { id: paymentId },
          data: { status: "SUCCEEDED" },
        });

        await tx.order.update({
          where: { id: orderId },
          data: {
            status: "PAID",
            paidAt: new Date(),
          },
        });

        return;
      }

      if (failureEvents.includes(event.type)) {
        await tx.payment.updateMany({
          where: {
            id: paymentId,
            status: { in: ["PENDING", "PROCESSING"] },
          },
          data: {
            status:
              event.type === "checkout.session.expired"
                ? "CANCELLED"
                : "FAILED",
          },
        });
      }
    });

    return Response.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error);

    // A non-2xx response allows Stripe to retry.
    return Response.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
