import { Trophy, Swords, Zap, Target } from "lucide-react"
import { MetricCard } from "@/components/app/metric-card"

type StatsGridProps = {
  xp: number
  totalDuels: number
  winRate: number
  avgScore: number
}

export function StatsGrid({ xp, totalDuels, winRate, avgScore }: StatsGridProps) {
  return (
    <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="XP total" value={xp} hint="Points d'expérience cumulés" icon={Zap} />
      <MetricCard label="Duels joués" value={totalDuels} hint="Parties enregistrées" icon={Swords} />
      <MetricCard label="Taux de victoire" value={`${winRate}%`} hint="Score ≥ 70 %" icon={Trophy} />
      <MetricCard label="Score moyen" value={`${avgScore}%`} hint="Moyenne sur tous les duels" icon={Target} />
    </section>
  )
}
