import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser } from "@/lib/session"
import { BADGES, getEarnedBadgeIds } from "@/lib/badges"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { ContentPanel } from "@/components/app/content-panel"
import { Badge } from "@/components/ui/badge"

export default async function BadgesPage() {
  const user = await getCurrentSessionUser()
  if (!user) redirect("/login")

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      xp: true,
      sessions: {
        orderBy: { createdAt: "asc" },
        select: { score: true, total: true },
      },
    },
  })
  if (!profile) redirect("/login")

  const earned = getEarnedBadgeIds(profile.xp, profile.sessions)

  return (
    <PageContainer size="lg">
      <PageHeader
        eyebrow="Progression"
        title="Mes badges"
        description="Achievements débloqués en jouant et en progressant."
      />

      <ContentPanel>
        <div className="grid gap-3 sm:grid-cols-2">
          {BADGES.map((badge) => {
            const unlocked = earned.has(badge.id)
            return (
              <div
                key={badge.id}
                className={`rounded-md border px-4 py-3 ${
                  unlocked ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">
                    <span className="mr-2">{badge.icon}</span>
                    {badge.name}
                  </p>
                  <Badge variant={unlocked ? "default" : "outline"}>
                    {unlocked ? "Débloqué" : "Verrouillé"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{badge.description}</p>
              </div>
            )
          })}
        </div>
      </ContentPanel>
    </PageContainer>
  )
}
