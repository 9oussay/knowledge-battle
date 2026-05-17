"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  CreditCard,
  Home,
  LayoutDashboard,
  LogIn,
  Bell,
  Medal,
  Menu,
  MessageCircle,
  Shield,
  Swords,
  Trophy,
  UserPlus2,
  X,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/notification-bell"
import { BrandLogo } from "@/components/brand-logo"

type NavbarProps = {
  user?: {
    username: string
    isAdmin: boolean
    isSponsor: boolean
    isPremium: boolean
    premiumUntil: string | null
    premiumActive: boolean
  } | null
}

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  visibility: "all" | "guest" | "user" | "admin"
}

const primaryNavItems: NavItem[] = [
  { label: "Accueil", href: "/", icon: Home, visibility: "all" },
  { label: "Classement", href: "/leaderboard", icon: Trophy, visibility: "all" },
  { label: "Offres", href: "/billing", icon: CreditCard, visibility: "all" },
  { label: "Duel", href: "/duel", icon: Swords, visibility: "user" },
]

const secondaryNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visibility: "user" },
  { label: "Communauté", href: "/community", icon: MessageCircle, visibility: "user" },
  { label: "Badges", href: "/badges", icon: Medal, visibility: "user" },
  { label: "Inviter", href: "/invite", icon: UserPlus2, visibility: "user" },
  { label: "Notifications", href: "/notifications", icon: Bell, visibility: "user" },
  { label: "Admin", href: "/admin", icon: Shield, visibility: "admin" },
]

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const primaryLinks = useMemo(
    () =>
      primaryNavItems.filter((item) => {
        if (item.visibility === "all") return true
        if (item.visibility === "guest") return !user
        if (item.visibility === "admin") return !!user?.isAdmin
        return !!user
      }),
    [user],
  )

  const secondaryLinks = useMemo(
    () =>
      secondaryNavItems.filter((item) => {
        if (item.visibility === "all") return true
        if (item.visibility === "guest") return !user
        if (item.visibility === "admin") return !!user?.isAdmin
        return !!user
      }),
    [user],
  )

  return (
    <header className="mx-auto w-full max-w-7xl px-3 sm:px-6">
      <nav className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/80 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_24px_80px_-48px_rgba(0,0,0,0.9)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="pointer-events-none absolute -right-10 top-4 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-white/5 blur-3xl" />

        <div className="relative flex min-h-16 items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <Link href="/" className="group inline-flex items-center gap-3">
            <BrandLogo className="h-8 w-12 transition-transform duration-200 group-hover:scale-[1.03] sm:h-9 sm:w-14" />
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none text-foreground">Knowledge Battle</p>
              <p className="mt-1 text-[11px] leading-none text-muted-foreground">Play. Learn. Rank up.</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-border/70 bg-background/50 p-1 lg:flex">
            {primaryLinks.map((item) => {
              const Icon = item.icon
              const active = isRouteActive(pathname, item.href)
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-all",
                    active
                      ? "bg-card text-foreground shadow-[0_8px_24px_-16px_rgba(0,0,0,0.8)]"
                      : "text-muted-foreground hover:bg-background/70 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}

            {secondaryLinks.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="rounded-full px-4 text-muted-foreground hover:text-foreground">
                    Sections
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>Raccourcis</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {secondaryLinks.map((item) => {
                    const Icon = item.icon
                    return (
                      <DropdownMenuItem key={item.label} asChild>
                        <Link href={item.href} className="cursor-pointer">
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {user ? (
              <>
                <NotificationBell />
                <div className="hidden items-center gap-2 rounded-full border border-border/70 bg-background/50 px-3 py-1.5 text-sm text-muted-foreground shadow-sm xl:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {user.username}
                </div>
                <div className="hidden items-center gap-1.5 xl:flex">
                  {user.isSponsor && <Badge variant="secondary" className="rounded-full px-2.5">Sponsor</Badge>}
                  {user.premiumActive && <Badge className="rounded-full px-2.5">Premium</Badge>}
                </div>
                <form action="/api/auth/logout" method="post">
                  <Button
                    type="submit"
                    variant="ghost"
                    size="sm"
                    className="rounded-full text-muted-foreground hover:text-foreground"
                  >
                    Deconnexion
                  </Button>
                </form>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:text-foreground"
                >
                  <Link href="/login">
                    <LogIn className="mr-1.5 h-4 w-4" />
                    Connexion
                  </Link>
                </Button>
                <Button asChild size="sm" className="shimmer-btn rounded-full px-4">
                  <Link href="/register">Creer un compte</Link>
                </Button>
              </>
            )}
          </div>

          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border/60 bg-background/40 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Ouvrir le menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-border/70 bg-background/95 px-3 pb-3 pt-3 lg:hidden">
            <div className="rounded-2xl border border-border/70 bg-card/95 p-3 shadow-[0_18px_60px_-36px_rgba(0,0,0,0.9)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-3">
                <div className="inline-flex items-center gap-2">
                  <BrandLogo className="h-7 w-11" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Knowledge Battle</p>
                    <p className="text-[11px] text-muted-foreground">Navigation</p>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {primaryLinks.map((item) => {
                  const Icon = item.icon
                  const active = isRouteActive(pathname, item.href)

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "inline-flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all",
                        active
                          ? "border-primary/20 bg-primary/10 text-foreground"
                          : "border-border/60 bg-background/45 text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground",
                      )}
                    >
                      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  )
                })}
              </div>

              {secondaryLinks.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-border/70 bg-background/45 p-2">
                  <p className="px-2 py-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Raccourcis</p>
                  <div className="grid gap-1.5 sm:grid-cols-2">
                    {secondaryLinks.map((item) => {
                      const Icon = item.icon
                      const active = isRouteActive(pathname, item.href)

                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "inline-flex items-center gap-3 rounded-xl border px-3 py-3 text-sm transition-all",
                            active
                              ? "border-primary/20 bg-card text-foreground"
                              : "border-border/60 bg-background/45 text-muted-foreground hover:border-border/70 hover:bg-background/70 hover:text-foreground",
                          )}
                        >
                          <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              ) : null}

              <div className="mt-3 border-t border-border/70 pt-3">
                {user ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-border/70 bg-background/45 p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Connecté</p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{user.username}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {user.isSponsor ? (
                          <Badge variant="secondary" className="rounded-full px-2 text-[10px]">
                            Sponsor
                          </Badge>
                        ) : null}
                        {user.premiumActive ? (
                          <Badge className="rounded-full px-2 text-[10px]">Premium</Badge>
                        ) : null}
                      </div>
                    </div>
                    <form action="/api/auth/logout" method="post">
                      <Button type="submit" variant="outline" className="w-full rounded-xl bg-transparent">
                        Déconnexion
                      </Button>
                    </form>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button asChild variant="outline" className="w-full rounded-xl bg-transparent">
                      <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                        Connexion
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-xl">
                      <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                        Créer un compte
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
