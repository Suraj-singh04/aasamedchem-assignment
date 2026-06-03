import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth"
import { Sidebar } from "@/components/shared/sidebar"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  if (!user) redirect("/login")
  if (user.role !== "ADMIN") redirect("/buyer/browse")

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar role="ADMIN" user={{ name: user.name, email: user.email }} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}