// src/app/paypal/return/PayPalReturn.jsx

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

export default function PayPalReturn({ paymentId, token }) {
  const started = useRef(false);
  const [status, setStatus] = useState("PROCESSING");
  const [error, setError] = useState("");

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    async function capture() {
      try {
        const response = await fetch(
          "/api/payments/paypal/capture",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ paymentId, token }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Capture failed");
        }

        setStatus(data.status);
      } catch (err) {
        setError(err.message);
      }
    }

    if (paymentId && token) {
      capture();
    } else {
      setError("Missing PayPal payment information");
    }
  }, [paymentId, token]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">
        PayPal Payment
      </h1>

      {status === "PROCESSING" && !error && (
        <p className="mt-4">
          Confirming your PayPal payment...
        </p>
      )}

      {status === "SUCCEEDED" && (
        <p className="mt-4 text-green-600">
          Payment successful! Your order is confirmed.
        </p>
      )}

      {error && (
        <p className="mt-4 text-red-500">
          {error}
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
