"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Swords, Trophy } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ContentPanel } from "@/components/app/content-panel"
import { cn } from "@/lib/utils"

type Session = {
  id: string
  category: string
  score: number
  total: number
  xpEarned: number
  createdAt: Date
}

type DashboardPanelsProps = {
  sessions: Session[]
}

function timeAgo(date: Date) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (diff < 60) return `il y a ${diff}s`
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`
  return `il y a ${Math.floor(diff / 86400)} j`
}

export function DashboardPanels({ sessions }: DashboardPanelsProps) {
  const router = useRouter()

  return (
    <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <ContentPanel title="Derniers duels" description="Historique des parties récentes" className="xl:col-span-2">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/60 bg-background/35 px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
              <Swords className="h-6 w-6" />
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">Aucun duel pour le moment</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Lance une première partie pour alimenter ton historique.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Button className="rounded-full px-5" size="sm" onClick={() => router.push("/duel")}>
                Commencer un duel
              </Button>
              <Button asChild variant="outline" size="sm" className="rounded-full bg-transparent px-5">
                <Link href="/leaderboard">Voir le classement</Link>
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border/50">
            {sessions.map((session) => {
              const pct = Math.round((session.score / session.total) * 100)
              const isWin = pct >= 70

              return (
                <li
                  key={session.id}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-card/40"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={cn(
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border",
                        isWin
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-border/70 bg-card/70 text-muted-foreground",
                      )}
                    >
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{session.category}</p>
                        <Badge
                          variant={isWin ? "default" : "outline"}
                          className="h-5 rounded-full px-2.5 text-[10px] uppercase tracking-[0.18em]"
                        >
                          {isWin ? "Victoire" : "Défaite"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{timeAgo(session.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 text-sm">
                    <span className="tabular-nums text-muted-foreground">{pct}%</span>
                    <span className="rounded-full border border-border/60 bg-background/55 px-2.5 py-1 text-xs font-medium text-foreground">
                      +{session.xpEarned} XP
                    </span>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </ContentPanel>

      <ContentPanel title="Actions rapides" description="Raccourcis vers les sections principales">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <Button className="shimmer-btn h-11 justify-start rounded-full px-4" onClick={() => router.push("/duel") }>
            <Swords className="mr-2 h-4 w-4" />
            Nouveau duel
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start rounded-full border-border/60 bg-background/40 px-4">
            <Link href="/leaderboard">Classement</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start rounded-full border-border/60 bg-background/40 px-4">
            <Link href="/community">Communauté</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 justify-start rounded-full border-border/60 bg-background/40 px-4">
            <Link href="/badges">Mes badges</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
          En mode compétitif, les verdicts restent courts pour garder le rythme des matchs.
        </p>
      </ContentPanel>
    </section>
  )
}
