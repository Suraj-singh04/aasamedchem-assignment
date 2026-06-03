import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { StatCard } from "@/components/ui/stat-card"
import { Badge } from "@/components/ui/badges"
import { Package, ClipboardList, CheckCircle, Clock } from "lucide-react"
import { formatINR } from "@/lib/units"

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  const [
    totalProducts,
    activeProducts,
    totalQuotations,
    submittedQuotations,
    approvedQuotations,
    recentQuotations,
    lowStockProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.quotation.count(),
    prisma.quotation.count({ where: { status: "SUBMITTED" } }),
    prisma.quotation.count({ where: { status: "APPROVED" } }),
    prisma.quotation.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        buyer: { select: { name: true, company: true } },
        items: true,
      },
    }),
    prisma.product.findMany({
      where: {
        isActive: true,
        // products where stock is below reorder level
      },
      take: 5,
      orderBy: { stockQty: "asc" },
      select: { name: true, sku: true, stockQty: true, reorderLevel: true, baseUnit: true },
    }),
  ])

  const statusVariant: Record<string, "warning" | "success" | "danger" | "default"> = {
    SUBMITTED: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    DRAFT: "default",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary text-sm mt-1">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Active Products"
          value={activeProducts}
          icon={<Package className="w-4 h-4" />}
        />
        <StatCard
          label="Total Quotations"
          value={totalQuotations}
          icon={<ClipboardList className="w-4 h-4" />}
        />
        <StatCard
          label="Pending Review"
          value={submittedQuotations}
          icon={<Clock className="w-4 h-4" />}
          accent={submittedQuotations > 0}
        />
        <StatCard
          label="Approved"
          value={approvedQuotations}
          icon={<CheckCircle className="w-4 h-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent quotations */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Recent Quotations</h2>
          {recentQuotations.length === 0 ? (
            <p className="text-text-muted text-sm">No quotations yet</p>
          ) : (
            <div className="space-y-3">
              {recentQuotations.map((q) => (
                <div key={q.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-text-primary">
                      {q.buyer.company || q.buyer.name}
                    </p>
                    <p className="text-xs text-text-muted mt-0.5">
                      {q.items.length} item{q.items.length !== 1 ? "s" : ""} ·{" "}
                      {new Date(q.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <Badge variant={statusVariant[q.status]}>
                    {q.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="bg-surface border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Inventory Overview</h2>
          {lowStockProducts.length === 0 ? (
            <p className="text-text-muted text-sm">No products found</p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => {
                const isLow = parseFloat(p.stockQty.toString()) <= parseFloat(p.reorderLevel.toString())
                return (
                  <div key={p.sku} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{p.name}</p>
                      <p className="text-xs text-text-muted mt-0.5">{p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-text-primary">
                        {parseFloat(p.stockQty.toString()).toLocaleString()} {p.baseUnit}
                      </p>
                      {isLow && (
                        <Badge variant="warning" className="mt-0.5">Low stock</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}