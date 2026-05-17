import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser } from "@/lib/session"
import { DUEL_RULES, generateRoomCode, type DuelQuestionSnapshot } from "@/lib/duel-rules"
import { createParticipantState, createQuestionSnapshot } from "@/lib/duel-match"
import { abandonEmptyRandomRoom, claimRandomMatchWithRetry } from "@/lib/duel-queue"
import { createNotification } from "@/lib/notifications"
import { emitMatchStateToParticipants } from "@/lib/realtime"

const createMatchSchema = z.object({
  category: z.string().trim().min(2).max(80),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  mode: z.enum(["private", "random"]).default("private"),
})

const matchSelect = {
  roomCode: true,
  matchMode: true,
  category: true,
  difficulty: true,
  status: true,
  hostUserId: true,
  guestUserId: true,
  winnerUserId: true,
  winnerUsername: true,
  questionSnapshot: true,
  hostState: true,
  guestState: true,
  hostUser: { select: { username: true } },
  guestUser: { select: { username: true } },
} as const

function shuffleQuestions(questions: DuelQuestionSnapshot[]) {
  const shuffled = [...questions]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    const current = shuffled[index]
    shuffled[index] = shuffled[randomIndex]
    shuffled[randomIndex] = current
  }

  return shuffled
}

async function createUniqueRoomCode() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const roomCode = generateRoomCode()
    const existing = await prisma.duelMatch.findUnique({ where: { roomCode }, select: { id: true } })
    if (!existing) {
      return roomCode
    }
  }

  throw new Error("Unable to generate a unique room code")
}

export async function POST(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json()
  const parsed = createMatchSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid match payload" }, { status: 400 })
  }

  const questions = await prisma.question.findMany({
    where: {
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
    },
    select: {
      id: true,
      category: true,
      difficulty: true,
      question: true,
      choices: true,
      answer: true,
      points: true,
    },
  })

  if (questions.length === 0) {
    return NextResponse.json({ error: "No questions found for this category" }, { status: 404 })
  }

  const pickedQuestions = shuffleQuestions(questions).slice(0, DUEL_RULES.questionsPerDuel)

  if (parsed.data.mode === "random") {
    let matchedRoomCode = await claimRandomMatchWithRetry(user, parsed.data.category, parsed.data.difficulty)

    if (!matchedRoomCode) {
      const ownRoomCode = await createUniqueRoomCode()
      const questionSnapshot = createQuestionSnapshot(pickedQuestions)

      await prisma.duelMatch.create({
        data: {
          roomCode: ownRoomCode,
          matchMode: "random",
          category: parsed.data.category,
          difficulty: parsed.data.difficulty,
          status: "WAITING",
          hostUserId: user.id,
          questionSnapshot,
          hostState: createParticipantState(user.id, user.username, questionSnapshot),
        },
      })

      matchedRoomCode = await claimRandomMatchWithRetry(user, parsed.data.category, parsed.data.difficulty)
      if (matchedRoomCode && matchedRoomCode !== ownRoomCode) {
        await abandonEmptyRandomRoom(ownRoomCode, user.id)
      } else {
        matchedRoomCode = ownRoomCode
      }
    }

    const refreshedMatch = await prisma.duelMatch.findUnique({
      where: { roomCode: matchedRoomCode },
      select: matchSelect,
    })

    if (!refreshedMatch) {
      return NextResponse.json({ error: "Unable to open match" }, { status: 500 })
    }

    const isHost = refreshedMatch.hostUserId === user.id
    const isGuest = refreshedMatch.guestUserId === user.id
    const isPaired = refreshedMatch.status === "ACTIVE" && (isHost || isGuest)

    if (isPaired) {
      emitMatchStateToParticipants(refreshedMatch)

      const notifications = [
        createNotification({
          userId: user.id,
          kind: "duel",
          title: "Match prêt",
          body: `La room ${refreshedMatch.roomCode} est prête.`,
          href: `/duel/play?roomCode=${refreshedMatch.roomCode}`,
        }),
      ]

      if (isGuest) {
        notifications.push(
          createNotification({
            userId: refreshedMatch.hostUserId,
            kind: "duel",
            title: "Adversaire trouvé",
            body: `${user.username} a rejoint votre duel rapide.`,
            href: `/duel/play?roomCode=${refreshedMatch.roomCode}`,
          }),
        )
      } else if (refreshedMatch.guestUserId) {
        notifications.push(
          createNotification({
            userId: refreshedMatch.guestUserId,
            kind: "duel",
            title: "Adversaire trouvé",
            body: `${user.username} attendait déjà — le duel commence.`,
            href: `/duel/play?roomCode=${refreshedMatch.roomCode}`,
          }),
        )
      }

      await Promise.all(notifications)

      return NextResponse.json({
        roomCode: refreshedMatch.roomCode,
        playUrl: `/duel/play?roomCode=${refreshedMatch.roomCode}`,
        status: "ACTIVE",
        joined: true,
      })
    }

    return NextResponse.json(
      {
        roomCode: refreshedMatch.roomCode,
        playUrl: `/duel/play?roomCode=${refreshedMatch.roomCode}`,
        status: "WAITING",
        joined: false,
      },
      { status: 201 },
    )
  }

  const roomCode = await createUniqueRoomCode()
  const questionSnapshot = createQuestionSnapshot(pickedQuestions)
  await prisma.duelMatch.create({
    data: {
      roomCode,
      matchMode: parsed.data.mode,
      category: parsed.data.category,
      difficulty: parsed.data.difficulty,
      status: "WAITING",
      hostUserId: user.id,
      questionSnapshot,
      hostState: createParticipantState(user.id, user.username, questionSnapshot),
    },
  })

  return NextResponse.json(
    {
      roomCode,
      playUrl: `/duel/play?roomCode=${roomCode}`,
      status: "WAITING",
      joined: false,
    },
    { status: 201 },
  )
}
