import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type PageContainerProps = {
  children: ReactNode
  className?: string
  size?: "md" | "lg" | "xl" | "full"
}

const sizeClass = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
  xl: "max-w-7xl",
  full: "max-w-none",
}

export function PageContainer({ children, className, size = "xl" }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full px-4 py-8 sm:px-6 lg:px-8", sizeClass[size], className)}>
      <div className="space-y-8">{children}</div>
    </div>
  )
}
