"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { useRealtimeSocket } from "@/components/realtime-provider"
import type { CommunityMessageView } from "@/lib/community"
import type { NotificationView } from "@/lib/notifications"

type CommunityPanelProps = {
  initialMessages: CommunityMessageView[]
  initialNotifications: NotificationView[]
  initialUnreadCount: number
}

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function CommunityPanel({ initialMessages, initialNotifications, initialUnreadCount }: CommunityPanelProps) {
  const router = useRouter()
  const { socket, connected } = useRealtimeSocket()
  const [channel] = useState("lobby")
  const [messages, setMessages] = useState(initialMessages)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [content, setContent] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    socket.emit("community:subscribe", { channel })

    const handleMessage = (payload: { message: CommunityMessageView }) => {
      if (payload.message.channel !== channel) return
      setMessages((current) => [...current, payload.message])
    }

    const handleNotification = (payload: { notification: NotificationView }) => {
      setNotifications((current) => [payload.notification, ...current].slice(0, 6))
      setUnreadCount((count) => count + (payload.notification.isRead ? 0 : 1))
    }

    const handleNotificationUpdate = () => {
      void refreshNotifications()
    }

    socket.on("community:message", handleMessage)
    socket.on("notification:new", handleNotification)
    socket.on("notification:update", handleNotificationUpdate)

    return () => {
      socket.off("community:message", handleMessage)
      socket.off("notification:new", handleNotification)
      socket.off("notification:update", handleNotificationUpdate)
    }
  }, [channel, socket])

  async function refreshNotifications() {
    const response = await fetch("/api/notifications?limit=6", { credentials: "include" })
    if (!response.ok) return

    const data = (await response.json()) as { notifications: NotificationView[]; unreadCount: number }
    setNotifications(data.notifications)
    setUnreadCount(data.unreadCount)
  }

  async function sendMessage() {
    const trimmed = content.trim()
    if (!trimmed) return

    setSending(true)
    setError(null)

    try {
      const response = await fetch("/api/community/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: trimmed, channel }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Impossible d'envoyer le message")
      }

      setContent("")
    } catch (error) {
      setError(error instanceof Error ? error.message : "Impossible d'envoyer le message")
    } finally {
      setSending(false)
    }
  }

  async function markAllNotificationsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ markAll: true }),
    })

    await refreshNotifications()
    router.refresh()
  }

  const connectionLabel = useMemo(() => (connected ? "Live" : "Connexion en attente"), [connected])

  return (
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <Card className="bg-card/70 backdrop-blur-sm border-border/80">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Chat communautaire</CardTitle>
              <CardDescription>Échange des conseils, trouve des adversaires et garde un œil sur les nouveautés.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={connected ? "default" : "outline"}>{connectionLabel}</Badge>
              <Badge variant="secondary">#{channel}</Badge>
            </div>
          </div>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[420px] rounded-2xl border border-border bg-background/30 p-4">
            <div className="space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                  Pas encore de message. Lance la discussion.
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-border bg-card/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">{message.user.username}</p>
                        {message.user.isSponsor && <Badge variant="secondary">Sponsor</Badge>}
                        {message.user.isPremium && <Badge>Premium</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">{formatMessageTime(message.createdAt)}</p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90">{message.content}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="space-y-3 rounded-2xl border border-border bg-background/30 p-4">
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Pose une question, partage une astuce, ou trouve un adversaire..."
              className="min-h-28 resize-none bg-background/50"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">Le flux se met à jour en direct pour tous les membres connectés.</p>
              <Button className="rounded-full shimmer-btn" onClick={sendMessage} disabled={sending}>
                {sending ? "Envoi..." : "Envoyer"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm border-border/80">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Alertes de duel, billing et activité du compte.</CardDescription>
            </div>
            <Badge>{unreadCount} non lues</Badge>
          </div>
          <Separator />
        </CardHeader>
        <CardContent className="space-y-4">
          <ScrollArea className="h-[420px] rounded-2xl border border-border bg-background/30 p-4">
            <div className="space-y-3 pr-2">
              {notifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background/20 p-6 text-center text-sm text-muted-foreground">
                  Rien à signaler pour le moment.
                </div>
              ) : (
                notifications.map((notification) => (
                  <div key={notification.id} className={`rounded-2xl border p-4 ${notification.isRead ? "border-border bg-card/50" : "border-primary/30 bg-primary/5"}`}>
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{notification.title}</p>
                      {!notification.isRead && <span className="h-2.5 w-2.5 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-2 text-sm text-foreground/80">{notification.body}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">{formatMessageTime(notification.createdAt)}</p>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between gap-3">
            <Button asChild variant="outline" className="rounded-full bg-transparent">
              <a href="/notifications">Voir tout</a>
            </Button>
            <Button variant="ghost" className="rounded-full" onClick={markAllNotificationsRead}>
              Tout lire
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
