import { Badge } from "@/components/ui/badges"
import { StatCard } from "@/components/ui/stat-card"
import { prisma } from "@/lib/prisma"
import { formatINR } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { QuotationStatus } from "@/types"
import { CheckCircle, ClipboardList, Clock, Search, ShieldAlert, Truck } from "lucide-react"
import QuotationActions from "@/components/admin/quotation-actions"

type SearchParams = Promise<{
  status?: string | string[]
  search?: string | string[]
}>

const statusLabels: Record<QuotationStatus | "ALL", string> = {
  ALL: "All",
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
}

const statusVariant: Record<QuotationStatus, "warning" | "success" | "danger" | "default"> = {
  DRAFT: "default",
  SUBMITTED: "warning",
  APPROVED: "success",
  REJECTED: "danger",
}

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function toNumber(value: { toString(): string } | number | string) {
  return Number(value.toString())
}

export default async function AdminQuotationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search = firstValue(params.search)?.trim() ?? ""
  const status = (firstValue(params.status)?.trim().toUpperCase() ?? "ALL") as QuotationStatus | "ALL"

  const quotations = await prisma.quotation.findMany({
    where: {
      ...(status !== "ALL" && { status }),
      ...(search && {
        OR: [
          { buyer: { name: { contains: search, mode: "insensitive" } } },
          { buyer: { company: { contains: search, mode: "insensitive" } } },
          { buyer: { email: { contains: search, mode: "insensitive" } } },
          { id: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true, company: true, phone: true } },
      items: {
        include: {
          product: { select: { name: true, sku: true, baseUnit: true, grade: true, purity: true } },
        },
      },
    },
  })

  const submittedCount = quotations.filter((quotation) => quotation.status === "SUBMITTED").length
  const approvedCount = quotations.filter((quotation) => quotation.status === "APPROVED").length
  const rejectedCount = quotations.filter((quotation) => quotation.status === "REJECTED").length
  const draftCount = quotations.filter((quotation) => quotation.status === "DRAFT").length
  const totalValue = quotations.reduce(
    (sum, quotation) => sum + quotation.items.reduce((itemSum, item) => itemSum + toNumber(item.lineTotal), 0),
    0
  )

  const isFiltered = Boolean(search || status !== "ALL")

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-accent/5">
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.10),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-base/80 px-3 py-1 text-xs text-text-muted backdrop-blur">
                <ClipboardList className="h-3.5 w-3.5 text-accent" />
                Admin quotations
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
                Quotations
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary lg:text-base">
                Track buyer requests, review demand, and monitor the quotation pipeline from one place.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[46rem]">
              <StatCard label="Total" value={quotations.length} icon={<ClipboardList className="h-4 w-4" />} />
              <StatCard label="Submitted" value={submittedCount} icon={<Clock className="h-4 w-4" />} accent={submittedCount > 0} />
              <StatCard label="Approved" value={approvedCount} icon={<CheckCircle className="h-4 w-4" />} />
              <StatCard label="Value" value={formatINR(totalValue)} icon={<Truck className="h-4 w-4" />} />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-surface p-4 lg:p-5">
        <form className="grid gap-3 lg:grid-cols-12 lg:items-end" method="get">
          <label className="relative lg:col-span-8">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Search</span>
            <Search className="pointer-events-none absolute left-3 top-[2.55rem] h-4 w-4 text-text-muted" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Buyer name, company, email, or quotation ID"
              className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-9 pr-3 text-sm text-text-primary placeholder:text-text-muted outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            />
          </label>

          <label className="lg:col-span-3">
            <span className="mb-1.5 block text-xs font-medium text-text-secondary">Status</span>
            <select
              name="status"
              defaultValue={status}
              className="w-full appearance-none rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none transition focus:border-primary/50 focus:ring-1 focus:ring-primary/30"
            >
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
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
        <div className="overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Quotation list</h2>
              <p className="mt-1 text-xs text-text-muted">
                {isFiltered ? `${quotations.length} matching quotation${quotations.length === 1 ? "" : "s"}` : `${quotations.length} quotations`}
              </p>
            </div>
            <Badge variant={rejectedCount > 0 ? "warning" : "success"}>
              {rejectedCount > 0 ? `${rejectedCount} rejected` : "Pipeline healthy"}
            </Badge>
          </div>

          {quotations.length === 0 ? (
            <div className="px-5 py-14 text-center">
              <p className="text-sm text-text-muted">No quotations match the current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-left text-sm">
                <thead className="bg-surface-2/70 text-xs uppercase tracking-wide text-text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Quotation</th>
                    <th className="px-5 py-3 font-medium">Buyer</th>
                    <th className="px-5 py-3 font-medium">Items</th>
                    <th className="px-5 py-3 font-medium">Value</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {quotations.map((quotation) => {
                    const quotationValue = quotation.items.reduce(
                      (sum, item) => sum + toNumber(item.lineTotal),
                      0
                    )
                    const topItem = quotation.items[0]

                    return (
                      <tr key={quotation.id} className={cn("transition-colors", quotation.status === "SUBMITTED" && "bg-warning/5")}>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{quotation.id}</p>
                            <p className="text-xs text-text-muted">
                              Created {new Date(quotation.createdAt).toLocaleDateString("en-IN")}
                            </p>
                            {quotation.notes && <p className="text-xs text-text-muted line-clamp-2">{quotation.notes}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-text-secondary">
                          <div className="space-y-1">
                            <p className="text-sm text-text-primary">{quotation.buyer.company || quotation.buyer.name}</p>
                            <p className="text-xs text-text-muted">{quotation.buyer.email}</p>
                            {quotation.buyer.phone && <p className="text-xs text-text-muted">{quotation.buyer.phone}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{quotation.items.length} item{quotation.items.length !== 1 ? "s" : ""}</p>
                            {topItem && (
                              <p className="text-xs text-text-muted">
                                Top item: {topItem.product.name} · {toNumber(topItem.orderedQtyDisplay)} {topItem.orderedUnit}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <p className="font-medium text-text-primary">{formatINR(quotationValue)}</p>
                            <p className="text-xs text-text-muted">Line total value</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <div className="space-y-1">
                            <Badge variant={statusVariant[quotation.status]}>{quotation.status}</Badge>
                            {quotation.adminNote && <p className="text-xs text-text-muted line-clamp-2">{quotation.adminNote}</p>}
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top text-text-secondary">
                          <div className="space-y-1">
                            <p className="text-sm text-text-primary">{new Date(quotation.updatedAt).toLocaleDateString("en-IN")}</p>
                            <p className="text-xs text-text-muted">
                              {new Date(quotation.updatedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-top">
                          <QuotationActions id={quotation.id} status={quotation.status} />
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
            <h3 className="text-sm font-semibold text-text-primary">Status breakdown</h3>
            <p className="mt-1 text-xs text-text-muted">Current quotation distribution.</p>

            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Draft</span>
                <Badge variant="default">{draftCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Submitted</span>
                <Badge variant="warning">{submittedCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Approved</span>
                <Badge variant="success">{approvedCount}</Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                <span className="text-text-secondary">Rejected</span>
                <Badge variant="danger">{rejectedCount}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Attention</h3>
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2 text-warning">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="font-medium">Submitted quotations need review</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-text-muted">
                  Use this page as the admin review queue. You can later wire each row to the quotation action endpoint.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}