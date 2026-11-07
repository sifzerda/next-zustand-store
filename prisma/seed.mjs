// prisma/seed.mjs

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const products = [
  {
    name: "Wireless Headphones",
    description: "Bluetooth over-ear headphones",
    price: 7999,
    imageUrl: "/products/headphones.jpg",
  },
  {
    name: "Mechanical Keyboard",
    description: "Compact mechanical keyboard",
    price: 12999,
    imageUrl: "/products/keyboard.jpg",
  },
  {
    name: "Gaming Mouse",
    description: "High-precision optical mouse",
    price: 4999,
    imageUrl: "/products/mouse.jpg",
  },
  {
    name: "USB-C Hub",
    description: "Multi-port USB-C adapter",
    price: 3999,
    imageUrl: "/products/hub.jpg",
  },
];

async function main() {
  const existing = await prisma.product.count();

  if (existing === 0) {
    await prisma.product.createMany({
      data: products,
    });
  }

  console.log("Products ready");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
