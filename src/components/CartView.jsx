// src/components/CartView.jsx

"use client";

import { useState } from "react";

export default function CartView({
  items,
  removeItem,
  setQuantity,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function checkout() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map(({ id, quantity }) => ({
            id,
            quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.url) {
        throw new Error(data.error || "Checkout failed");
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-3xl font-bold">
        Your Cart
      </h1>

      {items.length === 0 && <p>Your cart is empty.</p>}

      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center justify-between gap-4 border-b py-4"
        >
          <div>
            <h2 className="font-semibold">{item.name}</h2>
            <p>${(item.price / 100).toFixed(2)}</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="20"
              value={item.quantity}
              onChange={(event) => {
                const quantity = Number(event.target.value);
                if (Number.isInteger(quantity)) {
                  setQuantity(item.id, Math.min(20, Math.max(1, quantity)));
                }
              }}
              className="w-16 rounded border p-2"
            />

            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <>
          <p className="my-6 text-xl font-bold">
            Total: ${(total / 100).toFixed(2)} AUD
          </p>

          {error && (
            <p role="alert" className="mb-4 text-red-500">
              {error}
            </p>
          )}

          <button
            disabled={loading}
            onClick={checkout}
            className="rounded bg-blue-600 px-6 py-3 text-white disabled:opacity-50"
          >
            {loading ? "Redirecting..." : "Checkout"}
          </button>
        </>
      )}
    </section>
  );
}
