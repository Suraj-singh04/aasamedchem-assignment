import { cn } from "@/lib/utils"

export function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string
  value: string | number
  icon?: React.ReactNode
  accent?: boolean
}) {
  return (
    <div className={cn(
      "rounded-xl border p-5 flex flex-col gap-3",
      "bg-surface border-border",
      accent && "border-primary/30 bg-primary/5"
    )}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">{label}</span>
        {icon && (
          <span className="text-text-muted">{icon}</span>
        )}
      </div>
      <span className="text-2xl font-semibold text-text-primary">{value}</span>
    </div>
  )
}