import { prisma } from "@/lib/prisma"
import { emitNotification, emitNotificationUpdate, type RealtimeNotification } from "@/lib/realtime"

type NotificationRecord = {
  id: string
  userId: string
  kind: string
  title: string
  body: string
  href: string | null
  isRead: boolean
  createdAt: Date
}

export type NotificationView = RealtimeNotification

export function serializeNotification(notification: NotificationRecord): NotificationView {
  return {
    id: notification.id,
    userId: notification.userId,
    kind: notification.kind,
    title: notification.title,
    body: notification.body,
    href: notification.href,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
  }
}

export async function createNotification(input: {
  userId: string
  kind: string
  title: string
  body: string
  href?: string | null
}) {
  const notification = await prisma.userNotification.create({
    data: {
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body,
      href: input.href ?? null,
    },
    select: {
      id: true,
      userId: true,
      kind: true,
      title: true,
      body: true,
      href: true,
      isRead: true,
      createdAt: true,
    },
  })

  const view = serializeNotification(notification)
  emitNotification(input.userId, view)
  return view
}

export async function listNotifications(userId: string, limit = 20) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.userNotification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        userId: true,
        kind: true,
        title: true,
        body: true,
        href: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.userNotification.count({
      where: { userId, isRead: false },
    }),
  ])

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
  }
}

export async function markNotificationsRead(userId: string, ids?: string[], markAll = false) {
  const where = markAll || !ids || ids.length === 0 ? { userId, isRead: false } : { userId, id: { in: ids } }

  const updated = await prisma.userNotification.updateMany({
    where,
    data: { isRead: true },
  })

  emitNotificationUpdate(userId, ids ?? [])
  return updated.count
}
