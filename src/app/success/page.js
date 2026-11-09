// src/app/success/page.jsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuccessPage({ searchParams }) {
  const { session_id } = await searchParams;

  const payment =
    typeof session_id === "string"
      ? await prisma.payment.findFirst({
          where: {
            provider: "STRIPE",
            providerPaymentId: session_id,
          },
          include: {
            order: true,
          },
        })
      : null;

  const paid =
    payment?.status === "SUCCEEDED" &&
    payment.order.status === "PAID";

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        Payment Status
      </h1>

      {paid ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-green-600">
            Payment Successful!
          </h2>

          <p className="mt-2">
            Your order has been confirmed.
          </p>

          <p className="mt-3">
            Total: ${(payment.amount / 100).toFixed(2)} AUD
          </p>

          <p className="mt-2 text-sm">
            Order ID: {payment.orderId}
          </p>
        </div>
      ) : (
        <p className="mt-6">
          Payment has not yet been confirmed.
          Please check again shortly.
        </p>
      )}

      <Link
        href="/"
        className="mt-6 inline-block text-blue-500"
      >
        Return to Store
      </Link>
    </main>
  );
}
