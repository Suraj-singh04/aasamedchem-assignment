export type Role = "ADMIN" | "BUYER"
export type Dimension = "WEIGHT" | "VOLUME" | "COUNT"
export type BaseUnit = "g" | "mL" | "unit"
export type QuotationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED"

// Unit labels shown in the UI per dimension
export const UNIT_OPTIONS: Record<Dimension, string[]> = {
  WEIGHT: ["g", "kg"],
  VOLUME: ["mL", "L"],
  COUNT: ["unit"],
}

export interface JwtPayload {
  sub: string        // user id
  email: string
  role: Role
  name: string
  iat?: number
  exp?: number
}

export interface ApiResponse<T = null> {
  success: boolean
  data?: T
  error?: string
  message?: string
}