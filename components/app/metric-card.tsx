import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type MetricCardProps = {
  label: string
  value: string | number
  hint?: string
  icon?: LucideIcon
  className?: string
}

export function MetricCard({ label, value, hint, icon: Icon, className }: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:border-ring/60 hover:scale-[1.02]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
          <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight text-foreground sm:text-4xl">
            {value}
          </p>
          {hint ? <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground transition-colors group-hover:text-foreground">
            <Icon className="h-4.5 w-4.5" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
