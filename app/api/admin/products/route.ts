import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validation"

// GET /api/admin/products — all products including inactive
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category") || ""

    const products = await prisma.product.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { casNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: { equals: category, mode: "insensitive" } }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { name: true, email: true } },
        _count: { select: { quotationItems: true } },
      },
    })

    return NextResponse.json({ success: true, data: products })
  } catch (error) {
    console.error("[GET /api/admin/products]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/admin/products — create new product
export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get("x-user-id")!
    const body = await req.json()
    const parsed = productSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      )
    }

    const data = parsed.data

    const existing = await prisma.product.findUnique({ where: { sku: data.sku } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: "SKU already exists" },
        { status: 409 }
      )
    }

    const product = await prisma.product.create({
      data: {
        name: data.name,
        sku: data.sku,
        casNumber: data.casNumber,
        description: data.description,
        category: data.category,
        grade: data.grade,
        purity: data.purity,
        dimension: data.dimension,
        baseUnit: data.baseUnit,
        pricePerBase: data.pricePerBase,
        stockQty: data.stockQty,
        minOrderQty: data.minOrderQty,
        reorderLevel: data.reorderLevel,
        createdById: userId,
      },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/admin/products]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}