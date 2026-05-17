"use client"

import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type SelectionTileProps = {
  title: string
  description?: string
  selected?: boolean
  disabled?: boolean
  icon?: LucideIcon
  meta?: string
  onClick?: () => void
  className?: string
}

export function SelectionTile({
  title,
  description,
  selected,
  disabled,
  icon: Icon,
  meta,
  onClick,
  className,
}: SelectionTileProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
          : "border-border bg-card hover:border-border hover:bg-muted/30",
        disabled && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      {Icon ? (
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
            selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          {meta ? <span className="shrink-0 text-xs text-muted-foreground">{meta}</span> : null}
        </div>
        {description ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
    </button>
  )
}
