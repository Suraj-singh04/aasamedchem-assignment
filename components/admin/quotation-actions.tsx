"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, X } from "lucide-react"

type Props = {
  id: string
  status: string
}

export default function QuotationActions({ id, status }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function doAction(newStatus: "APPROVED" | "REJECTED") {
    if (!confirm(`Mark quotation ${id} as ${newStatus}?`)) return
    let adminNote: string | undefined
    if (newStatus === "REJECTED") {
      const note = window.prompt("Enter reason for rejection (recommended):")
      if (note === null) return // cancelled
      if (note.trim() === "") {
        // allow blank but confirm
        if (!confirm("Reject without a note? This will not provide context to the buyer.")) return
        adminNote = undefined
      } else {
        adminNote = note.trim()
      }
    } else {
      const note = window.prompt("Optional note for buyer:")
      if (note && note.trim() !== "") adminNote = note.trim()
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, adminNote }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) throw new Error(result.error || "Request failed")
      router.refresh()
    } catch (err) {
      // minimal UI feedback
      // eslint-disable-next-line no-alert
      alert((err as Error).message || "Unable to update quotation")
    } finally {
      setLoading(false)
    }
  }

  if (status !== "SUBMITTED") return null

  return (
    <div className="flex gap-2">
      <button
        onClick={() => doAction("APPROVED")}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success"
      >
        <Check className="w-3 h-3" /> Approve
      </button>
      <button
        onClick={() => doAction("REJECTED")}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-danger/10 px-3 py-2 text-xs font-medium text-danger"
      >
        <X className="w-3 h-3" /> Reject
      </button>
    </div>
  )
}
