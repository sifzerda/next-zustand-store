// src/app/success/page.jsx

import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function SuccessPage({ searchParams }) {
  const { session_id } = await searchParams;

  const order =
    typeof session_id === "string"
      ? await prisma.order.findUnique({
          where: { stripeSessionId: session_id },
        })
      : null;

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        Order Status
      </h1>

      {order?.status === "PAID" ? (
        <p className="mt-4">
          Payment confirmed! Thank you for your order.
        </p>
      ) : (
        <p className="mt-4">
          Payment is not yet confirmed. If you have paid,
          your order may still be processing.
        </p>
      )}

      <Link
        href="/"
        className="mt-6 inline-block text-blue-500"
      >
        Return to store
      </Link>
    </main>
  );
}
