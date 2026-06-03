"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getAllowedUnits } from "@/lib/units"

type ProductLite = {
  id: string
  name: string
  baseUnit: string
  dimension: string
  // Prisma Decimal may be passed; accept number|string|object with toString
  minOrderQty?: number | string | { toString(): string }
}

export default function RequestQuote({ product }: { product: ProductLite }) {
  const [qty, setQty] = useState<string>(String(product.minOrderQty ?? 1))
  const units = getAllowedUnits(product.dimension as any)
  const [unit, setUnit] = useState<string>(product.baseUnit || units[0])

  function addToCart() {
    const parsedQty = Number(qty)
    if (!parsedQty || parsedQty <= 0) return alert("Enter a valid quantity")

    try {
      const key = "rfq_cart"
      const raw = localStorage.getItem(key)
      const cart = raw ? JSON.parse(raw) : []

      // if same product+unit exists, increase qty
      const exist = cart.find((it: any) => it.productId === product.id && it.orderedUnit === unit)
      if (exist) {
        exist.orderedQtyDisplay = Number(exist.orderedQtyDisplay) + parsedQty
      } else {
        cart.push({
          productId: product.id,
          productName: product.name,
          orderedQtyDisplay: parsedQty,
          orderedUnit: unit,
        })
      }

      localStorage.setItem(key, JSON.stringify(cart))
      // notify other components in this window to refresh their view of the cart
      window.dispatchEvent(new Event("rfq_cart_updated"))
      alert("Added to RFQ cart")
    } catch (err) {
      console.error(err)
      alert("Failed to add to RFQ cart")
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-col sm:flex-row items-center gap-2">
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-full sm:w-24 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none"
          aria-label={`Quantity for ${product.name}`}
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="w-full sm:w-auto rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-text-primary outline-none"
          aria-label={`Unit for ${product.name}`}
        >
          {units.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        <button
          onClick={addToCart}
          className="w-full sm:w-auto mt-2 sm:mt-0 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover"
        >
          Add to RFQ
        </button>
      </div>
    </div>
  )
}
