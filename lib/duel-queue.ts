import { prisma } from "@/lib/prisma"
import { createParticipantState } from "@/lib/duel-match"
import type { DuelQuestionSnapshot } from "@/lib/duel-rules"

export function normalizeRoomCode(roomCode: string) {
  return roomCode.trim().toUpperCase()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function claimRandomMatch(
  user: { id: string; username: string },
  category: string,
  difficulty: string,
  maxAttempts = 5,
) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate = await prisma.duelMatch.findFirst({
      where: {
        matchMode: "random",
        category,
        difficulty,
        status: "WAITING",
        guestUserId: null,
        hostUserId: { not: user.id },
      },
      orderBy: { createdAt: "asc" },
    })

    if (!candidate) {
      return null
    }

    const waitingQuestions = Array.isArray(candidate.questionSnapshot)
      ? (candidate.questionSnapshot as DuelQuestionSnapshot[])
      : []

    const updated = await prisma.duelMatch.updateMany({
      where: {
        roomCode: candidate.roomCode,
        guestUserId: null,
        status: "WAITING",
        hostUserId: { not: user.id },
      },
      data: {
        guestUserId: user.id,
        guestState: createParticipantState(user.id, user.username, waitingQuestions),
        status: "ACTIVE",
        startedAt: new Date(),
      },
    })

    if (updated.count === 1) {
      return candidate.roomCode
    }
  }

  return null
}

export async function claimRandomMatchWithRetry(
  user: { id: string; username: string },
  category: string,
  difficulty: string,
  rounds = 8,
) {
  for (let round = 0; round < rounds; round += 1) {
    const roomCode = await claimRandomMatch(user, category, difficulty, 3)
    if (roomCode) {
      return roomCode
    }

    if (round < rounds - 1) {
      await sleep(80 * (round + 1))
    }
  }

  return null
}

export async function abandonEmptyRandomRoom(roomCode: string, hostUserId: string) {
  await prisma.duelMatch.deleteMany({
    where: {
      roomCode,
      hostUserId,
      guestUserId: null,
      status: "WAITING",
      matchMode: "random",
    },
  })
}
