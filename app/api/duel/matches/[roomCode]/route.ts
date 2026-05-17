import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser } from "@/lib/session"
import { buildMatchView } from "@/lib/duel-match"
import { normalizeRoomCode } from "@/lib/duel-queue"

type RouteContext = {
  params: Promise<{ roomCode: string }>
}

export async function GET(_: Request, context: RouteContext) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { roomCode: rawRoomCode } = await context.params
  const roomCode = normalizeRoomCode(rawRoomCode)
  const match = await prisma.duelMatch.findUnique({
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

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 })
  }

  return NextResponse.json({ match: buildMatchView(match, user.id) })
}