import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { buildMatchView, createParticipantState } from "@/lib/duel-match"
import { normalizeRoomCode } from "@/lib/duel-queue"
import { createNotification } from "@/lib/notifications"
import { emitMatchStateToParticipants } from "@/lib/realtime"
import { getCurrentSessionUser } from "@/lib/session"

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

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
  startedAt: true,
  hostUser: { select: { username: true } },
  guestUser: { select: { username: true } },
} as const

export async function POST(_: Request, context: RouteContext) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomCode: rawRoomCode } = await context.params
  const roomCode = normalizeRoomCode(rawRoomCode)
  const match = await prisma.duelMatch.findUnique({
    where: { roomCode },
    select: matchSelect,
  })

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  const isHost = match.hostUserId === user.id
  const isGuest = match.guestUserId === user.id

  if (!isHost && match.guestUserId && !isGuest) {
    return NextResponse.json({ error: "Room already full" }, { status: 409 })
  }

  if (!isHost && !isGuest && !match.guestUserId && match.status !== "FINISHED") {
    const snapshot = Array.isArray(match.questionSnapshot) ? match.questionSnapshot : []

    await prisma.duelMatch.update({
      where: { roomCode },
      data: {
        guestUserId: user.id,
        guestState: createParticipantState(user.id, user.username, snapshot as never[]),
        status: "ACTIVE",
        startedAt: match.startedAt ?? new Date(),
      },
    })

    await Promise.all([
      createNotification({
        userId: match.hostUserId,
        kind: "duel",
        title: "Adversaire rejoint la room",
        body: `${user.username} a rejoint votre duel privé.`,
        href: `/duel/play?roomCode=${roomCode}`,
      }),
      createNotification({
        userId: user.id,
        kind: "duel",
        title: "Room privée rejointe",
        body: `Vous avez rejoint la room ${roomCode}.`,
        href: `/duel/play?roomCode=${roomCode}`,
      }),
    ])
  }

  const refreshed = await prisma.duelMatch.findUnique({
    where: { roomCode },
    select: matchSelect,
  })

  if (!refreshed) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  emitMatchStateToParticipants(refreshed)

  return NextResponse.json({ match: buildMatchView(refreshed, user.id) })
}
