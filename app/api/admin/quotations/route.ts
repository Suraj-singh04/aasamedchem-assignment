import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/admin/quotations — admin sees all quotations
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status") || ""

    const quotations = await prisma.quotation.findMany({
      where: {
        ...(status && { status: status as any }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        buyer: {
          select: { name: true, email: true, company: true, phone: true },
        },
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

    return NextResponse.json({ success: true, data: quotations })
  } catch (error) {
    console.error("[GET /api/admin/quotations]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}