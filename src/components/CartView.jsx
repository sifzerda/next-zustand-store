// src/components/CartView.jsx

"use client";

import { useRef, useState } from "react";
import PaymentMethodSelector from "./PaymentMethodSelector";

export default function CartView({
  items,
  removeItem,
  setQuantity,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState("BANK_TRANSFER");
  const [payment, setPayment] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const checkoutKey = useRef(null);

  // Calculate the displayed cart total
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Create an order and initiate payment
  async function checkout() {
    setLoading(true);
    setError("");
    setPayment(null);

    if (!checkoutKey.current) {
      checkoutKey.current = crypto.randomUUID();
    }

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idempotencyKey: checkoutKey.current,
          provider,
          items: items.map(({ id, quantity }) => ({
            id,
            quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      // Redirect to an external payment gateway
      if (data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }

      // Bank transfer remains pending
      setPayment(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Simulate receiving a bank transfer (development only)
  async function simulatePayment() {
    if (!payment?.paymentId) return;

    setConfirming(true);
    setError("");

    try {
      const response = await fetch(
        `/api/payments/${payment.paymentId}/simulate`,
        { method: "POST" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment simulation failed");
      }

      setPayment((previous) => ({
        ...previous,
        status: data.status,
      }));
    } catch (err) {
      setError(err.message || "Payment confirmation failed");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Your Cart
      </h1>

      {/* Cart items */}
      {items.length === 0 && !payment && (
        <p>Your cart is empty.</p>
      )}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 border-b py-4"
        >
          <div>
            <h2 className="font-semibold">
              {item.name}
            </h2>

            <p>
              ${(item.price / 100).toFixed(2)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="20"
              value={item.quantity}
              disabled={loading || !!payment}
              onChange={(event) => {
                const quantity = Number(event.target.value);

                if (Number.isInteger(quantity)) {
                  setQuantity(
                    item.id,
                    Math.min(20, Math.max(1, quantity))
                  );
                }
              }}
              className="w-16 rounded border p-2"
            />

            <button
              onClick={() => removeItem(item.id)}
              disabled={loading || !!payment}
              className="text-red-500 disabled:opacity-50"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Cart summary */}
      {items.length > 0 && (
        <div className="mt-6 space-y-6">
          <p className="text-xl font-bold">
            Total: ${(total / 100).toFixed(2)} AUD
          </p>

          {/* Payment method selector */}
          {!payment && (
            <>
              <PaymentMethodSelector
                value={provider}
                onChange={setProvider}
              />

              {/* Checkout button */}
              <button
                disabled={loading}
                onClick={checkout}
                className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white disabled:opacity-50"
              >
                {loading ? "Processing..." : "Proceed to Payment"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Error messages */}
      {error && (
        <p role="alert"
          className="mt-4 rounded-lg border border-red-500 p-4 text-red-500">
          {error}
        </p>
      )}

      {/* Bank transfer pending */}
      {payment?.status === "PENDING" &&
        payment.provider === "BANK_TRANSFER" && (
          <div className="mt-6 rounded-lg border p-6">
            <h2 className="text-xl font-semibold">
              Awaiting Bank Transfer
            </h2>

            <p className="mt-2 text-gray-500">
              Your order has been created and is awaiting
              payment confirmation.
            </p>

            <p className="mt-3 text-sm">
              Order ID: {payment.orderId}
            </p>

            {process.env.NODE_ENV === "development" && (
              <button
                onClick={simulatePayment}
                disabled={confirming}
                className="mt-5 rounded-lg bg-green-600 px-5 py-3 text-white disabled:opacity-50"
              >
                {confirming
                  ? "Confirming..."
                  : "Simulate Payment Received"}
              </button>
            )}
          </div>
        )}

      {/* Successful payment */}
      {payment?.status === "SUCCEEDED" && (
        <div className="mt-6 rounded-lg border border-green-500 p-6">
          <h2 className="text-xl font-bold text-green-600">
            Payment Successful!
          </h2>

          <p className="mt-2">
            Your order has been confirmed.
          </p>

          <p className="mt-2 text-sm">
            Order ID: {payment.orderId}
          </p>
        </div>
      )}
    </section>
  );
}
