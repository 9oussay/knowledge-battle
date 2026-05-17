import { getScoreFromAnswers, getTotalPoints, type DuelQuestionSnapshot } from "@/lib/duel-rules"

export type MatchParticipantState = {
  userId: string
  username: string
  score: number
  total: number
  answers: Array<number | null>
  completed: boolean
  completedAt: string | null
  xpEarned: number | null
}

export type StoredMatchQuestion = DuelQuestionSnapshot

type MatchUser = {
  username: string
} | null | undefined

export type MatchRecord = {
  roomCode: string
  matchMode: string
  category: string
  difficulty: string
  status: string
  hostUserId: string
  guestUserId: string | null
  winnerUserId: string | null
  winnerUsername: string | null
  questionSnapshot: unknown
  hostState: unknown
  guestState: unknown
  hostUser?: MatchUser
  guestUser?: MatchUser
}

export type MatchView = {
  roomCode: string
  matchMode: string
  category: string
  difficulty: string
  status: string
  hostUsername: string
  guestUsername: string | null
  winnerUsername: string | null
  playerRole: "host" | "guest" | null
  canJoin: boolean
  questions: StoredMatchQuestion[]
  totalPoints: number
  hostState: MatchParticipantState | null
  guestState: MatchParticipantState | null
}

function normalizeQuestions(snapshot: unknown): StoredMatchQuestion[] {
  if (!Array.isArray(snapshot)) {
    return []
  }

  return snapshot
    .map((item) => {
      if (!item || typeof item !== "object") return null

      const question = item as Partial<StoredMatchQuestion>
      if (
        typeof question.id !== "string" ||
        typeof question.category !== "string" ||
        typeof question.question !== "string" ||
        !Array.isArray(question.choices) ||
        typeof question.answer !== "number" ||
        typeof question.points !== "number"
      ) {
        return null
      }

      return {
        id: question.id,
        category: question.category,
        difficulty: question.difficulty ?? "Medium",
        question: question.question,
        choices: question.choices,
        answer: question.answer,
        points: question.points,
      }
    })
    .filter((value): value is StoredMatchQuestion => Boolean(value))
}

function normalizeParticipantState(value: unknown): MatchParticipantState | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const state = value as Partial<MatchParticipantState>
  if (
    typeof state.userId !== "string" ||
    typeof state.username !== "string" ||
    typeof state.score !== "number" ||
    typeof state.total !== "number" ||
    !Array.isArray(state.answers)
  ) {
    return null
  }

  return {
    userId: state.userId,
    username: state.username,
    score: state.score,
    total: state.total,
    answers: state.answers.map((answer) => (typeof answer === "number" ? answer : null)),
    completed: Boolean(state.completed),
    completedAt: typeof state.completedAt === "string" ? state.completedAt : null,
    xpEarned: typeof state.xpEarned === "number" ? state.xpEarned : null,
  }
}

export function createParticipantState(userId: string, username: string, questions: StoredMatchQuestion[]) {
  return {
    userId,
    username,
    score: 0,
    total: getTotalPoints(questions),
    answers: new Array(questions.length).fill(null) as Array<number | null>,
    completed: false,
    completedAt: null,
    xpEarned: null,
  }
}

export function createQuestionSnapshot(questions: DuelQuestionSnapshot[]) {
  return questions.map((question) => ({
    id: question.id,
    category: question.category,
    difficulty: question.difficulty,
    question: question.question,
    choices: question.choices,
    answer: question.answer,
    points: question.points,
  }))
}

export function scoreMatchAnswers(questions: StoredMatchQuestion[], answers: Array<number | null | undefined>) {
  return getScoreFromAnswers(questions, answers)
}

export function buildMatchView(match: MatchRecord, currentUserId: string | null): MatchView {
  const questions = normalizeQuestions(match.questionSnapshot)
  const hostState = normalizeParticipantState(match.hostState)
  const guestState = normalizeParticipantState(match.guestState)
  const playerRole = currentUserId === match.hostUserId ? "host" : currentUserId === match.guestUserId ? "guest" : null

  return {
    roomCode: match.roomCode,
    matchMode: match.matchMode,
    category: match.category,
    difficulty: match.difficulty,
    status: match.status,
    hostUsername: match.hostUser?.username ?? hostState?.username ?? "Host",
    guestUsername: match.guestUser?.username ?? guestState?.username ?? null,
    winnerUsername: match.winnerUsername ?? null,
    playerRole,
    canJoin: !match.guestUserId && match.status !== "FINISHED",
    questions: playerRole ? questions : [],
    totalPoints: getTotalPoints(questions),
    hostState,
    guestState,
  }
}