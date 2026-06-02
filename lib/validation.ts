import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  company: z.string().optional(),
  phone: z.string().optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(2, "SKU is required"),
  casNumber: z.string().optional(),
  description: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  grade: z.string().min(1, "Grade is required"),
  purity: z.string().optional(),
  dimension: z.enum(["WEIGHT", "VOLUME", "COUNT"]),
  baseUnit: z.enum(["g", "mL", "unit"]),
  pricePerBase: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) > 0, {
    message: "Price must be a positive number",
  }),
  stockQty: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Stock must be a non-negative number",
  }),
  minOrderQty: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Min order qty must be a non-negative number",
  }),
  reorderLevel: z.string().refine((v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0, {
    message: "Reorder level must be a non-negative number",
  }),
})

export const quotationSchema = z.object({
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, "Product is required"),
    orderedQtyDisplay: z.number().positive("Quantity must be positive"),
    orderedUnit: z.string().min(1, "Unit is required"),
  })).min(1, "At least one item is required"),
})

export const quotationStatusSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProductInput = z.infer<typeof productSchema>
export type QuotationInput = z.infer<typeof quotationSchema>
export type QuotationStatusInput = z.infer<typeof quotationStatusSchema>