import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { productSchema } from "@/lib/validation"

// PATCH /api/admin/products/[id] — update product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = productSchema.partial().safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error },
        { status: 400 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error("[PATCH /api/admin/products/[id]]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] — soft delete
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({ success: true, message: "Product deactivated" })
  } catch (error) {
    console.error("[DELETE /api/admin/products/[id]]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}