"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  CreditCard,
  LayoutDashboard,
  LogIn,
  Medal,
  MessageCircle,
  Shield,
  Swords,
  Trophy,
  UserPlus2,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrandLogo } from "@/components/brand-logo"

export type PlatformUser = {
  username: string
  isAdmin: boolean
  isSponsor: boolean
  isPremium: boolean
  premiumUntil: string | null
  premiumActive: boolean
} | null

type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  requiresAuth?: boolean
  adminOnly?: boolean
}

const navSections: { title: string; items: NavItem[] }[] = [
  {
    title: "Jouer",
    items: [
      { label: "Duel", href: "/duel", icon: Swords, requiresAuth: true },
      { label: "Classement", href: "/leaderboard", icon: Trophy },
    ],
  },
  {
    title: "Progression",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, requiresAuth: true },
      { label: "Badges", href: "/badges", icon: Medal, requiresAuth: true },
    ],
  },
  {
    title: "Communauté",
    items: [
      { label: "Chat", href: "/community", icon: MessageCircle, requiresAuth: true },
      { label: "Inviter", href: "/invite", icon: UserPlus2, requiresAuth: true },
    ],
  },
  {
    title: "Compte",
    items: [
      { label: "Offres", href: "/billing", icon: CreditCard, requiresAuth: true },
      { label: "Notifications", href: "/notifications", icon: Bell, requiresAuth: true },
    ],
  },
]

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

type PlatformSidebarProps = {
  user: PlatformUser
  onNavigate?: () => void
}

export function PlatformSidebar({ user, onNavigate }: PlatformSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="relative flex h-full flex-col overflow-hidden border-r border-border/60 bg-card/75 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent" />

      <div className="relative border-b border-border/60 p-4">
        <Link
          href={user ? "/dashboard" : "/"}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/55 px-3 py-3 shadow-sm transition-colors hover:bg-background/70"
        >
          <BrandLogo className="h-8 w-12" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">Knowledge Battle</p>
            <p className="truncate text-[11px] text-muted-foreground">Plateforme joueur</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {navSections.map((section) => {
          const items = section.items.filter((item) => {
            if (item.adminOnly) return user?.isAdmin
            if (item.requiresAuth) return !!user
            return true
          })

          if (items.length === 0) return null

          return (
            <div key={section.title} className="mb-5 last:mb-0">
              <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                {section.title}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const active = isActive(pathname, item.href)

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                          active
                            ? "border-primary/15 bg-primary/8 text-foreground"
                            : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/60 hover:text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                            active
                              ? "border-primary/20 bg-primary/10 text-primary"
                              : "border-border/60 bg-background/60 text-muted-foreground group-hover:border-primary/15 group-hover:bg-primary/5 group-hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}

        {user?.isAdmin ? (
          <div className="mb-5 rounded-2xl border border-border/60 bg-background/45 p-2.5 last:mb-0">
            <p className="px-2 pb-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Admin</p>
            <Link
              href="/admin"
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                isActive(pathname, "/admin")
                  ? "border-primary/15 bg-primary/8 text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border/60 hover:bg-background/60 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition-colors",
                  isActive(pathname, "/admin")
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border/60 bg-background/60 text-muted-foreground group-hover:border-primary/15 group-hover:bg-primary/5 group-hover:text-foreground",
                )}
              >
                <Shield className="h-4 w-4" />
              </span>
              <span className="truncate font-medium">Console admin</span>
            </Link>
          </div>
        ) : null}
      </nav>

      <div className="border-t border-border/60 p-3">
        {user ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-background/50 p-3 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Connecté</p>
              <p className="mt-1 truncate text-sm font-semibold text-foreground">{user.username}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.premiumActive ? (
                  <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
                    Premium
                  </Badge>
                ) : null}
                {user.isSponsor ? (
                  <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px]">
                    Sponsor
                  </Badge>
                ) : null}
              </div>
            </div>
            <form action="/api/auth/logout" method="post">
              <Button type="submit" variant="outline" size="sm" className="h-10 w-full rounded-xl bg-transparent">
                Déconnexion
              </Button>
            </form>
          </div>
        ) : (
          <div className="space-y-2">
            <Button asChild variant="outline" size="sm" className="h-10 w-full rounded-xl bg-transparent">
              <Link href="/login" onClick={onNavigate}>
                <LogIn className="mr-2 h-4 w-4" />
                Connexion
              </Link>
            </Button>
            <Button asChild size="sm" className="h-10 w-full rounded-xl">
              <Link href="/register" onClick={onNavigate}>
                Créer un compte
              </Link>
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
