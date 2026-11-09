// src/lib/payments/squareClient.js

const BASE_URL = process.env.SQUARE_API_BASE || "https://connect.squareupsandbox.com";

export async function squareRequest(
  path,
  { method = "GET", body } = {}
) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "Square-Version": "2026-01-22",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Square API error:", data.errors);
    throw new Error("Square request failed");
  }

  return data;
}
