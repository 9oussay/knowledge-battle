import { redirect } from "next/navigation"
import { getCurrentSessionUser } from "@/lib/session"
import { listNotifications } from "@/lib/notifications"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { NotificationsPanel } from "@/components/notifications/notifications-panel"

export default async function NotificationsPage() {
  const user = await getCurrentSessionUser()
  if (!user) {
    redirect("/login")
  }

  const notifications = await listNotifications(user.id, 50)

  return (
    <PageContainer size="lg">
      <PageHeader
        eyebrow="Notifications"
        title="Historique des alertes"
        description="Duels, événements de compte et récompenses débloquées."
      />
      <NotificationsPanel
        initialNotifications={notifications.notifications}
        initialUnreadCount={notifications.unreadCount}
      />
    </PageContainer>
  )
}
