import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { quotationStatusSchema } from "@/lib/validation"

// PATCH /api/admin/quotations/[id] — admin approves or rejects
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = quotationStatusSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      )
    }

    const existing = await prisma.quotation.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Quotation not found" },
        { status: 404 }
      )
    }

    // Only SUBMITTED quotations can be actioned
    if (existing.status !== "SUBMITTED") {
      return NextResponse.json(
        { success: false, error: `Quotation is already ${existing.status.toLowerCase()}` },
        { status: 409 }
      )
    }

    const quotation = await prisma.quotation.update({
      where: { id },
      data: {
        status: parsed.data.status,
        adminNote: parsed.data.adminNote,
      },
      include: {
        buyer: { select: { name: true, email: true, company: true } },
        items: {
          include: {
            product: { select: { name: true, sku: true, baseUnit: true } },
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: quotation })
  } catch (error) {
    console.error("[PATCH /api/admin/quotations/[id]]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}