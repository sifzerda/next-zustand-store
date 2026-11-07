// src/app/api/checkout/route.js

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/checkout";

export async function POST(request) {
  let order;

  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid cart" },
        { status: 400 }
      );
    }

    const cartItems = parsed.data.items;
    const ids = cartItems.map((item) => item.id);

    const products = await prisma.product.findMany({
      where: {
        id: { in: ids },
        active: true,
      },
    });

    if (products.length !== ids.length) {
      return Response.json(
        { error: "Some products are unavailable" },
        { status: 400 }
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id, product])
    );

    const orderItems = cartItems.map((item) => {
      const product = productMap.get(item.id);

      return {
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });

    const total = orderItems.reduce(
      (sum, item) =>
        sum + item.unitPrice * item.quantity,
      0
    );

    order = await prisma.order.create({
      data: {
        total,
        items: {
          create: orderItems,
        },
      },
    });

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        client_reference_id: order.id,
        metadata: { orderId: order.id },

        line_items: cartItems.map((item) => {
          const product = productMap.get(item.id);

          return {
            price_data: {
              currency: "aud",
              unit_amount: product.price,
              product_data: {
                name: product.name,
              },
            },
            quantity: item.quantity,
          };
        }),

        success_url:
          `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      },
      {
        idempotencyKey: `checkout-${order.id}`,
      }
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Checkout failed:", error);

    return Response.json(
      { error: "Unable to start checkout" },
      { status: 500 }
    );
  }
}
