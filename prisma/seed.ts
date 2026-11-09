// prisma/seed.mjs

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL!,
  }),
});

const products = [
  {
    name: "Wireless Headphones",
    description: "Premium over-ear headphones with comfortable cushioning and wireless connectivity.",
    price: 12900,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=900",
  },
  {
    name: "Classic Sneakers",
    description: "Versatile everyday sneakers with a comfortable sole and timeless design.",
    price: 8900,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900",
  },
  {
    name: "Digital Camera",
    description: "A compact digital camera for capturing everyday moments and creative photography.",
    price: 49900,
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=900",
  },
  {
    name: "Minimalist Watch",
    description: "A modern wristwatch with a clean dial and understated styling.",
    price: 15900,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900",
  },
  {
    name: "Everyday Backpack",
    description: "A practical backpack with spacious compartments for daily essentials.",
    price: 7900,
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900",
  },
  {
    name: "Sunglasses",
    description: "Lightweight sunglasses with a classic frame and UV-protective lenses.",
    price: 4900,
    imageUrl: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=900",
  },
];

async function main() {
  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { name: product.name },
    });

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...product, active: true },
      });
    } else {
      await prisma.product.create({
        data: product,
      });
    }
  }

  console.log("Demo products seeded successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
