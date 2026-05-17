export type DuelDifficulty = "Easy" | "Medium" | "Hard"
export type DuelMatchMode = "private" | "random"
export type DuelOutcome = "host" | "guest" | "draw"

export type DuelQuestionSnapshot = {
  id: string
  category: string
  difficulty: DuelDifficulty | string
  question: string
  choices: string[]
  answer: number
  points: number
}

export const DUEL_RULES = {
  questionsPerDuel: 20,
  timerSeconds: 15,
  baseXpMultiplier: 2,
  winBonusXp: 40,
  drawBonusXp: 20,
  lossBonusXp: 10,
  perfectBonusXp: 25,
  roomCodeLength: 6,
  matchModes: ["private", "random"] as const,
  leaderboardScopes: ["global", "category"] as const,
} as const

export const RANK_STEPS = [
  { minXp: 0, rank: "Rookie" },
  { minXp: 100, rank: "Bronze" },
  { minXp: 300, rank: "Silver" },
  { minXp: 700, rank: "Gold" },
  { minXp: 1500, rank: "Legend" },
] as const

export function getRankFromXp(xp: number) {
  const sorted = [...RANK_STEPS].sort((left, right) => left.minXp - right.minXp)
  let current = sorted[0] ?? { rank: "Rookie" }

  for (const step of sorted) {
    if (xp >= step.minXp) {
      current = step
    }
  }

  return current.rank
}

export function generateRoomCode(length = DUEL_RULES.roomCodeLength) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""

  for (let index = 0; index < length; index += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)]
  }

  return code
}

export function getTotalPoints(questions: Pick<DuelQuestionSnapshot, "points">[]) {
  return questions.reduce((total, question) => total + question.points, 0)
}

export function getScoreFromAnswers(questions: DuelQuestionSnapshot[], answers: Array<number | null | undefined>) {
  return questions.reduce((total, question, index) => {
    return answers[index] === question.answer ? total + question.points : total
  }, 0)
}

export function getMatchOutcome(hostScore: number, guestScore: number): DuelOutcome {
  if (hostScore > guestScore) return "host"
  if (guestScore > hostScore) return "guest"
  return "draw"
}

export function getXpAward(options: {
  score: number
  total: number
  mode: "SOLO" | "MULTIPLAYER"
  outcome?: DuelOutcome
}) {
  const baseXp = options.score * DUEL_RULES.baseXpMultiplier
  const perfectBonus = options.total > 0 && options.score === options.total ? DUEL_RULES.perfectBonusXp : 0

  if (options.mode === "SOLO") {
    return baseXp + perfectBonus
  }

  const resultBonus =
    options.outcome === "host" || options.outcome === "guest"
      ? DUEL_RULES.winBonusXp
      : options.outcome === "draw"
        ? DUEL_RULES.drawBonusXp
        : DUEL_RULES.lossBonusXp

  return baseXp + perfectBonus + resultBonus
}