// src/app/square/return/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SquareReturnPage() {
  const params = useSearchParams();
  const paymentId = params.get("paymentId");

  const [status, setStatus] = useState("PROCESSING");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paymentId) {
      setError("Missing payment reference");
      return;
    }

    async function checkPayment() {
      try {
        const response = await fetch(
          `/api/payments/${paymentId}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error("Unable to retrieve payment");
        }

        setStatus(data.status);
      } catch (err) {
        setError(err.message);
      }
    }

    checkPayment();
  }, [paymentId]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        Square Payment
      </h1>

      {status === "SUCCEEDED" ? (
        <p className="mt-4 text-green-600">
          Payment confirmed. Thank you for your order!
        </p>
      ) : (
        <p className="mt-4">
          Payment is awaiting confirmation.
          Please refresh to check its status.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-red-500">
          {error}
        </p>
      )}

      <Link href="/" className="mt-6 inline-block text-blue-500">
        Return to Store
      </Link>
    </main>
  );
}
