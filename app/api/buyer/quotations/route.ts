import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { quotationSchema } from "@/lib/validation"
import { toBaseUnit, calcLineTotal, isValidUnitForDimension } from "@/lib/units"

// GET /api/buyer/quotations — buyer sees their own quotations
export async function GET(req: NextRequest) {
  try {
    const buyerId = req.headers.get("x-user-id")!

    const quotations = await prisma.quotation.findMany({
      where: { buyerId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            product: {
              select: { name: true, sku: true, casNumber: true, baseUnit: true },
            },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: quotations })
  } catch (error) {
    console.error("[GET /api/buyer/quotations]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/buyer/quotations — buyer submits a new RFQ
export async function POST(req: NextRequest) {
  try {
    const buyerId = req.headers.get("x-user-id")!
    const body = await req.json()
    const parsed = quotationSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      )
    }

    const { notes, items } = parsed.data

    // Fetch all products in one query
    const productIds = items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    })

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more products not found or inactive" },
        { status: 400 }
      )
    }

    const productMap = new Map(products.map((p) => [p.id, p]))

    // Validate units and build line items
    const lineItems = []

    for (const item of items) {
      const product = productMap.get(item.productId)!

      if (!isValidUnitForDimension(item.orderedUnit, product.dimension)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid unit "${item.orderedUnit}" for product "${product.name}" (${product.dimension})`,
          },
          { status: 400 }
        )
      }

      const pricePerBase = parseFloat(product.pricePerBase.toString())
      const orderedQtyBase = toBaseUnit(item.orderedQtyDisplay, item.orderedUnit)
      const lineTotal = calcLineTotal(orderedQtyBase, pricePerBase)

      // Enforce minimum order quantity
      if (orderedQtyBase < parseFloat(product.minOrderQty.toString())) {
        return NextResponse.json(
          {
            success: false,
            error: `Minimum order for "${product.name}" is ${product.minOrderQty} ${product.baseUnit}`,
          },
          { status: 400 }
        )
      }

      lineItems.push({
        productId: item.productId,
        orderedQtyDisplay: item.orderedQtyDisplay,
        orderedUnit: item.orderedUnit,
        orderedQtyBase,
        unitPriceSnap: pricePerBase,
        lineTotal,
      })
    }

    // Create quotation with items in a transaction
    const quotation = await prisma.$transaction(async (tx) => {
      return tx.quotation.create({
        data: {
          buyerId,
          status: "SUBMITTED",
          notes,
          items: {
            create: lineItems.map((item) => ({
              productId: item.productId,
              orderedQtyDisplay: item.orderedQtyDisplay.toString(),
              orderedUnit: item.orderedUnit,
              orderedQtyBase: item.orderedQtyBase.toString(),
              unitPriceSnap: item.unitPriceSnap.toString(),
              lineTotal: item.lineTotal.toFixed(2),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, sku: true, casNumber: true, baseUnit: true },
              },
            },
          },
        },
      })
    })

    return NextResponse.json({ success: true, data: quotation }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/buyer/quotations]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}