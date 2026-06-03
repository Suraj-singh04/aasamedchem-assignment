import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Sidebar } from "@/components/shared/sidebar"

export default async function BuyerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (user.role !== "BUYER") redirect("/admin/dashboard")

  const dbUser = await prisma.user.findUnique({
    where: { id: user.sub },
    select: { company: true },
  })

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar role="BUYER" user={{ name: user.name, email: user.email, company: dbUser?.company }} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}