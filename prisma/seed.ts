import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // ── Clean existing data ──────────────────────────────────────────
  await prisma.quotationItem.deleteMany()
  await prisma.quotation.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()

  // ── Users ────────────────────────────────────────────────────────
  const adminPassword = await bcrypt.hash("admin@123", 12)
  const buyerPassword = await bcrypt.hash("buyer@123", 12)

  const admin = await prisma.user.create({
    data: {
      email: "admin@aasamedchem.com",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
      company: "AasaMedChem",
      phone: "+91-9800000001",
    },
  })

  const buyer = await prisma.user.create({
    data: {
      email: "buyer@pharmaco.com",
      name: "Rahul Mehta",
      passwordHash: buyerPassword,
      role: "BUYER",
      company: "PharmaCo India Pvt. Ltd.",
      phone: "+91-9800000002",
    },
  })

  console.log("✅ Users created:", admin.email, buyer.email)

  // ── Products ─────────────────────────────────────────────────────
  // pricePerBase is INR per single base unit
  // WEIGHT products: base unit = g → price per gram
  // VOLUME products: base unit = mL → price per mL
  // COUNT products:  base unit = unit → price per unit

  const products = await Promise.all([
    // WEIGHT products
    prisma.product.create({
      data: {
        name: "Paracetamol API",
        sku: "PAR-API-001",
        casNumber: "103-90-2",
        description: "Analgesic and antipyretic active pharmaceutical ingredient",
        category: "Analgesics",
        grade: "USP",
        purity: "≥99.5%",
        dimension: "WEIGHT",
        baseUnit: "g",
        pricePerBase: "0.850000", // ₹850 per kg = ₹0.85 per g
        stockQty: "500000",       // 500 kg in grams
        minOrderQty: "500",       // 500g minimum
        reorderLevel: "50000",    // 50 kg
        createdById: admin.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Ibuprofen API",
        sku: "IBU-API-001",
        casNumber: "15687-27-1",
        description: "Non-steroidal anti-inflammatory drug (NSAID) API",
        category: "Analgesics",
        grade: "BP",
        purity: "≥99.0%",
        dimension: "WEIGHT",
        baseUnit: "g",
        pricePerBase: "1.200000", // ₹1200 per kg
        stockQty: "300000",
        minOrderQty: "1000",
        reorderLevel: "30000",
        createdById: admin.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Amoxicillin Trihydrate",
        sku: "AMX-API-001",
        casNumber: "61336-70-7",
        description: "Broad-spectrum antibiotic API",
        category: "Antibiotics",
        grade: "IP",
        purity: "≥98.0%",
        dimension: "WEIGHT",
        baseUnit: "g",
        pricePerBase: "2.500000", // ₹2500 per kg
        stockQty: "200000",
        minOrderQty: "500",
        reorderLevel: "20000",
        createdById: admin.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Sodium Chloride (NaCl)",
        sku: "NAC-CHM-001",
        casNumber: "7647-14-5",
        description: "Pharmaceutical grade sodium chloride",
        category: "Inorganic Salts",
        grade: "Pharma",
        purity: "≥99.9%",
        dimension: "WEIGHT",
        baseUnit: "g",
        pricePerBase: "0.050000", // ₹50 per kg
        stockQty: "2000000",
        minOrderQty: "1000",
        reorderLevel: "100000",
        createdById: admin.id,
      },
    }),
    // VOLUME products
    prisma.product.create({
      data: {
        name: "Ethanol (Absolute)",
        sku: "ETH-SOL-001",
        casNumber: "64-17-5",
        description: "Absolute ethanol for pharmaceutical use",
        category: "Solvents",
        grade: "Pharma",
        purity: "≥99.9%",
        dimension: "VOLUME",
        baseUnit: "mL",
        pricePerBase: "0.120000", // ₹120 per L = ₹0.12 per mL
        stockQty: "500000",       // 500 L in mL
        minOrderQty: "1000",      // 1 L minimum
        reorderLevel: "50000",
        createdById: admin.id,
      },
    }),
    prisma.product.create({
      data: {
        name: "Dimethyl Sulfoxide (DMSO)",
        sku: "DMS-SOL-001",
        casNumber: "67-68-5",
        description: "High purity DMSO solvent for pharmaceutical applications",
        category: "Solvents",
        grade: "Reagent",
        purity: "≥99.9%",
        dimension: "VOLUME",
        baseUnit: "mL",
        pricePerBase: "0.350000", // ₹350 per L
        stockQty: "100000",
        minOrderQty: "500",
        reorderLevel: "10000",
        createdById: admin.id,
      },
    }),
    // COUNT products
    prisma.product.create({
      data: {
        name: "Empty Gelatin Capsules (Size 0)",
        sku: "CAP-GEL-001",
        casNumber: null,
        description: "Size 0 empty hard gelatin capsules for filling",
        category: "Excipients",
        grade: "Pharma",
        purity: null,
        dimension: "COUNT",
        baseUnit: "unit",
        pricePerBase: "0.850000", // ₹0.85 per capsule
        stockQty: "1000000",
        minOrderQty: "10000",
        reorderLevel: "100000",
        createdById: admin.id,
      },
    }),
  ])

  console.log(`✅ ${products.length} products created`)
  console.log("✅ Seeding complete!\n")
  console.log("─────────────────────────────────────")
  console.log("Test credentials:")
  console.log("  Admin → admin@aasamedchem.com / admin@123")
  console.log("  Buyer → buyer@pharmaco.com    / buyer@123")
  console.log("─────────────────────────────────────")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })