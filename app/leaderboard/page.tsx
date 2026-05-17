import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { ContentPanel } from "@/components/app/content-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LeaderboardLiveRefresh } from "./_components/leaderboard-live-refresh"

type LeaderboardPageProps = {
  searchParams?: {
    scope?: string
    category?: string
  }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const scope = searchParams?.scope === "category" ? "category" : "global"
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { name: true, slug: true, description: true },
  })

  const selectedCategory =
    scope === "category"
      ? categories.find((c) => c.slug === searchParams?.category || c.name === searchParams?.category) ??
        categories[0] ??
        null
      : null

  const categorySessionWhere = selectedCategory ? { category: selectedCategory.name } : undefined
  const playerWhere =
    scope === "category" && selectedCategory
      ? {
          sessions: {
            some: {
              category: selectedCategory.name,
            },
          },
        }
      : undefined

  const players = await prisma.user.findMany({
    where: playerWhere,
    orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
    take: scope === "global" ? 50 : undefined,
    select: {
      id: true,
      username: true,
      rank: true,
      xp: true,
      sessions: {
        where: categorySessionWhere,
        orderBy: { createdAt: "desc" },
        select: { category: true, score: true, total: true, xpEarned: true },
      },
    },
  })

  const rows = players
    .map((player) => {
      const totalDuels = player.sessions.length
      const wins = player.sessions.filter((s) => s.total > 0 && s.score / s.total >= 0.7).length
      const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0
      const displayXp =
        scope === "category" ? player.sessions.reduce((t, s) => t + s.xpEarned, 0) : player.xp

      return { ...player, totalDuels, wins, winRate, displayXp }
    })
    .sort(
      (a, b) =>
        b.displayXp - a.displayXp || b.wins - a.wins || a.username.localeCompare(b.username),
    )

  const visibleRows = rows.slice(0, 50)

  return (
    <PageContainer size="lg">
      <LeaderboardLiveRefresh />
      <PageHeader
        eyebrow="Classement"
        title={scope === "category" && selectedCategory ? selectedCategory.name : "Top joueurs"}
        description={
          scope === "category" && selectedCategory
            ? "Classement filtré par catégorie, basé sur l'XP gagnée dans ce thème."
            : "Les 50 meilleurs joueurs classés par XP global."
        }
      />

      <ContentPanel>
        <div className="mb-5 flex flex-wrap gap-2">
          <Button asChild variant={scope === "global" ? "default" : "outline"} size="sm">
            <Link href="/leaderboard">Global</Link>
          </Button>
          <Button asChild variant={scope === "category" ? "default" : "outline"} size="sm">
            <Link href="/leaderboard?scope=category">Par catégorie</Link>
          </Button>
          {scope === "category"
            ? categories.map((category) => (
                <Button
                  key={category.slug}
                  asChild
                  variant={selectedCategory?.slug === category.slug ? "default" : "outline"}
                  size="sm"
                >
                  <Link href={`/leaderboard?scope=category&category=${category.slug}`}>{category.name}</Link>
                </Button>
              ))
            : null}
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Joueur</th>
                <th className="px-4 py-3 font-medium">Rang</th>
                <th className="px-4 py-3 font-medium">Duels</th>
                <th className="px-4 py-3 font-medium">Win rate</th>
                <th className="px-4 py-3 font-medium text-right">XP</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((player, index) => (
                <tr
                  key={player.id}
                  className={cn(
                    "border-b border-border last:border-0",
                    index < 3 && "bg-primary/[0.03]",
                  )}
                >
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {player.username}
                    {index < 3 ? (
                      <Badge variant="secondary" className="ml-2 h-5 text-[10px]">
                        Top {index + 1}
                      </Badge>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{player.rank}</Badge>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{player.totalDuels}</td>
                  <td className="px-4 py-3 tabular-nums text-muted-foreground">{player.winRate}%</td>
                  <td className="px-4 py-3 text-right tabular-nums font-medium">{player.displayXp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentPanel>
    </PageContainer>
  )
}
