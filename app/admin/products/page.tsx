import { Badge } from "@/components/ui/badges"
import { StatCard } from "@/components/ui/stat-card"
import { prisma } from "@/lib/prisma"
import { formatINR, getPriceDisplayLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { Dimension } from "@/types"
import { AlertTriangle, Boxes, FlaskConical, Gauge, Package, Search } from "lucide-react"

type SearchParams = Promise<{
  search?: string | string[]
  category?: string | string[]
  dimension?: string | string[]
  status?: string | string[]
}>

const dimensionLabels: Record<Dimension, string> = {
  WEIGHT: "Weight",
  VOLUME: "Volume",
  COUNT: "Count",
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toNumber(value: { toString(): string } | number | string) {
  return Number(value.toString())
}

export default async function AdminProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search = firstValue(params.search)?.trim() ?? ""
  const category = firstValue(params.category)?.trim() ?? ""
  const dimension = firstValue(params.dimension)?.trim() ?? ""
  const status = firstValue(params.status)?.trim() ?? "all"

  const [allProducts, categories, products] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        baseUnit: true,
        isActive: true,
        stockQty: true,
        reorderLevel: true,
        dimension: true,
        pricePerBase: true,
      },
    }),
    prisma.product.findMany({
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    }),
    prisma.product.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { casNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: { equals: category, mode: "insensitive" } }),
        ...(dimension && { dimension: dimension as Dimension }),
        ...(status === "active" && { isActive: true }),
        ...(status === "inactive" && { isActive: false }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        casNumber: true,
        category: true,
        grade: true,
        purity: true,
        dimension: true,
        baseUnit: true,
        pricePerBase: true,
        stockQty: true,
        minOrderQty: true,
        reorderLevel: true,
        isActive: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
      },
    }),
  ])

  const activeProducts = allProducts.filter((product) => product.isActive)
  const inactiveProducts = allProducts.length - activeProducts.length
  const lowStockProducts = activeProducts.filter(
    (product) => toNumber(product.stockQty) <= toNumber(product.reorderLevel)
  )

  const isFiltered = Boolean(search || category || dimension || status !== "all")
  const categoryOptions = categories.map((item) => item.category)
  const catalogValue = activeProducts.reduce(
    (sum, product) => sum + toNumber(product.stockQty) * toNumber(product.pricePerBase),
    0
  )
  const dimensionsInUse = new Set(activeProducts.map((product) => product.dimension)).size

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-primary/5">
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.10),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-base/80 px-3 py-1 text-xs text-text-muted backdrop-blur">
                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                Admin inventory
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
                Products
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6   lg:text-base text-white">
                Review product inventory, pricing, and stock health from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[46rem]">
              <StatCard label="Total" value={allProducts.length} icon={<Package className="h-4 w-4" />} />
              <StatCard label="Active" value={activeProducts.length} icon={<Boxes className="h-4 w-4" />} />
              <StatCard label="Low stock" value={lowStockProducts.length} icon={<AlertTriangle className="h-4 w-4" />} accent={lowStockProducts.length > 0} />
              <StatCard label="Inactive" value={inactiveProducts} icon={<Gauge className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 lg:p-5">
        <form className="grid gap-3 lg:grid-cols-12 lg:items-end" method="get">
          <label className="relative lg:col-span-5">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Search</span>
            <Search className="pointer-events-none absolute left-3 top-[2.55rem] h-4 w-4 text-text-muted" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Name, SKU, or CAS number"
              className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </label>

          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Category</span>
            <select
              name="category"
              defaultValue={category}
              className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            >
              <option value="">All</option>
              {categoryOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Dimension</span>
            <select
              name="dimension"
              defaultValue={dimension}
              className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            >
              <option value="">All</option>
              {(Object.keys(dimensionLabels) as Dimension[]).map((item) => (
                <option key={item} value={item}>
                  {dimensionLabels[item]}
                </option>
              ))}
            </select>
          </label>

          <label className="lg:col-span-2">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Status</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <div className="flex gap-2 lg:col-span-1 lg:justify-end">
            <button
              type="submit"
              className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover lg:w-auto"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Inventory list</h2>
              <p className="mt-1 text-xs text-text-muted">
                {isFiltered ? `${products.length} matching product${products.length === 1 ? "" : "s"}` : `${products.length} products`}
              </p>
            </div>
            <Badge variant={lowStockProducts.length > 0 ? "warning" : "success"}>
              {lowStockProducts.length > 0 ? `${lowStockProducts.length} need attention` : "Stock healthy"}
            </Badge>
          </div>

          {products.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-text-muted">No products match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-surface-2/70 text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Product</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Pricing</th>
                    <th className="px-5 py-3 font-medium">Inventory</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {products.map((product) => {
                    const stock = toNumber(product.stockQty)
                    const reorder = toNumber(product.reorderLevel)
                    const minimumOrder = toNumber(product.minOrderQty)
                    const lowStock = product.isActive && stock <= reorder

                    return (
                      <tr key={product.id} className={cn("transition-colors", lowStock && "bg-warning/5") }>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{product.name}</p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                              <span>{product.sku}</span>
                              {product.casNumber && <span>CAS {product.casNumber}</span>}
                            </div>
                            <div className="flex flex-wrap gap-2 pt-1">
                              <Badge variant="default">{dimensionLabels[product.dimension as Dimension]}</Badge>
                              <Badge variant="accent">{product.baseUnit}</Badge>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-text-secondary">
                          <div className="space-y-1">
                            <p className="text-sm text-text-primary">{product.category}</p>
                            <p className="text-xs text-text-muted">{product.grade}</p>
                            {product.purity && <p className="text-xs text-text-muted">Purity {product.purity}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">
                              {getPriceDisplayLabel(toNumber(product.pricePerBase), product.baseUnit)}
                            </p>
                            <p className="text-xs text-text-muted">
                              Min order {minimumOrder.toLocaleString()} {product.baseUnit}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">
                              {stock.toLocaleString()} {product.baseUnit}
                            </p>
                            <p className="text-xs text-text-muted">
                              Reorder at {reorder.toLocaleString()} {product.baseUnit}
                            </p>
                            {lowStock && <Badge variant="warning">Low stock</Badge>}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <Badge variant={product.isActive ? "success" : "default"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="px-5 py-4 align-top text-text-secondary">
                          <div className="space-y-1">
                            <p className="text-sm text-text-primary">{product.createdBy.name}</p>
                            <p className="text-xs text-text-muted">{product.createdBy.email}</p>
                            <p className="text-xs text-text-muted">
                              Added {new Date(product.createdAt).toLocaleDateString("en-IN")}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Low stock watchlist</h3>
            <p className="mt-1 text-xs text-text-muted">Products at or below reorder levels.</p>

            <div className="mt-4 space-y-3">
              {lowStockProducts.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-muted">
                  No active products are currently below reorder level.
                </div>
              ) : (
                lowStockProducts.slice(0, 5).map((product) => {
                  const stock = toNumber(product.stockQty)
                  const reorder = toNumber(product.reorderLevel)

                  return (
                    <div key={product.id} className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{product.name}</p>
                          <p className="mt-0.5 text-xs text-text-muted">{product.sku}</p>
                        </div>
                        <Badge variant="warning">Low</Badge>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                        <span>{stock.toLocaleString()} {product.baseUnit} left</span>
                        <span>Reorder: {reorder.toLocaleString()} {product.baseUnit}</span>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Snapshot</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Catalog value</span>
                <span className="font-medium text-text-primary">
                  {formatINR(catalogValue)}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Dimensions in use</span>
                <span className="font-medium text-text-primary">
                  {dimensionsInUse}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Visible rows</span>
                <span className="font-medium text-text-primary">{products.length}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}