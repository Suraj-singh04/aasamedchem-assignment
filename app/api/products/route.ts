import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/products — list all active products with search + filter
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""
    const dimension = searchParams.get("dimension") || ""

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { casNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: { equals: category, mode: "insensitive" } }),
        ...(dimension && { dimension: dimension as any }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        casNumber: true,
        description: true,
        category: true,
        grade: true,
        purity: true,
        dimension: true,
        baseUnit: true,
        pricePerBase: true,
        stockQty: true,
        minOrderQty: true,
        isActive: true,
      },
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error("[GET /api/products]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}