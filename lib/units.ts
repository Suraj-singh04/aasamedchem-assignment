import type { Dimension, BaseUnit } from "@/types"

const CONVERSION_FACTORS: Record<string, number> = {
  g: 1,
  kg: 1000,
  mL: 1,
  L: 1000,
  unit: 1,
}


export function toBaseUnit(qty: number, unit: string): number {
  const factor = CONVERSION_FACTORS[unit]
  if (!factor) throw new Error(`Unknown unit: ${unit}`)
  return qty * factor
}

export function fromBaseUnit(baseQty: number, unit: string): number {
  const factor = CONVERSION_FACTORS[unit]
  if (!factor) throw new Error(`Unknown unit: ${unit}`)
  return baseQty / factor
}


export function calcLineTotal(orderedQtyBase: number, pricePerBase: number): number {
  return orderedQtyBase * pricePerBase
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getPriceDisplayLabel(pricePerBase: number, baseUnit: BaseUnit): string {
  switch (baseUnit) {
    case "g":
      return `${formatINR(pricePerBase * 1000)} / kg`
    case "mL":
      return `${formatINR(pricePerBase * 1000)} / L`
    case "unit":
      return `${formatINR(pricePerBase)} / unit`
  }
}

export function isValidUnitForDimension(unit: string, dimension: Dimension): boolean {
  const validUnits: Record<Dimension, string[]> = {
    WEIGHT: ["g", "kg"],
    VOLUME: ["mL", "L"],
    COUNT: ["unit"],
  }
  return validUnits[dimension].includes(unit)
}

export function getAllowedUnits(dimension: Dimension): string[] {
  const units: Record<Dimension, string[]> = {
    WEIGHT: ["g", "kg"],
    VOLUME: ["mL", "L"],
    COUNT: ["unit"],
  }
  return units[dimension]
}