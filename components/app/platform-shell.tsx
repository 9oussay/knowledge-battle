"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { NotificationBell } from "@/components/notification-bell"
import { PlatformSidebar, type PlatformUser } from "@/components/app/platform-sidebar"

type PlatformShellProps = {
  children: React.ReactNode
  user: PlatformUser
}

function getRouteLabel(pathname: string) {
  if (pathname === "/dashboard") return "Dashboard"
  if (pathname === "/duel") return "Duel"
  if (pathname === "/leaderboard") return "Classement"
  if (pathname === "/community") return "Communauté"
  if (pathname === "/badges") return "Badges"
  if (pathname === "/invite") return "Inviter"
  if (pathname === "/billing") return "Offres"
  if (pathname === "/notifications") return "Notifications"
  if (pathname === "/admin") return "Admin"
  return "Workspace"
}

export function PlatformShell({ children, user }: PlatformShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const routeLabel = getRouteLabel(pathname)

  return (
    <div className="platform-shell min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <div className="hidden lg:block">
        <div className="sticky top-0 h-dvh">
          <PlatformSidebar user={user} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border/60 bg-card/65 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6 lg:px-6">
            <div className="flex items-center gap-3">
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl border-border/60 bg-background/60 shadow-sm lg:hidden"
                    aria-label="Menu"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Navigation</SheetTitle>
                  <PlatformSidebar user={user} onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
              </Sheet>
              <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/55 px-3 py-2 text-sm font-medium text-foreground shadow-sm lg:inline-flex">
                <span className="h-2 w-2 rounded-full bg-primary pulse-glow" />
                {routeLabel}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-background/55 px-3 py-1.5 text-sm text-muted-foreground shadow-sm md:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary pulse-glow" />
                    <span className="max-w-28 truncate">{user.username}</span>
                  </div>
                  <NotificationBell />
                </>
              ) : (
                <Button asChild size="sm" className="hidden rounded-full px-4 sm:inline-flex">
                  <Link href="/login">Connexion</Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        <main className="platform-main flex-1">{children}</main>
      </div>
    </div>
  )
}
