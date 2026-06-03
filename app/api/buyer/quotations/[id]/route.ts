import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/buyer/quotations/[id] — buyer views single quotation
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const buyerId = req.headers.get("x-user-id")!

    const quotation = await prisma.quotation.findUnique({
      where: { id, buyerId },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
                casNumber: true,
                baseUnit: true,
                grade: true,
                purity: true,
              },
            },
          },
        },
      },
    })

    if (!quotation) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: quotation })
  } catch (error) {
    console.error("[GET /api/buyer/quotations/[id]]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}