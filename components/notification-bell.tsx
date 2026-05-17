"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRealtimeSocket } from "@/components/realtime-provider"
import type { NotificationView } from "@/lib/notifications"

type NotificationsPayload = {
  notifications: NotificationView[]
  unreadCount: number
}

type NotificationBellProps = {
  className?: string
}

export function NotificationBell({ className }: NotificationBellProps) {
  const router = useRouter()
  const { socket, connected } = useRealtimeSocket()
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationView[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  async function refreshNotifications() {
    try {
      const response = await fetch("/api/notifications?limit=5", {
        credentials: "include",
      })
      if (!response.ok) {
        throw new Error("Failed to load notifications")
      }

      const data = (await response.json()) as NotificationsPayload
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refreshNotifications()
  }, [])

  useEffect(() => {
    if (!socket) return

    const handleNewNotification = (payload: { notification: NotificationView }) => {
      setNotifications((current) => [payload.notification, ...current].slice(0, 5))
      setUnreadCount((count) => count + (payload.notification.isRead ? 0 : 1))
    }

    const handleNotificationUpdate = () => {
      void refreshNotifications()
    }

    socket.on("notification:new", handleNewNotification)
    socket.on("notification:update", handleNotificationUpdate)

    return () => {
      socket.off("notification:new", handleNewNotification)
      socket.off("notification:update", handleNotificationUpdate)
    }
  }, [socket])

  const statusLabel = useMemo(() => {
    if (loading) return "Chargement"
    return connected ? "En ligne" : "Hors ligne"
  }, [connected, loading])

  async function markAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAll: true }),
    })

    await refreshNotifications()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`relative rounded-full text-muted-foreground hover:text-foreground ${className ?? ""}`}>
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between gap-2">
          <span>Notifications</span>
          <span className="text-[11px] font-normal text-muted-foreground">{statusLabel}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement...
              </span>
            ) : (
              "Aucune notification pour le moment."
            )}
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild className="cursor-pointer items-start">
              <Link
                href={notification.href ?? "/notifications"}
                className="flex w-full flex-col items-start gap-1 rounded-md px-2 py-2"
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">{notification.title}</span>
                  {!notification.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <p className="text-xs text-muted-foreground">{notification.body}</p>
                <p className="text-[11px] text-muted-foreground/80">{new Date(notification.createdAt).toLocaleString()}</p>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <div className="flex items-center justify-between gap-2 px-2 py-1">
          <Button asChild variant="outline" size="sm" className="rounded-full bg-transparent">
            <Link href="/notifications">Voir tout</Link>
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" onClick={markAllAsRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Tout lire
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
