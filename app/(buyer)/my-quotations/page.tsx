import { Badge } from "@/components/ui/badges"
import { StatCard } from "@/components/ui/stat-card"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatINR } from "@/lib/units"
import { cn } from "@/lib/utils"
import type { QuotationStatus } from "@/types"
import { CheckCircle, ClipboardList, Clock, Search, ShieldAlert, XCircle } from "lucide-react"

type SearchParams = Promise<{
  search?: string | string[]
  status?: string | string[]
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

export default async function BuyerQuotationsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser()
  const params = await searchParams

  const search = firstValue(params.search)?.trim() ?? ""
  const status = (firstValue(params.status)?.trim().toUpperCase() ?? "ALL") as QuotationStatus | "ALL"

  const quotations = await prisma.quotation.findMany({
    where: {
      buyerId: user!.sub,
      ...(status !== "ALL" && { status }),
      ...(search && {
        OR: [
          { id: { contains: search, mode: "insensitive" } },
          { notes: { contains: search, mode: "insensitive" } },
          { adminNote: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: { select: { name: true, sku: true, baseUnit: true } },
        },
      },
    },
  })

  const draftCount = quotations.filter((quotation) => quotation.status === "DRAFT").length
  const submittedCount = quotations.filter((quotation) => quotation.status === "SUBMITTED").length
  const approvedCount = quotations.filter((quotation) => quotation.status === "APPROVED").length
  const rejectedCount = quotations.filter((quotation) => quotation.status === "REJECTED").length
  const totalValue = quotations.reduce(
    (sum, quotation) => sum + quotation.items.reduce((itemSum, item) => itemSum + toNumber(item.lineTotal), 0),
    0
  )

  const isFiltered = Boolean(search || status !== "ALL")

  return (
    <div className="min-h-full p-6 lg:p-8">
      <div className="mb-8 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-surface via-surface to-primary/5">
        <div className="relative p-6 lg:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-base/80 px-3 py-1 text-xs text-text-muted backdrop-blur">
                <ClipboardList className="h-3.5 w-3.5 text-primary" />
                Buyer quotations
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-text-primary lg:text-4xl">
                My Quotations
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary lg:text-base">
                Track submitted RFQs, review admin feedback, and monitor the state of your requests.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[46rem]">
              <StatCard label="Total" value={quotations.length} icon={<ClipboardList className="h-4 w-4" />} />
              <StatCard label="Submitted" value={submittedCount} icon={<Clock className="h-4 w-4" />} accent={submittedCount > 0} />
              <StatCard label="Approved" value={approvedCount} icon={<CheckCircle className="h-4 w-4" />} />
              <StatCard label="Value" value={formatINR(totalValue)} icon={<ShieldAlert className="h-4 w-4" />} />
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
              placeholder="Quotation ID, notes, or admin feedback"
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
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Quotation history</h2>
              <p className="mt-1 text-xs text-text-muted">
                {isFiltered ? `${quotations.length} matching quotation${quotations.length === 1 ? "" : "s"}` : `${quotations.length} quotations`}
              </p>
            </div>
            <Badge variant={rejectedCount > 0 ? "warning" : "success"}>
              {rejectedCount > 0 ? `${rejectedCount} rejected` : "Healthy flow"}
            </Badge>
          </div>

          {quotations.length === 0 ? (
            <div className="rounded-2xl border border-border bg-surface px-5 py-14 text-center">
              <p className="text-sm text-text-muted">No quotations match the current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {quotations.map((quotation) => {
                const total = quotation.items.reduce((sum, item) => sum + toNumber(item.lineTotal), 0)
                const topItem = quotation.items[0]

                return (
                  <article key={quotation.id} className={cn("rounded-2xl border border-border bg-surface p-5", quotation.status === "SUBMITTED" && "border-warning/20 bg-warning/5")}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold text-text-primary">{quotation.id}</p>
                          <Badge variant={statusVariant[quotation.status]}>{quotation.status}</Badge>
                        </div>
                        <p className="text-xs text-text-muted">
                          Created {new Date(quotation.createdAt).toLocaleDateString("en-IN")} · Updated {new Date(quotation.updatedAt).toLocaleDateString("en-IN")}
                        </p>
                        {quotation.notes && <p className="max-w-3xl text-sm leading-6 text-text-secondary">{quotation.notes}</p>}
                      </div>

                      <div className="rounded-xl border border-border bg-surface-2 px-4 py-3 text-right">
                        <p className="text-xs text-text-muted">Quotation value</p>
                        <p className="text-lg font-semibold text-text-primary">{formatINR(total)}</p>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div className="rounded-xl bg-surface-2 px-4 py-3">
                        <p className="text-xs text-text-muted">Items</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">{quotation.items.length} line item{quotation.items.length !== 1 ? "s" : ""}</p>
                      </div>
                      <div className="rounded-xl bg-surface-2 px-4 py-3">
                        <p className="text-xs text-text-muted">Top item</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {topItem ? `${topItem.product.name} · ${toNumber(topItem.orderedQtyDisplay)} ${topItem.orderedUnit}` : "No items"}
                        </p>
                      </div>
                      <div className="rounded-xl bg-surface-2 px-4 py-3">
                        <p className="text-xs text-text-muted">Status note</p>
                        <p className="mt-1 text-sm font-medium text-text-primary">
                          {quotation.adminNote || "Awaiting admin review"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 overflow-hidden rounded-xl border border-border">
                      <div className="border-b border-border bg-surface-2/70 px-4 py-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                        Items
                      </div>
                      <div className="divide-y divide-border">
                        {quotation.items.map((item) => (
                          <div key={item.id} className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-medium text-text-primary">{item.product.name}</p>
                              <p className="text-xs text-text-muted">{item.product.sku}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-text-secondary md:justify-end">
                              <span>{toNumber(item.orderedQtyDisplay)} {item.orderedUnit}</span>
                              <span>·</span>
                              <span>{formatINR(toNumber(item.lineTotal))}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h3 className="text-sm font-semibold text-text-primary">Status breakdown</h3>
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
            <h3 className="text-sm font-semibold text-text-primary">Buyer notes</h3>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
                Submitted quotations wait for admin action before moving to approved or rejected.
              </div>
              <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
                Use product browse to shortlist items before creating a quotation request.
              </div>
              <div className="rounded-xl border border-border bg-surface-2 px-4 py-3">
                Admin feedback appears inline once the request is reviewed.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}