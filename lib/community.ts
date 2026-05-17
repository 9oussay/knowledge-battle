import { prisma } from "@/lib/prisma"
import { emitCommunityMessage, type RealtimeCommunityMessage } from "@/lib/realtime"

type CommunityMessageRecord = {
  id: string
  channel: string
  content: string
  createdAt: Date
  user: {
    id: string
    username: string
    isSponsor: boolean
    isPremium: boolean
  }
}

export type CommunityMessageView = RealtimeCommunityMessage

export function serializeCommunityMessage(message: CommunityMessageRecord): CommunityMessageView {
  return {
    id: message.id,
    channel: message.channel,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    user: {
      id: message.user.id,
      username: message.user.username,
      isSponsor: message.user.isSponsor,
      isPremium: message.user.isPremium,
    },
  }
}

export async function createCommunityMessage(input: {
  userId: string
  channel?: string
  content: string
}) {
  const message = await prisma.communityMessage.create({
    data: {
      userId: input.userId,
      channel: input.channel ?? "lobby",
      content: input.content,
    },
    select: {
      id: true,
      channel: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          isSponsor: true,
          isPremium: true,
        },
      },
    },
  })

  const view = serializeCommunityMessage(message)
  emitCommunityMessage(view.channel, view)
  return view
}

export async function listCommunityMessages(channel = "lobby", limit = 50) {
  const messages = await prisma.communityMessage.findMany({
    where: { channel },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      channel: true,
      content: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          username: true,
          isSponsor: true,
          isPremium: true,
        },
      },
    },
  })

  return messages.reverse().map(serializeCommunityMessage)
}
