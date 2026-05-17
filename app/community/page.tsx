import { redirect } from "next/navigation"
import { getCurrentSessionUser } from "@/lib/session"
import { listCommunityMessages } from "@/lib/community"
import { listNotifications } from "@/lib/notifications"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { CommunityPanel } from "@/components/community/community-panel"

export default async function CommunityPage() {
  const user = await getCurrentSessionUser()
  if (!user) {
    redirect("/login")
  }

  const [messages, notifications] = await Promise.all([
    listCommunityMessages("lobby", 40),
    listNotifications(user.id, 6),
  ])

  return (
    <PageContainer size="xl">
      <PageHeader
        eyebrow="Communauté"
        title="Chat et notifications"
        description="Canal général, entraide entre joueurs et alertes de compte en temps réel."
      />
      <CommunityPanel
        initialMessages={messages}
        initialNotifications={notifications.notifications}
        initialUnreadCount={notifications.unreadCount}
      />
    </PageContainer>
  )
}
