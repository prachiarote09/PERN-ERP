require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("../generated/prisma/client.cts");
const { PrismaPg } = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const passwordHash = await bcrypt.hash("Admin@123", 10);

  const admin = await prisma.user.upsert({
    where: {
      email: "admin@pernerp.com",
    },
    update: {
      role: "ADMIN",
      passwordHash,
    },
    create: {
      name: "System Admin",
      email: "admin@pernerp.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin created successfully:");
  console.log({
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
  const products = [
  {
    code: "P001",
    name: "Laptop",
    category: "Electronics",
    unit: "Piece",
    basePrice: 50000,
    physicalQty: 80,
  },
  {
    code: "P002",
    name: "Wireless Mouse",
    category: "Electronics",
    unit: "Piece",
    basePrice: 800,
    physicalQty: 150,
  },
  {
    code: "P003",
    name: "Keyboard",
    category: "Electronics",
    unit: "Piece",
    basePrice: 1200,
    physicalQty: 100,
  },
  {
    code: "P004",
    name: "Monitor",
    category: "Electronics",
    unit: "Piece",
    basePrice: 12000,
    physicalQty: 50,
  },
  {
    code: "P005",
    name: "Printer",
    category: "Office Equipment",
    unit: "Piece",
    basePrice: 15000,
    physicalQty: 40,
  },
  {
    code: "P006",
    name: "USB Cable",
    category: "Accessories",
    unit: "Piece",
    basePrice: 300,
    physicalQty: 200,
  },
];

for (const productData of products) {
  const { physicalQty, ...productFields } = productData;

  const product = await prisma.product.upsert({
    where: {
      code: productFields.code,
    },
    update: productFields,
    create: productFields,
  });

  await prisma.inventory.upsert({
    where: {
      productId: product.id,
    },
    update: {
      physicalQty,
    },
    create: {
      productId: product.id,
      physicalQty,
      reservedQty: 0,
    },
  });
}

console.log("Products and inventory seeded successfully.");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });