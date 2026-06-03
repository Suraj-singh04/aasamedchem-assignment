import { cn } from "@/lib/utils"

type BadgeVariant = "default" | "success" | "warning" | "danger" | "accent"

const variants: Record<BadgeVariant, string> = {
  default: "bg-white/10 text-text-secondary border-white/10",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger:  "bg-danger/10 text-danger border-danger/20",
  accent:  "bg-accent/10 text-accent border-accent/20",
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}