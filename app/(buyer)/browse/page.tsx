import { Badge } from "@/components/ui/badges"
import { StatCard } from "@/components/ui/stat-card"
import { prisma } from "@/lib/prisma"
import { formatINR, getPriceDisplayLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { Dimension } from "@/types"
import { AlertTriangle, Boxes, FlaskConical, Package, Search, ShieldCheck } from "lucide-react"
import RequestQuote from "@/components/buyer/request-quote"
import QuoteCart from "@/components/buyer/quote-cart"

type SearchParams = Promise<{
  search?: string | string[]
  category?: string | string[]
  dimension?: string | string[]
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

export default async function BuyerBrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search = firstValue(params.search)?.trim() ?? ""
  const category = firstValue(params.category)?.trim() ?? ""
  const dimension = firstValue(params.dimension)?.trim() ?? ""

  const [allProducts, categories, products] = await Promise.all([
    prisma.product.findMany({
        where: { isActive: true },
        select: {
            id: true,
            category: true,
            dimension: true,
            stockQty: true,
            reorderLevel: true, // ADD THIS
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
        isActive: true,
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku: { contains: search, mode: "insensitive" } },
            { casNumber: { contains: search, mode: "insensitive" } },
          ],
        }),
        ...(category && { category: { equals: category, mode: "insensitive" } }),
        ...(dimension && { dimension: dimension as Dimension }),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        casNumber: true,
        description: true,
        category: true,
        grade: true,
        purity: true,
        dimension: true,
        baseUnit: true,
        pricePerBase: true,
        stockQty: true,
        minOrderQty: true,
        reorderLevel: true,
      },
    }),
  ])

  const lowStockCount = allProducts.filter((product) => toNumber(product.stockQty) <= toNumber(product.reorderLevel)).length
  const categoryCount = new Set(allProducts.map((product) => product.category)).size
  const averagePrice =
    allProducts.length > 0
      ? allProducts.reduce((sum, product) => sum + toNumber(product.pricePerBase), 0) / allProducts.length
      : 0
  const categoryOptions = categories.map((item) => item.category)
  const isFiltered = Boolean(search || category || dimension)

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-accent/5">
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.10),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-base/80 px-3 py-1 text-xs text-text-muted backdrop-blur">
                <FlaskConical className="h-3.5 w-3.5 text-accent" />
                Buyer catalog
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
                Browse Products
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary lg:text-base">
                Explore the active catalog, compare pricing, and shortlist items for quotation requests.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[46rem]">
              <StatCard label="Active" value={allProducts.length} icon={<Package className="h-4 w-4" />} />
              <StatCard label="Categories" value={categoryCount} icon={<Boxes className="h-4 w-4" />} />
              <StatCard label="Low stock" value={lowStockCount} icon={<AlertTriangle className="h-4 w-4" />} accent={lowStockCount > 0} />
              <StatCard label="Avg price" value={formatINR(averagePrice)} icon={<ShieldCheck className="h-4 w-4" />} />
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

          <label className="lg:col-span-3">
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

          <label className="lg:col-span-3">
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
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Product catalog</h2>
              <p className="mt-1 text-xs text-text-muted">
                {isFiltered ? `${products.length} matching product${products.length === 1 ? "" : "s"}` : `${products.length} products`}
              </p>
            </div>
            <Badge variant={lowStockCount > 0 ? "warning" : "success"}>
              {lowStockCount > 0 ? `${lowStockCount} near reorder` : "Stock healthy"}
            </Badge>
          </div>

          {products.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-5 py-14 text-center">
              <p className="text-sm text-text-muted">No products match the current filters.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => {
                const stock = toNumber(product.stockQty)
                const reorder = toNumber(product.reorderLevel)
                const minOrder = toNumber(product.minOrderQty)
                const lowStock = stock <= reorder

                  // Serialize Decimal fields to plain JS values for client components
                  const productLite = {
                    id: product.id,
                    name: product.name,
                    baseUnit: product.baseUnit,
                    dimension: product.dimension,
                    minOrderQty: minOrder,
                  }

                return (
                  <article
                    key={product.id}
                    className={cn(
                      "overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-black/20",
                      lowStock && "border-warning/20 bg-warning/5"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-text-primary">{product.name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                          <span>{product.sku}</span>
                          {product.casNumber && <span>CAS {product.casNumber}</span>}
                        </div>
                      </div>
                      {lowStock && <Badge variant="warning">Low stock</Badge>}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Badge variant="default">{dimensionLabels[product.dimension]}</Badge>
                      <Badge variant="accent">{product.baseUnit}</Badge>
                    </div>

                    <div className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Category</span>
                        <span className="text-right font-medium text-text-primary">{product.category}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Grade</span>
                        <span className="text-right font-medium text-text-primary">{product.grade}</span>
                      </div>
                      {product.purity && (
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-text-secondary">Purity</span>
                          <span className="text-right font-medium text-text-primary">{product.purity}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Price</span>
                        <span className="text-right font-medium text-text-primary">
                          {getPriceDisplayLabel(toNumber(product.pricePerBase), product.baseUnit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Stock</span>
                        <span className="text-right font-medium text-text-primary">
                          {stock.toLocaleString()} {product.baseUnit}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-text-secondary">Minimum order</span>
                        <span className="text-right font-medium text-text-primary">
                          {minOrder.toLocaleString()} {product.baseUnit}
                        </span>
                      </div>
                    </div>

                    {product.description && (
                      <p className="mt-4 line-clamp-3 text-xs leading-5 text-text-muted">
                        {product.description}
                      </p>
                    )}

                    <RequestQuote product={productLite} />
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Buyer flow</h3>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="rounded-xl bg-surface-2 px-4 py-3">
                Filter the catalog and compare products by grade, stock, and packaging unit.
              </div>
              <div className="rounded-xl bg-surface-2 px-4 py-3">
                Use the quotation screen to review submitted RFQs and track their status.
              </div>
              <div className="rounded-xl bg-surface-2 px-4 py-3">
                Keep an eye on low-stock items before requesting pricing.
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <QuoteCart />
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Category list</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryOptions.length === 0 ? (
                <p className="text-sm text-text-muted">No categories available.</p>
              ) : (
                categoryOptions.map((item) => (
                  <Badge key={item} variant="default">
                    {item}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}