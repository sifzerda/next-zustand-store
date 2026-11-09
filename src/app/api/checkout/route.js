// src/app/api/checkout/route.js

import { z } from "zod";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { createPayment } from "@/lib/payments/paymentService";

export const runtime = "nodejs";

const checkoutSchema = z
  .object({
    idempotencyKey: z.string().uuid(),

    provider: z.enum([
      "STRIPE",
      "PAYPAL",
      "SQUARE",
      "BANK_TRANSFER",
    ]),

    items: z
      .array(
        z.object({
          id: z.string().min(1),
          quantity: z.number().int().min(1).max(20),
        })
      )
      .min(1)
      .max(50),
  })
  .refine(
    ({ items }) =>
      new Set(items.map((item) => item.id)).size ===
      items.length,
    {
      message: "Duplicate products are not allowed",
    }
  );

function createCheckoutHash(provider, items) {
  const normalizedItems = [...items].sort((a, b) =>
    a.id.localeCompare(b.id)
  );

  return createHash("sha256")
    .update(
      JSON.stringify({
        provider,
        items: normalizedItems,
      })
    )
    .digest("hex");
}

function paymentResponse(order, payment) {
  return {
    orderId: order.id,
    paymentId: payment.id,
    provider: payment.provider,
    status: payment.status,
    checkoutUrl: payment.checkoutUrl,
  };
}

async function getExistingCheckout(idempotencyKey) {
  return prisma.order.findUnique({
    where: { idempotencyKey },
    include: {
      payments: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid checkout request",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const {
      idempotencyKey,
      items,
      provider,
    } = parsed.data;

    const checkoutHash = createCheckoutHash(
      provider,
      items
    );

    // 1. Check for an existing checkout attempt
    const existingOrder = await getExistingCheckout(
      idempotencyKey
    );

    if (existingOrder) {
      if (existingOrder.checkoutHash !== checkoutHash) {
        return Response.json(
          {
            error:
              "This idempotency key belongs to a different checkout",
          },
          { status: 409 }
        );
      }

      const payment = existingOrder.payments.find(
        (p) => p.provider === provider
      );

      if (!payment || !payment.checkoutUrl && provider !== "BANK_TRANSFER") {
        return Response.json(
          {
            error: "Checkout is still being initialized",
          },
          {
            status: 409,
            headers: { "Retry-After": "2" },
          }
        );
      }

      return Response.json(
        paymentResponse(existingOrder, payment)
      );
    }

    // 2. Load authoritative product prices
    const products = await prisma.product.findMany({
      where: {
        id: { in: items.map((item) => item.id) },
        active: true,
      },
    });

    if (products.length !== items.length) {
      return Response.json(
        {
          error: "One or more products are unavailable",
        },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [
        product.id,
        product,
      ])
    );

    // 3. Build order items
    const orderItems = items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: productMap.get(item.id).price,
    }));

    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.unitPrice * item.quantity,
      0
    );

    // 4. Atomically claim the idempotency key
    let order;

    try {
      order = await prisma.order.create({
        data: {
          idempotencyKey,
          checkoutHash,
          total,
          currency: "aud",
          items: {
            create: orderItems,
          },
        },
      });
    } catch (error) {
      if (error.code === "P2002") {
        const existing = await getExistingCheckout(
          idempotencyKey
        );

        if (!existing) {
          return Response.json(
            { error: "Checkout conflict" },
            { status: 409 }
          );
        }

        if (existing.checkoutHash !== checkoutHash) {
          return Response.json(
            {
              error:
                "This idempotency key belongs to a different checkout",
            },
            { status: 409 }
          );
        }

        const payment = existing.payments.find(
          (p) => p.provider === provider
        );

        if (!payment) {
          return Response.json(
            { error: "Checkout is being initialized" },
            {
              status: 409,
              headers: { "Retry-After": "2" },
            }
          );
        }

        if (
          provider !== "BANK_TRANSFER" &&
          !payment.checkoutUrl
        ) {
          return Response.json(
            { error: "Checkout is being initialized" },
            {
              status: 409,
              headers: { "Retry-After": "2" },
            }
          );
        }

        return Response.json(
          paymentResponse(existing, payment)
        );
      }

      throw error;
    }

    // 5. Initialize payment
    const payment = await createPayment({
      orderId: order.id,
      provider,
    });

    // 6. Return checkout details
    return Response.json(
      paymentResponse(order, payment)
    );
  } catch (error) {
    console.error("Checkout error:", error);

    return Response.json(
      {
        error: "Checkout could not be created",
      },
      { status: 500 }
    );
  }
}
