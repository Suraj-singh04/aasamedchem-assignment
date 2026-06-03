"use client"

import { Badge } from "@/components/ui/badges"
import { StatCard } from "@/components/ui/stat-card"
import { formatINR, getPriceDisplayLabel } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { BaseUnit, Dimension } from "@/types"
import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangle,
  Boxes,
  FlaskConical,
  Gauge,
  Package,
  PencilLine,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react"

export type ProductRecord = {
  id: string
  name: string
  sku: string
  casNumber: string | null
  description: string | null
  category: string
  grade: string
  purity: string | null
  dimension: Dimension
  baseUnit: BaseUnit
  pricePerBase: string
  stockQty: string
  minOrderQty: string
  reorderLevel: string
  isActive: boolean
  createdAt: string
  createdBy: { name: string; email: string }
  quotationCount: number
}

type ProductManagerProps = {
  products: ProductRecord[]
  categories: string[]
  filters: {
    search: string
    category: string
    dimension: string
    status: string
  }
  stats: {
    total: number
    active: number
    inactive: number
    lowStock: number
    catalogValue: string
    dimensionsInUse: number
  }
  ui: {
    dimensionLabels: Record<Dimension, string>
    baseUnitByDimension: Record<Dimension, BaseUnit>
  }
}

type ProductFormState = {
  name: string
  sku: string
  casNumber: string
  description: string
  category: string
  grade: string
  purity: string
  dimension: Dimension
  baseUnit: BaseUnit
  pricePerBase: string
  stockQty: string
  minOrderQty: string
  reorderLevel: string
  isActive: boolean
}

const unitHelp: Record<Dimension, string> = {
  WEIGHT: "Stored internally as grams; buyer views can present kilograms.",
  VOLUME: "Stored internally as milliliters; buyer views can present liters.",
  COUNT: "Stored and displayed as units or items.",
}

function emptyForm(): ProductFormState {
  return {
    name: "",
    sku: "",
    casNumber: "",
    description: "",
    category: "",
    grade: "",
    purity: "",
    dimension: "WEIGHT",
    baseUnit: "g",
    pricePerBase: "",
    stockQty: "0",
    minOrderQty: "0",
    reorderLevel: "0",
    isActive: true,
  }
}

function formFromProduct(product: ProductRecord): ProductFormState {
  return {
    name: product.name,
    sku: product.sku,
    casNumber: product.casNumber ?? "",
    description: product.description ?? "",
    category: product.category,
    grade: product.grade,
    purity: product.purity ?? "",
    dimension: product.dimension,
    baseUnit: product.baseUnit,
    pricePerBase: product.pricePerBase,
    stockQty: product.stockQty,
    minOrderQty: product.minOrderQty,
    reorderLevel: product.reorderLevel,
    isActive: product.isActive,
  }
}

function toNumber(value: string | number | { toString(): string }) {
  return Number(value.toString())
}

export default function ProductManager({ products, categories, filters, stats, ui }: ProductManagerProps) {
  const router = useRouter()
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const [dimensionDraft, setDimensionDraft] = useState<Dimension>("WEIGHT")
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? null

  useEffect(() => {
    setDimensionDraft(selectedProduct?.dimension ?? "WEIGHT")
  }, [selectedProduct?.id])

  const formKey = selectedProduct?.id ?? "new"
  const baseUnit = ui.baseUnitByDimension[dimensionDraft]
  const lowStockProducts = products.filter(
    (product) => product.isActive && toNumber(product.stockQty) <= toNumber(product.reorderLevel)
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setMessage("")

    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      sku: String(formData.get("sku") ?? "").trim(),
      casNumber: String(formData.get("casNumber") ?? "").trim() || undefined,
      description: String(formData.get("description") ?? "").trim() || undefined,
      category: String(formData.get("category") ?? "").trim(),
      grade: String(formData.get("grade") ?? "").trim(),
      purity: String(formData.get("purity") ?? "").trim() || undefined,
      dimension: String(formData.get("dimension") ?? "WEIGHT") as Dimension,
      baseUnit: String(formData.get("baseUnit") ?? baseUnit) as BaseUnit,
      pricePerBase: String(formData.get("pricePerBase") ?? "").trim(),
      stockQty: String(formData.get("stockQty") ?? "0").trim(),
      minOrderQty: String(formData.get("minOrderQty") ?? "0").trim(),
      reorderLevel: String(formData.get("reorderLevel") ?? "0").trim(),
      isActive: formData.get("isActive") === "on",
    }

    const response = await fetch(selectedProduct ? `/api/admin/products/${selectedProduct.id}` : "/api/admin/products", {
      method: selectedProduct ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const result = await response.json()

    if (!response.ok || !result.success) {
      setError(result.error?.message || result.error || "Unable to save product")
      return
    }

    setMessage(selectedProduct ? "Product updated" : "Product created")
    setSelectedProductId(null)
    setDimensionDraft("WEIGHT")
    event.currentTarget.reset()

    startTransition(() => {
      router.refresh()
    })
  }

  async function handleDelete(product: ProductRecord) {
    const confirmed = window.confirm(`Deactivate ${product.name}?`)
    if (!confirmed) return

    setError("")
    setMessage("")

    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" })
    const result = await response.json()

    if (!response.ok || !result.success) {
      setError(result.error || "Unable to deactivate product")
      return
    }

    if (selectedProduct?.id === product.id) {
      setSelectedProductId(null)
      setDimensionDraft("WEIGHT")
    }

    setMessage("Product deactivated")

    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_26rem]">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary">Inventory management</h2>
            <p className="mt-1 text-xs text-text-muted">
              {products.length} visible product{products.length === 1 ? "" : "s"} · {lowStockProducts.length} below reorder level
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedProductId(null)
              setDimensionDraft("WEIGHT")
              setMessage("")
              setError("")
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover"
          >
            <Plus className="h-4 w-4" />
            New product
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left text-sm">
              <thead className="bg-surface-2/70 text-xs uppercase tracking-wide text-text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Product</th>
                  <th className="px-5 py-3 font-medium">Pricing</th>
                  <th className="px-5 py-3 font-medium">Stock</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const stock = toNumber(product.stockQty)
                  const reorder = toNumber(product.reorderLevel)
                  const lowStock = product.isActive && stock <= reorder

                  return (
                    <tr key={product.id} className={cn("transition-colors", lowStock && "bg-warning/5")}>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">{product.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                            <span>{product.sku}</span>
                            {product.casNumber && <span>CAS {product.casNumber}</span>}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Badge variant="default">{ui.dimensionLabels[product.dimension]}</Badge>
                            <Badge variant="accent">{product.baseUnit}</Badge>
                          </div>
                          <p className="text-xs text-text-muted">{product.category}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="space-y-1">
                          <p className="font-medium text-text-primary">
                            {getPriceDisplayLabel(toNumber(product.pricePerBase), product.baseUnit)}
                          </p>
                          <p className="text-xs text-text-muted">
                            Min order {toNumber(product.minOrderQty).toLocaleString()} {product.baseUnit}
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
                        <div className="space-y-1">
                          <Badge variant={product.isActive ? "success" : "default"}>
                            {product.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <p className="text-xs text-text-muted">{product.quotationCount} quotation{product.quotationCount === 1 ? "" : "s"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedProductId(product.id)}
                            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text-primary transition hover:border-primary/40 hover:bg-primary/10"
                          >
                            <PencilLine className="h-3.5 w-3.5" />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(product)}
                            disabled={isPending || !product.isActive}
                            className="inline-flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/20 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Deactivate
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{selectedProduct ? "Edit product" : "Create product"}</h3>
              <p className="mt-1 text-xs text-text-muted">Base unit is derived from the product dimension: g, mL, or unit.</p>
            </div>
            {selectedProduct && (
              <button
                type="button"
                onClick={() => setSelectedProductId(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium text-text-primary transition hover:border-primary/40 hover:bg-primary/10"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          <form key={formKey} className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-secondary">Name</span>
                <input name="name" defaultValue={selectedProduct?.name ?? ""} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">SKU</span>
                <input name="sku" defaultValue={selectedProduct?.sku ?? ""} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Category</span>
                <input name="category" defaultValue={selectedProduct?.category ?? ""} list="product-categories" required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
                <datalist id="product-categories">
                  {categories.map((item) => <option key={item} value={item} />)}
                </datalist>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Dimension</span>
                <select
                  name="dimension"
                  value={dimensionDraft}
                  onChange={(event) => setDimensionDraft(event.target.value as Dimension)}
                  className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
                >
                  {Object.entries(ui.dimensionLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Base unit</span>
                <div className="rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary">{baseUnit}</div>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Grade</span>
                <input name="grade" defaultValue={selectedProduct?.grade ?? ""} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Purity</span>
                <input name="purity" defaultValue={selectedProduct?.purity ?? ""} placeholder="e.g. 99.5%" className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
            </div>

            <label className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Description</span>
              <textarea name="description" defaultValue={selectedProduct?.description ?? ""} rows={3} className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
            </label>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">CAS number</span>
                <input name="casNumber" defaultValue={selectedProduct?.casNumber ?? ""} className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Base price per {baseUnit}</span>
                <input name="pricePerBase" defaultValue={selectedProduct?.pricePerBase ?? ""} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Stock</span>
                <input name="stockQty" defaultValue={selectedProduct?.stockQty ?? "0"} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Min order</span>
                <input name="minOrderQty" defaultValue={selectedProduct?.minOrderQty ?? "0"} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
              <label className="space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">Reorder level</span>
                <input name="reorderLevel" defaultValue={selectedProduct?.reorderLevel ?? "0"} required className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30" />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3">
              <input name="isActive" type="checkbox" defaultChecked={selectedProduct ? selectedProduct.isActive : true} className="h-4 w-4 rounded border-border bg-surface-2 text-primary focus:ring-primary/40" />
              <span className="text-sm text-text-secondary">Active product</span>
            </label>

            <input type="hidden" name="baseUnit" value={baseUnit} />

            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={isPending} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
                <Save className="h-4 w-4" />
                {selectedProduct ? "Update product" : "Create product"}
              </button>
              <button type="button" onClick={() => {
                setSelectedProductId(null)
                setDimensionDraft("WEIGHT")
                setMessage("")
                setError("")
              }} className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-primary transition hover:border-primary/40 hover:bg-primary/10">
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>

            {message && <p className="text-sm text-success">{message}</p>}
            {error && <p className="text-sm text-danger">{error}</p>}
          </form>

          <div className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
              <span className="text-text-secondary">Price display</span>
              <span className="font-medium text-text-primary">{selectedProduct ? getPriceDisplayLabel(toNumber(selectedProduct.pricePerBase), baseUnit) : `₹... / ${baseUnit === "g" ? "kg" : baseUnit === "mL" ? "L" : "unit"}`}</span>
            </div>
            <div className="rounded-xl bg-surface-2 px-4 py-3 text-xs text-text-muted">
              {unitHelp[dimensionDraft]}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary">Snapshot</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
              <span className="text-text-secondary">Catalog value</span>
              <span className="font-medium text-text-primary">{stats.catalogValue}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
              <span className="text-text-secondary">Dimensions in use</span>
              <span className="font-medium text-text-primary">{stats.dimensionsInUse}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
              <span className="text-text-secondary">Current selection</span>
              <span className="font-medium text-text-primary">{selectedProduct ? selectedProduct.name : "New product"}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5">
          <h3 className="text-sm font-semibold text-text-primary">Low stock watchlist</h3>
          <p className="mt-1 text-xs text-text-muted">Products at or below reorder levels.</p>
          <div className="mt-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <div className="rounded-xl border border-border bg-surface-2 p-4 text-sm text-text-muted">
                No active products are currently below reorder level.
              </div>
            ) : (
              lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{product.name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{product.sku}</p>
                    </div>
                    <Badge variant="warning">Low</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                    <span>{toNumber(product.stockQty).toLocaleString()} {product.baseUnit} left</span>
                    <span>Reorder: {toNumber(product.reorderLevel).toLocaleString()} {product.baseUnit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}