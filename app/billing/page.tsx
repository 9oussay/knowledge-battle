import { redirect } from "next/navigation"
import { getCurrentSessionUser } from "@/lib/session"
import { listBillingEvents } from "@/lib/billing"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { BillingPanel } from "@/components/billing/billing-panel"

type BillingPageProps = {
  searchParams?: {
    plan?: string
  }
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const user = await getCurrentSessionUser()
  if (!user) {
    redirect("/login")
  }

  const billingEvents = await listBillingEvents(user.id, 8)
  const initialSelectedPlan =
    searchParams?.plan === "premium"
      ? "PREMIUM"
      : searchParams?.plan === "sponsor"
        ? "SPONSOR"
        : "STANDARD"

  return (
    <PageContainer size="xl">
      <PageHeader
        eyebrow="Facturation"
        title="Offres et abonnement"
        description="Passe en premium, deviens sponsor ou reste sur le plan standard."
      />
      <BillingPanel
        initialSelectedPlan={initialSelectedPlan}
        currentUser={{
          isSponsor: user.isSponsor,
          isPremium: user.isPremium,
          premiumUntil: user.premiumUntil ? user.premiumUntil.toISOString() : null,
        }}
        billingEvents={billingEvents}
      />
    </PageContainer>
  )
}
