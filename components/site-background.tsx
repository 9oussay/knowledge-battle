"use client"

import ColorBends from "@/components/ColorBends"

export function SiteBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      <ColorBends
        rotation={90}
        speed={0.2}
        colors={["#DC2626", "#FF9F9F"]}
        transparent
        autoRotate={0}
        scale={1}
        frequency={1}
        warpStrength={1}
        mouseInfluence={1}
        parallax={0.5}
        noise={0.15}
        iterations={1}
        intensity={1.5}
        bandWidth={6}
      />
      <div className="absolute inset-0 bg-background/55" />
    </div>
  )
}
