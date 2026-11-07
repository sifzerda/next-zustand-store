// src/components/ProductCard.jsx

"use client";

import { useCartStore } from "@/store/useCartStore";

export default function ProductCard({ product }) {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <article className="rounded-xl border p-5">
      <h2 className="text-xl font-semibold">
        {product.name}
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        {product.description}
      </p>

      <p className="my-4 font-bold">
        ${(product.price / 100).toFixed(2)}
      </p>

      <button
        onClick={() => addItem(product)}
        className="rounded bg-blue-600 px-4 py-2 text-white"
      >
        Add to cart
      </button>
    </article>
  );
}
