"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRealtimeSocket } from "@/components/realtime-provider"
import type { NotificationView } from "@/lib/notifications"

type NotificationsPanelProps = {
  initialNotifications: NotificationView[]
  initialUnreadCount: number
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function NotificationsPanel({ initialNotifications, initialUnreadCount }: NotificationsPanelProps) {
  const { socket, connected } = useRealtimeSocket()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [loading, setLoading] = useState(false)

  async function refreshNotifications() {
    setLoading(true)
    try {
      const response = await fetch("/api/notifications?limit=50", { credentials: "include" })
      if (!response.ok) return

      const data = (await response.json()) as { notifications: NotificationView[]; unreadCount: number }
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!socket) return

    const handleNew = (payload: { notification: NotificationView }) => {
      setNotifications((current) => [payload.notification, ...current].slice(0, 50))
      setUnreadCount((count) => count + (payload.notification.isRead ? 0 : 1))
    }

    const handleUpdate = () => {
      void refreshNotifications()
    }

    socket.on("notification:new", handleNew)
    socket.on("notification:update", handleUpdate)

    return () => {
      socket.off("notification:new", handleNew)
      socket.off("notification:update", handleUpdate)
    }
  }, [socket])

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAll: true }),
    })

    await refreshNotifications()
  }

  return (
    <Card className="bg-card/70 backdrop-blur-sm border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Centre de notifications</CardTitle>
            <CardDescription>Alerts de duel, billing et communauté au même endroit.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge>{unreadCount} non lues</Badge>
            <Badge variant={connected ? "default" : "outline"}>{connected ? "Live" : "Hors ligne"}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[560px] rounded-2xl border border-border bg-background/30 p-4">
          <div className="space-y-3 pr-2">
            {notifications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                Aucune notification pour le moment.
              </div>
            ) : (
              notifications.map((notification) => (
                <div key={notification.id} className={`rounded-2xl border p-4 ${notification.isRead ? "border-border bg-card/50" : "border-primary/30 bg-primary/5"}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">{notification.title}</p>
                    {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                  </div>
                  <p className="mt-2 text-sm text-foreground/80">{notification.body}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">{formatTime(notification.createdAt)}</p>
                    <Button asChild variant="outline" size="sm" className="rounded-full bg-transparent">
                      <Link href={notification.href ?? "/dashboard"}>Ouvrir</Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="outline" className="rounded-full bg-transparent">
            <Link href="/community">Retour à la communauté</Link>
          </Button>
          <Button className="rounded-full shimmer-btn" onClick={markAllRead} disabled={loading}>
            Tout marquer comme lu
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
