export type BadgeDefinition = {
  id: string
  name: string
  description: string
  icon: string
}

export const BADGES: BadgeDefinition[] = [
  { id: "first_duel", name: "Premier duel", description: "Jouer votre tout premier duel.", icon: "⚔️" },
  { id: "xp_100", name: "XP 100", description: "Atteindre 100 XP au total.", icon: "✨" },
  { id: "xp_500", name: "XP 500", description: "Atteindre 500 XP au total.", icon: "🚀" },
  { id: "win_streak_3", name: "Série x3", description: "Remporter 3 duels d'affilée.", icon: "🔥" },
  { id: "perfectionist", name: "Perfectionniste", description: "Terminer un duel avec 100%.", icon: "🎯" },
  { id: "veteran_10", name: "Vétéran", description: "Jouer 10 duels.", icon: "🏅" },
]

type SessionLike = {
  score: number
  total: number
}

export function getEarnedBadgeIds(xp: number, sessions: SessionLike[]) {
  const earned = new Set<string>()
  if (sessions.length >= 1) earned.add("first_duel")
  if (sessions.length >= 10) earned.add("veteran_10")
  if (xp >= 100) earned.add("xp_100")
  if (xp >= 500) earned.add("xp_500")
  if (sessions.some((s) => s.total > 0 && s.score === s.total)) earned.add("perfectionist")

  let streak = 0
  for (const session of sessions) {
    const ratio = session.total > 0 ? session.score / session.total : 0
    if (ratio >= 0.7) {
      streak += 1
      if (streak >= 3) {
        earned.add("win_streak_3")
        break
      }
    } else {
      streak = 0
    }
  }

  return earned
}
