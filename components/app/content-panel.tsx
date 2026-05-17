import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type ContentPanelProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  headerAction?: ReactNode
}

export function ContentPanel({ title, description, children, className, headerAction }: ContentPanelProps) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-ring/60",
        className,
      )}
    >
      {title ? (
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h2>
            {description ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
          </div>
          {headerAction ? <div className="shrink-0">{headerAction}</div> : null}
        </div>
      ) : null}
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}
