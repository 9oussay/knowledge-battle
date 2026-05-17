import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth"
import { isAdminRole } from "@/lib/session"
import { getPlanLabel } from "@/lib/entitlements"
import { PageContainer } from "@/components/app/page-container"
import { DashboardHeader } from "./_components/dashboard-header"
import { StatsGrid } from "./_components/stats-grid"
import { DashboardPanels } from "./_components/dashboard-panels"

async function getSessionUser() {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const session = await verifySessionToken(token)

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rank: true,
        xp: true,
        isSponsor: true,
        isPremium: true,
        premiumUntil: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            category: true,
            score: true,
            total: true,
            xpEarned: true,
            createdAt: true,
          },
        },
      },
    })

    return user
  } catch {
    return null
  }
}

export default async function DashboardPage() {
  const user = await getSessionUser()
  if (!user) redirect("/login")

  const premiumActive = user.isPremium && (!user.premiumUntil || user.premiumUntil > new Date())
  const sessions = user.sessions ?? []
  const totalDuels = sessions.length
  const wins = sessions.filter((s) => s.score / s.total >= 0.7).length
  const winRate = totalDuels > 0 ? Math.round((wins / totalDuels) * 100) : 0
  const avgScore =
    totalDuels > 0
      ? Math.round(sessions.reduce((acc, s) => acc + Math.round((s.score / s.total) * 100), 0) / totalDuels)
      : 0
  const planLabel = getPlanLabel({
    isSponsor: user.isSponsor,
    isPremium: user.isPremium,
    premiumUntil: user.premiumUntil,
  })

  return (
    <PageContainer size="xl" className="relative py-6 sm:py-8 lg:py-10">
      <div className="pointer-events-none absolute inset-x-0 -top-16 h-72 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

      <div className="relative space-y-8 sm:space-y-10">
        <DashboardHeader
          username={user.username}
          rank={user.rank}
          planLabel={planLabel}
          isSponsor={user.isSponsor}
          premiumActive={premiumActive}
          isAdmin={isAdminRole((user.role ?? "USER") as "USER" | "ADMIN")}
        />
        <StatsGrid xp={user.xp} totalDuels={totalDuels} winRate={winRate} avgScore={avgScore} />
        <DashboardPanels sessions={sessions} />
      </div>
    </PageContainer>
  )
}
