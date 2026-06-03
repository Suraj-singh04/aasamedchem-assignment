import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const jwtUser = await getCurrentUser()

    if (!jwtUser) {
      return NextResponse.json(
        { success: false, error: "Unauthenticated" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: jwtUser.sub },
      select: { id: true, email: true, name: true, role: true, company: true, phone: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })

  } catch (error) {
    console.error("[ME]", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}