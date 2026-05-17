import { NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from "@/generated/prisma"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser } from "@/lib/session"
import { buildMatchView, scoreMatchAnswers } from "@/lib/duel-match"
import { normalizeRoomCode } from "@/lib/duel-queue"
import { getMatchOutcome, getRankFromXp, getXpAward } from "@/lib/duel-rules"
import { createNotification } from "@/lib/notifications"
import { emitMatchStateToParticipants } from "@/lib/realtime"

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

const completeSchema = z.object({
  answers: z.array(z.number().int().min(0).max(3).nullable()).max(50),
})

function getParticipantState(match: {
  hostUserId: string
  guestUserId: string | null
  hostState: unknown
  guestState: unknown
}, userId: string) {
  return match.hostUserId === userId ? match.hostState : match.guestUserId === userId ? match.guestState : null
}

function setParticipantState(match: {
  hostUserId: string
  guestUserId: string | null
  hostState: unknown
  guestState: unknown
}, userId: string, nextState: unknown) {
  if (match.hostUserId === userId) {
    return { hostState: nextState, guestState: match.guestState }
  }

  return { hostState: match.hostState, guestState: nextState }
}

export async function POST(req: Request, context: RouteContext) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomCode: rawRoomCode } = await context.params
  const roomCode = normalizeRoomCode(rawRoomCode)
  const payload = await req.json()
  const parsed = completeSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid completion payload" }, { status: 400 })
  }

  const match = await prisma.duelMatch.findUnique({
    where: { roomCode },
    select: {
      id: true,
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
      startedAt: true,
      finishedAt: true,
      hostUser: { select: { username: true } },
      guestUser: { select: { username: true } },
    },
  })

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const currentParticipantState = getParticipantState(match, user.id)
  if (!currentParticipantState && match.hostUserId !== user.id && match.guestUserId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const matchView = buildMatchView(match, user.id)
  const currentRole = matchView.playerRole
  if (!currentRole) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const questions = matchView.questions
  const score = scoreMatchAnswers(questions, parsed.data.answers)
  const total = matchView.totalPoints
  const completedAt = new Date().toISOString()

  const completedState = {
    userId: user.id,
    username: user.username,
    score,
    total,
    answers: parsed.data.answers.map((answer) => (typeof answer === "number" ? answer : null)),
    completed: true,
    completedAt,
    xpEarned: null as number | null,
  }

  const updatedState = setParticipantState(match, user.id, completedState)

  const ownAlreadyCompleted = Boolean(currentParticipantState && typeof currentParticipantState === "object" && (currentParticipantState as { completed?: boolean }).completed)

  if (!ownAlreadyCompleted) {
    await prisma.duelMatch.update({
      where: { roomCode },
      data: {
        hostState: updatedState.hostState ? (updatedState.hostState as Prisma.InputJsonValue) : null,
        guestState: updatedState.guestState ? (updatedState.guestState as Prisma.InputJsonValue) : null,
      },
    })
  }

  const refreshed = await prisma.duelMatch.findUnique({
    where: { roomCode },
    select: {
      id: true,
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
      startedAt: true,
      finishedAt: true,
      hostUser: { select: { username: true } },
      guestUser: { select: { username: true } },
    },
  })

  if (!refreshed) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const refreshedView = buildMatchView(refreshed, user.id)
  const refreshedOpponentCompleted = currentRole === "host" ? refreshedView.guestState?.completed : refreshedView.hostState?.completed

  emitMatchStateToParticipants(refreshed)

  if (refreshedView.status === "FINISHED" || !refreshedOpponentCompleted) {
    return NextResponse.json({ match: refreshedView, completed: true, pendingResult: !refreshedOpponentCompleted })
  }

  const hostState = refreshedView.hostState
  const guestState = refreshedView.guestState

  if (!hostState || !guestState) {
    return NextResponse.json({ match: refreshedView, completed: true, pendingResult: true })
  }

  const outcome = getMatchOutcome(hostState.score, guestState.score)
  const hostXp = getXpAward({ score: hostState.score, total: hostState.total, mode: "MULTIPLAYER", outcome })
  const guestXp = getXpAward({
    score: guestState.score,
    total: guestState.total,
    mode: "MULTIPLAYER",
    outcome: outcome === "host" ? "guest" : outcome === "guest" ? "host" : "draw",
  })

  const winnerUsername =
    outcome === "host"
      ? hostState.username
      : outcome === "guest"
        ? guestState.username
        : "Draw"

  const finalHostState = {
    ...hostState,
    xpEarned: hostXp,
  }
  const finalGuestState = {
    ...guestState,
    xpEarned: guestXp,
  }

  await prisma.duelMatch.update({
    where: { roomCode },
    data: {
      hostState: finalHostState,
      guestState: finalGuestState,
      status: "FINISHED",
      winnerUserId:
        outcome === "host"
          ? refreshed.hostUserId
          : outcome === "guest"
            ? refreshed.guestUserId
            : null,
      winnerUsername,
      finishedAt: new Date(),
    },
  })

  const existingHostSession = await prisma.duelSession.findFirst({
    where: { matchId: refreshed.id, userId: refreshed.hostUserId },
    select: { id: true },
  })
  const existingGuestSession = refreshed.guestUserId
    ? await prisma.duelSession.findFirst({
        where: { matchId: refreshed.id, userId: refreshed.guestUserId },
        select: { id: true },
      })
    : null

  if (!existingHostSession) {
    await prisma.duelSession.create({
      data: {
        userId: refreshed.hostUserId,
        matchId: refreshed.id,
        category: refreshed.category,
        difficulty: refreshed.difficulty,
        mode: "MULTIPLAYER",
        score: finalHostState.score,
        total: finalHostState.total,
        xpEarned: hostXp,
      },
    })
  }

  if (refreshed.guestUserId && !existingGuestSession) {
    await prisma.duelSession.create({
      data: {
        userId: refreshed.guestUserId,
        matchId: refreshed.id,
        category: refreshed.category,
        difficulty: refreshed.difficulty,
        mode: "MULTIPLAYER",
        score: finalGuestState.score,
        total: finalGuestState.total,
        xpEarned: guestXp,
      },
    })
  }

  await prisma.user.update({
    where: { id: refreshed.hostUserId },
    data: {
      xp: { increment: hostXp },
    },
  })

  if (refreshed.guestUserId) {
    await prisma.user.update({
      where: { id: refreshed.guestUserId },
      data: {
        xp: { increment: guestXp },
      },
    })
  }

  const updatedHost = await prisma.user.findUnique({
    where: { id: refreshed.hostUserId },
    select: { xp: true },
  })
  const updatedGuest = refreshed.guestUserId
    ? await prisma.user.findUnique({
        where: { id: refreshed.guestUserId },
        select: { xp: true },
      })
    : null

  if (updatedHost) {
    await prisma.user.update({
      where: { id: refreshed.hostUserId },
      data: { rank: getRankFromXp(updatedHost.xp) },
    })
  }

  if (refreshed.guestUserId && updatedGuest) {
    await prisma.user.update({
      where: { id: refreshed.guestUserId },
      data: { rank: getRankFromXp(updatedGuest.xp) },
    })
  }

  const finalMatch = await prisma.duelMatch.findUnique({
    where: { roomCode },
    select: {
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
    },
  })

  if (!finalMatch) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const resultLabel =
    outcome === "draw"
      ? "Égalité"
      : outcome === "host"
        ? `${hostState.username} a gagné`
        : `${guestState.username} a gagné`

  await Promise.all([
    createNotification({
      userId: refreshed.hostUserId,
      kind: "duel",
      title: outcome === "host" ? "Victoire" : outcome === "guest" ? "Défaite" : "Match nul",
      body: `${resultLabel} sur la room ${roomCode}. +${hostXp} XP gagnés.`,
      href: `/duel/play?roomCode=${roomCode}`,
    }),
    refreshed.guestUserId
      ? createNotification({
          userId: refreshed.guestUserId,
          kind: "duel",
          title: outcome === "guest" ? "Victoire" : outcome === "host" ? "Défaite" : "Match nul",
          body: `${resultLabel} sur la room ${roomCode}. +${guestXp} XP gagnés.`,
          href: `/duel/play?roomCode=${roomCode}`,
        })
      : Promise.resolve(),
  ])

  const finalView = buildMatchView(finalMatch, user.id)
  emitMatchStateToParticipants(finalMatch)

  return NextResponse.json({ match: finalView, completed: true, pendingResult: false })
}