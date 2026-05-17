import http from "http"
import next from "next"
import { Server as SocketIOServer, type Socket } from "socket.io"
import { prisma } from "@/lib/prisma"
import { verifySessionToken } from "@/lib/auth"
import { buildMatchView } from "@/lib/duel-match"
import {
  emitCommunityMessage,
  getCommunityRoom,
  getMatchRoom,
  getUserRoom,
  setRealtimeServer,
} from "@/lib/realtime"

const port = Number(process.env.PORT ?? 3000)
const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

type SocketUser = {
  id: string
  email: string
  username: string
  role: "USER" | "ADMIN"
}

type MatchSubscriptionPayload = {
  roomCode: string
}

type CommunitySubscriptionPayload = {
  channel?: string
}

type ChatPayload = {
  channel?: string
  content: string
}

function readCookie(cookieHeader: string | undefined, cookieName: string) {
  if (!cookieHeader) return null

  const match = cookieHeader.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

async function getSocketUser(socket: Socket): Promise<SocketUser> {
  const cookieHeader = socket.handshake.headers.cookie
  const token = readCookie(cookieHeader, "kbr_session")

  if (!token) {
    throw new Error("Unauthorized")
  }

  const session = await verifySessionToken(token)
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
    },
  })

  if (!user) {
    throw new Error("Unauthorized")
  }

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: (user.role ?? "USER") as "USER" | "ADMIN",
  }
}

async function loadMatchForUser(roomCode: string, userId: string) {
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
    return null
  }

  return buildMatchView(match, userId)
}

void app.prepare().then(() => {
  const server = http.createServer((request, response) => {
    void handle(request, response)
  })

  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket", "polling"],
  })

  setRealtimeServer(io)

  io.use(async (socket, nextSocket) => {
    try {
      socket.data.user = await getSocketUser(socket)
      nextSocket()
    } catch (error) {
      nextSocket(error instanceof Error ? error : new Error("Unauthorized"))
    }
  })

  io.on("connection", (socket) => {
    const user = socket.data.user as SocketUser
    socket.join(getUserRoom(user.id))
    socket.join(getCommunityRoom("lobby"))

    socket.on("community:subscribe", (payload: CommunitySubscriptionPayload = {}) => {
      const channel = (payload.channel ?? "lobby").trim().toLowerCase() || "lobby"
      socket.join(getCommunityRoom(channel))
    })

    socket.on("duel:subscribe", async (payload: MatchSubscriptionPayload, ack?: (response: { ok: boolean; match?: Awaited<ReturnType<typeof loadMatchForUser>>; error?: string }) => void) => {
      const roomCode = payload?.roomCode?.trim().toUpperCase()
      if (!roomCode) {
        ack?.({ ok: false, error: "Invalid room code" })
        return
      }

      socket.join(getMatchRoom(roomCode))
      const match = await loadMatchForUser(roomCode, user.id)
      if (match) {
        socket.emit("duel:state", { match })
        ack?.({ ok: true, match })
        return
      }

      ack?.({ ok: false, error: "Match not found" })
    })

    socket.on("community:message", async (payload: ChatPayload, ack?: (response: { ok: boolean; error?: string }) => void) => {
      const channel = (payload.channel ?? "lobby").trim().toLowerCase() || "lobby"
      const content = payload.content.trim()

      if (!content) {
        ack?.({ ok: false, error: "Message required" })
        return
      }

      const message = await prisma.communityMessage.create({
        data: {
          channel,
          content,
          userId: user.id,
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

      emitCommunityMessage(channel, {
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
      })

      ack?.({ ok: true })
    })
  })

  server.listen(port, () => {
    console.log(`> Knowledge Battle Royale running on http://localhost:${port}`)
  })
})
