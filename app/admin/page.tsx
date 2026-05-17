import Link from "next/link"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser, isAdminRole } from "@/lib/session"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminConsole } from "./_components/admin-console"

export default async function AdminPage() {
  const user = await getCurrentSessionUser()
  if (!user) redirect("/login")
  if (!isAdminRole(user.role)) redirect("/dashboard")

  const [users, categories, questions, recentSessions] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        rank: true,
        xp: true,
        isSponsor: true,
        createdAt: true,
        sessions: {
          select: { id: true },
        },
      },
    }),
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
      },
    }),
    prisma.question.findMany({
      take: 200,
      orderBy: { id: "desc" },
      select: {
        id: true,
        category: true,
        difficulty: true,
        question: true,
        choices: true,
        answer: true,
        points: true,
      },
    }),
    prisma.duelSession.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        category: true,
        score: true,
        total: true,
        xpEarned: true,
        createdAt: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    }),
  ])

  const counts = new Map<string, number>()
  for (const question of questions) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
  }

  const normalizedUsers = users.map((item) => ({
    id: item.id,
    username: item.username,
    email: item.email,
    role: (item.role ?? "USER") as "USER" | "ADMIN",
    rank: item.rank,
    xp: item.xp,
    isSponsor: item.isSponsor,
    sessionsCount: item.sessions.length,
    createdAt: item.createdAt.toISOString(),
  }))

  const normalizedCategories = categories.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    isActive: item.isActive,
    questionCount: counts.get(item.name) ?? 0,
    createdAt: item.createdAt.toISOString(),
  }))

  const normalizedRecentSessions = recentSessions.map((item) => ({
    id: item.id,
    category: item.category,
    score: item.score,
    total: item.total,
    xpEarned: item.xpEarned,
    username: item.user.username,
    createdAt: item.createdAt.toISOString(),
  }))

  return (
    <main className="app-page bg-transparent px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
        <Card className="bg-card/70 backdrop-blur-sm border-border/80">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>Admin Dashboard</CardTitle>
              <CardDescription>Pilotage avance de la plateforme.</CardDescription>
            </div>
            <Button asChild variant="outline" className="rounded-full bg-transparent">
              <Link href="/dashboard">Retour dashboard</Link>
            </Button>
          </CardHeader>
        </Card>

        <AdminConsole
          initialUsers={normalizedUsers}
          initialCategories={normalizedCategories}
          initialQuestions={questions}
          initialRecentSessions={normalizedRecentSessions}
        />
      </div>
    </main>
  )
}
