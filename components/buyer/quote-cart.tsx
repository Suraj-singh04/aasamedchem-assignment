"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getAllowedUnits } from "@/lib/units"

type CartItem = {
  productId: string
  productName: string
  orderedQtyDisplay: number
  orderedUnit: string
}

export default function QuoteCart() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [note, setNote] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("rfq_cart")
    if (raw) {
      try {
        setItems(JSON.parse(raw))
      } catch (err) {
        console.error(err)
      }
    }
  }, [])

  // Listen for cart updates from other components (same window)
  useEffect(() => {
    function handleUpdate() {
      const raw = localStorage.getItem("rfq_cart")
      if (raw) {
        try {
          setItems(JSON.parse(raw))
        } catch (err) {
          console.error(err)
        }
      } else {
        setItems([])
      }
    }

    window.addEventListener("rfq_cart_updated", handleUpdate)
    return () => window.removeEventListener("rfq_cart_updated", handleUpdate)
  }, [])

  useEffect(() => {
    localStorage.setItem("rfq_cart", JSON.stringify(items))
  }, [items])

  function updateItem(index: number, patch: Partial<CartItem>) {
    setItems((prev) => {
      const copy = [...prev]
      copy[index] = { ...copy[index], ...patch }
      return copy
    })
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  async function submitRFQ() {
    if (items.length === 0) return alert("Add items to the RFQ before submitting")
    setLoading(true)
    try {
      const body = {
        notes: note,
        items: items.map((it) => ({
          productId: it.productId,
          orderedQtyDisplay: Number(it.orderedQtyDisplay),
          orderedUnit: it.orderedUnit,
        })),
      }

      const res = await fetch("/api/buyer/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()
      if (!res.ok) {
        console.error(data)
        alert(data.error || "Failed to submit RFQ")
        return
      }

      // clear cart and navigate to my-quotations
      localStorage.removeItem("rfq_cart")
      router.push("/buyer/my-quotations")
    } catch (err) {
      console.error(err)
      alert("Failed to submit RFQ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-text-primary">RFQ cart</h3>
      <p className="mt-1 text-xs text-text-muted">Add items from the catalog and submit a single request.</p>

      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-text-muted">No items added.</p>
        ) : (
          items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="rounded-xl bg-surface-2 p-3">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-text-primary">{item.productName}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={item.orderedQtyDisplay}
                      onChange={(e) => updateItem(idx, { orderedQtyDisplay: Number(e.target.value) })}
                      className="w-20 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
                    />
                    <select
                      value={item.orderedUnit}
                      onChange={(e) => updateItem(idx, { orderedUnit: e.target.value })}
                      className="rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
                    >
                      {getAllowedUnits("WEIGHT" as any).map((u) => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button onClick={() => removeItem(idx)} className="text-sm text-danger">Remove</button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4">
        <label className="block text-xs text-text-secondary">Note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any details, urgency, or packaging preferences"
          className="mt-2 w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm outline-none"
          rows={3}
        />
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={submitRFQ} disabled={loading} className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60">
          {loading ? "Submitting…" : "Submit RFQ"}
        </button>
        <button onClick={() => { localStorage.removeItem("rfq_cart"); setItems([]); setNote("") }} className="rounded-xl border border-border px-4 py-2 text-sm">
          Clear
        </button>
      </div>
    </div>
  )
}
