"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import {
  FlaskConical,
  LayoutDashboard,
  Package,
  ClipboardList,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
  { label: "Products", href: "/admin/products", icon: <Package className="w-4 h-4" /> },
  { label: "Quotations", href: "/admin/quotations", icon: <ClipboardList className="w-4 h-4" /> },
]

const buyerNav: NavItem[] = [
  { label: "Browse Products", href: "/buyer/browse", icon: <Package className="w-4 h-4" /> },
  { label: "My Quotations", href: "/buyer/my-quotations", icon: <ClipboardList className="w-4 h-4" /> },
]

interface SidebarProps {
  role: "ADMIN" | "BUYER"
  user: { name: string; email: string; company?: string | null }
}

export function Sidebar({ role, user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const navItems = role === "ADMIN" ? adminNav : buyerNav

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  return (
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center">
            <FlaskConical className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">AasaMedChem</p>
            <p className="text-xs text-text-muted">
              {role === "ADMIN" ? "Supplier Admin" : "Buyer Portal"}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all group",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-2"
              )}
            >
              <span className={cn(isActive ? "text-primary" : "text-text-muted group-hover:text-text-secondary")}>
                {item.icon}
              </span>
              {item.label}
              {isActive && <ChevronRight className="w-3 h-3 ml-auto text-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="px-3 py-2.5 rounded-lg bg-surface-2 mb-1">
          <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
          <p className="text-xs text-text-muted truncate">{user.company || user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-text-secondary hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}