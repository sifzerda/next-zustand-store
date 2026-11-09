// src/lib/payments/paypalClient.js

const API_BASE = process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com";

export async function getPayPalAccessToken() {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("PayPal authentication failed");
  }

  const data = await response.json();
  return data.access_token;
}

export async function paypalRequest(path, options = {}) {
  const token = await getPayPalAccessToken();

  const response = await fetch(`${API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.requestId
        ? { "PayPal-Request-Id": options.requestId }
        : {}),
    },
    body: options.body
      ? JSON.stringify(options.body)
      : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("PayPal API error:", response.status, error);
    throw new Error("PayPal request failed");
  }

  if (response.status === 204) return null;

  return response.json();
}
