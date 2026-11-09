// src/lib/payments/paypal/return/page.jsx

import PayPalReturn from "./PayPalReturn";

export default async function Page({ searchParams }) {
  const { paymentId, token } = await searchParams;

  return (
    <PayPalReturn
      paymentId={paymentId}
      token={token}
    />
  );
}
