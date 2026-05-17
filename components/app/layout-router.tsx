"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { SiteBackground } from "@/components/site-background"
import { PlatformShell } from "@/components/app/platform-shell"
import type { PlatformUser } from "@/components/app/platform-sidebar"

const MARKETING_PATHS = new Set(["/"])
const AUTH_PATHS = new Set(["/login", "/register"])

type LayoutRouterProps = {
  children: React.ReactNode
  user: PlatformUser
}

export function LayoutRouter({ children, user }: LayoutRouterProps) {
  const pathname = usePathname()
  const isMarketing = MARKETING_PATHS.has(pathname)
  const isAuth = AUTH_PATHS.has(pathname)

  if (isMarketing) {
    return (
      <>
        <SiteBackground />
        <div className="noise-overlay marketing-noise" aria-hidden="true" />
        <div className="site-chrome">
          <Navbar user={user} />
        </div>
        {children}
      </>
    )
  }

  if (isAuth) {
    return <div className="auth-canvas">{children}</div>
  }

  return (
    <PlatformShell user={user}>
      <div className="noise-overlay platform-noise" aria-hidden="true" />
      {children}
    </PlatformShell>
  )
}
