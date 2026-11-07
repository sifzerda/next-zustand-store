// /src/app/cart/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/useCartStore";
import CartView from "@/components/CartView";

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);

  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);

  useEffect(() => {
    useCartStore.persist.rehydrate().then(() => {
      setHydrated(true);
    });
  }, []);

  if (!hydrated) return <p className="p-8">Loading cart...</p>;

  return (
    <CartView
      items={items}
      removeItem={removeItem}
      setQuantity={setQuantity}
    />
  );
}
