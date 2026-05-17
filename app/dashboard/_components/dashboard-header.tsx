import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DashboardHeaderProps = {
  username: string
  rank: string
  planLabel: string
  isSponsor: boolean
  premiumActive: boolean
  isAdmin?: boolean
}

export function DashboardHeader({
  username,
  rank,
  planLabel,
  isSponsor,
  premiumActive,
  isAdmin = false,
}: DashboardHeaderProps) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-card/90 via-card/75 to-background/55 shadow-sm">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="pointer-events-none absolute -right-16 -top-14 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-white/5 blur-3xl" />

      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/55 px-4 py-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary pulse-glow" />
            Tableau de bord
          </div>

          <div className="space-y-3">
            <h1
              className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-cal-sans), sans-serif" }}
            >
              {username}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Vue d&apos;ensemble de ta progression, de tes derniers duels et des actions rapides, présentée comme une
              page d&apos;accueil compacte.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="rounded-full px-3 py-1">
              {rank}
            </Badge>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              {planLabel}
            </Badge>
            {isSponsor ? (
              <Badge variant="outline" className="rounded-full px-3 py-1">
                Sponsor
              </Badge>
            ) : null}
            {premiumActive ? <Badge className="rounded-full px-3 py-1">Premium</Badge> : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-primary") } />
              Suivi de progression en direct
            </span>
            <span className="inline-flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-primary") } />
              Matchs récents et score moyen
            </span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Button asChild size="sm" className="shimmer-btn h-11 rounded-full px-5">
            <Link href="/duel">Lancer un duel</Link>
          </Button>
          {isAdmin ? (
            <Button asChild variant="outline" size="sm" className="h-11 rounded-full border-border/60 bg-transparent px-5">
              <Link href="/admin">Admin</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
