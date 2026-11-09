// src/app/api/payments/paypal/capture/route.js

import { z } from "zod";
import { capturePayPalPayment } from "@/lib/payments/capturePayPal";

const schema = z.object({
  paymentId: z.string().min(1),
});

export async function POST(request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid payment ID" },
        { status: 400 }
      );
    }

    const payment = await capturePayPalPayment(
      parsed.data.paymentId
    );

    return Response.json({
      paymentId: payment.id,
      status: payment.status,
      orderId: payment.orderId,
    });
  } catch (error) {
    console.error("PayPal capture failed:", error);

    return Response.json(
      { error: "Unable to capture PayPal payment" },
      { status: 500 }
    );
  }
}

