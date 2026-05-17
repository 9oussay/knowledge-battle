import type { Server as SocketIOServer } from "socket.io"
import { buildMatchView, type MatchRecord } from "@/lib/duel-match"

export type RealtimeNotification = {
  id: string
  userId: string
  kind: string
  title: string
  body: string
  href: string | null
  isRead: boolean
  createdAt: string
}

export type RealtimeCommunityMessage = {
  id: string
  channel: string
  content: string
  createdAt: string
  user: {
    id: string
    username: string
    isSponsor: boolean
    isPremium: boolean
  }
}

export type RealtimeBillingEvent = {
  id: string
  userId: string
  plan: string
  amount: number
  currency: string
  status: string
  providerRef: string | null
  createdAt: string
}

declare global {
  var __knowledgeBattleRealtimeServer: SocketIOServer | undefined
}

export function setRealtimeServer(server: SocketIOServer) {
  globalThis.__knowledgeBattleRealtimeServer = server
}

export function getRealtimeServer() {
  return globalThis.__knowledgeBattleRealtimeServer
}

export function getUserRoom(userId: string) {
  return `user:${userId}`
}

export function getCommunityRoom(channel: string) {
  return `community:${channel}`
}

export function getMatchRoom(roomCode: string) {
  return `duel:${roomCode.toUpperCase()}`
}

export function emitMatchState(roomCode: string, match: { roomCode: string; [key: string]: unknown }) {
  getRealtimeServer()?.to(getMatchRoom(roomCode)).emit("duel:state", { match })
}

export function emitMatchStateToParticipants(match: MatchRecord) {
  const io = getRealtimeServer()
  if (!io) return

  io.to(getUserRoom(match.hostUserId)).emit("duel:state", { match: buildMatchView(match, match.hostUserId) })

  if (match.guestUserId) {
    io.to(getUserRoom(match.guestUserId)).emit("duel:state", { match: buildMatchView(match, match.guestUserId) })
  }
}

export function emitNotification(userId: string, notification: RealtimeNotification) {
  getRealtimeServer()?.to(getUserRoom(userId)).emit("notification:new", { notification })
}

export function emitNotificationUpdate(userId: string, notificationIds: string[]) {
  getRealtimeServer()?.to(getUserRoom(userId)).emit("notification:update", { ids: notificationIds })
}

export function emitCommunityMessage(channel: string, message: RealtimeCommunityMessage) {
  getRealtimeServer()?.to(getCommunityRoom(channel)).emit("community:message", { message })
}

export function emitBillingEvent(userId: string, event: RealtimeBillingEvent) {
  getRealtimeServer()?.to(getUserRoom(userId)).emit("billing:event", { event })
}
