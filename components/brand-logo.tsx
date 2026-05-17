"use client"

import Image from "next/image"

import { cn } from "@/lib/utils"

type BrandLogoProps = {
  className?: string
}

export function BrandLogo({ className }: BrandLogoProps) {
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden", className)}>
      <Image
        src="/logo.png"
        alt="Knowledge Battle"
        fill
        sizes="48px"
        className="object-contain object-center"
        style={{ transform: "scale(5)", transformOrigin: "center" }}
      />
    </span>
  )
}