import Link from "next/link"
import { redirect } from "next/navigation"
import { getCurrentSessionUser } from "@/lib/session"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { ContentPanel } from "@/components/app/content-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function toInviteCode(value: string) {
  return Buffer.from(value).toString("base64url").slice(0, 12).toUpperCase()
}

export default async function InvitePage() {
  const user = await getCurrentSessionUser()
  if (!user) redirect("/login")

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "") || "http://localhost:3000"
  const code = toInviteCode(`${user.id}:${user.username}`)
  const inviteUrl = `${baseUrl}/register?ref=${code}`

  return (
    <PageContainer size="md">
      <PageHeader
        eyebrow="Parrainage"
        title="Inviter un ami"
        description="Partage ton lien pour faire grandir la communauté."
      />

      <ContentPanel>
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Code</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="font-mono text-sm font-semibold">{code}</code>
              <Badge>Actif</Badge>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lien</p>
            <code className="mt-2 block break-all text-xs text-foreground">{inviteUrl}</code>
          </div>
          <Button asChild>
            <Link href={inviteUrl}>Ouvrir le lien d&apos;invitation</Link>
          </Button>
        </div>
      </ContentPanel>
    </PageContainer>
  )
}
