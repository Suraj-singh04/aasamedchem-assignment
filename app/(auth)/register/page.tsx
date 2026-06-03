"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, FlaskConical } from "lucide-react"
import { registerSchema, type RegisterInput } from "@/lib/validation"

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterInput) {
    setError("")
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const json = await res.json()

      if (!json.success) {
        setError(json.error)
        return
      }

      router.push("/buyer/browse")
    } catch {
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-text-primary">AasaMedChem</h1>
          <p className="text-xs text-text-muted">B2B Pharma Procurement</p>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Create account</h2>
        <p className="text-sm text-text-secondary mt-1">Register as a buyer</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Full name
            </label>
            <input
              {...register("name")}
              placeholder="Dr. Rajesh Kumar"
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {errors.name && (
              <p className="text-danger text-xs mt-1.5">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Email address
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="you@company.com"
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {errors.email && (
              <p className="text-danger text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Company name
            </label>
            <input
              {...register("company")}
              placeholder="PharmaCo India Pvt. Ltd."
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Phone number
            </label>
            <input
              {...register("phone")}
              placeholder="+91-9800000000"
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              Password
            </label>
            <input
              {...register("password")}
              type="password"
              placeholder="Min. 8 characters"
              className="w-full px-3.5 py-2.5 bg-surface-2 border border-border rounded-xl text-text-primary placeholder:text-text-muted text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {errors.password && (
              <p className="text-danger text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 bg-danger/10 border border-danger/20 rounded-xl">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 px-4 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl text-sm transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-primary hover:text-primary-hover transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}