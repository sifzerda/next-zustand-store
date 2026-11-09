// src/components/PaymentMethodSelector.jsx

"use client";

const methods = [
  { id: "STRIPE", label: "Credit / Debit Card" },
  { id: "PAYPAL", label: "PayPal" },
  { id: "SQUARE", label: "Square" },
  { id: "BANK_TRANSFER", label: "Bank Transfer (Demo)" },
];

export default function PaymentMethodSelector({
  value,
  onChange,
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">
        Payment Method
      </h2>

      {methods.map((method) => (
        <label
          key={method.id}
          className="flex cursor-pointer items-center gap-3 rounded-lg border p-4"
        >
          <input
            type="radio"
            name="paymentMethod"
            value={method.id}
            checked={value === method.id}
            onChange={() => onChange(method.id)}
          />

          <span>{method.label}</span>
        </label>
      ))}
    </div>
  );
}
