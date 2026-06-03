import { AlertTriangle, Boxes, FlaskConical, Gauge, Package, Search } from "lucide-react"
import { StatCard } from "@/components/ui/stat-card"
import ProductManager from "@/components/admin/product-manager"
import { prisma } from "@/lib/prisma"
import { formatINR } from "@/lib/units"
import type { BaseUnit, Dimension } from "@/types"


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

const baseUnitByDimension: Record<Dimension, BaseUnit> = {
  WEIGHT: "g",
  VOLUME: "mL",
  COUNT: "unit",
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
        isActive: true,
        createdAt: true,
        createdBy: { select: { name: true, email: true } },
        _count: { select: { quotationItems: true } },
      },
    }),
  ])

  const activeProducts = allProducts.filter((product) => product.isActive)
  const inactiveProducts = allProducts.length - activeProducts.length
  const lowStockProducts = activeProducts.filter(
    (product) => toNumber(product.stockQty) <= toNumber(product.reorderLevel)
  )

  Boolean(search || category || dimension || status !== "all")
  const categoryOptions = categories.map((item) => item.category)
  const catalogValue = activeProducts.reduce(
    (sum, product) => sum + toNumber(product.stockQty) * toNumber(product.pricePerBase),
    0
  )
  const dimensionsInUse = new Set(activeProducts.map((product) => product.dimension)).size

  const serializedProducts = products.map((product) => ({
    id: product.id,
    name: product.name,
    sku: product.sku,
    casNumber: product.casNumber ?? null,
    description: product.description ?? null,
    category: product.category,
    grade: product.grade,
    purity: product.purity ?? null,
    dimension: product.dimension,
    baseUnit: product.baseUnit,
    pricePerBase: product.pricePerBase.toString(),
    stockQty: product.stockQty.toString(),
    minOrderQty: product.minOrderQty.toString(),
    reorderLevel: product.reorderLevel.toString(),
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    createdBy: product.createdBy,
    quotationCount: ((product as unknown) as { _count?: { quotationItems: number } })._count?.quotationItems ?? 0,
  }))

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-linear-to-br from-surface via-surface to-primary/5">
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

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-184">
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <ProductManager
          products={serializedProducts}
          categories={categoryOptions}
          filters={{ search, category, dimension, status }}
          stats={{
            total: allProducts.length,
            active: activeProducts.length,
            inactive: inactiveProducts,
            lowStock: lowStockProducts.length,
            catalogValue: formatINR(catalogValue),
            dimensionsInUse,
          }}
          ui={{
            dimensionLabels,
            baseUnitByDimension,
          }}
        />
      </div>
    </div>
  )
}