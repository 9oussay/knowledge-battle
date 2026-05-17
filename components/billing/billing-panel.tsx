"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useRealtimeSocket } from "@/components/realtime-provider"
import type { BillingEventView } from "@/lib/billing"
import { getPlanCapabilities, getPlanLabel } from "@/lib/entitlements"

type BillingPanelProps = {
  currentUser: {
    isSponsor: boolean
    isPremium: boolean
    premiumUntil: string | null
  }
  billingEvents: BillingEventView[]
  initialSelectedPlan?: BillingPlan
}

type BillingPlan = "STANDARD" | "PREMIUM" | "SPONSOR"

const PLAN_CONFIG: Record<BillingPlan, { title: string; description: string; price: string; features: string[] }> = {
  STANDARD: {
    title: "Standard",
    description: "Le plan par défaut pour jouer et progresser.",
    price: "0 USD",
    features: ["Duels publics", "Classement global", "Récompenses de base"],
  },
  SPONSOR: {
    title: "Sponsor",
    description: "Soutiens la communauté et débloque un badge visible.",
    price: "4.90 USD",
    features: ["Badge sponsor", "Cosmétiques exclusifs", "Récompenses spéciales"],
  },
  PREMIUM: {
    title: "Premium",
    description: "Débloque les catégories avancées et les statistiques détaillées.",
    price: "12.90 USD",
    features: ["Catégories avancées", "Statistiques détaillées", "Entraînement illimité"],
  },
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100)
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

export function BillingPanel({ currentUser, billingEvents: initialEvents, initialSelectedPlan }: BillingPanelProps) {
  const router = useRouter()
  const { socket, connected } = useRealtimeSocket()
  const [events, setEvents] = useState(initialEvents)
  const [account, setAccount] = useState(currentUser)
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan>(
    initialSelectedPlan ?? (currentUser.isPremium ? "PREMIUM" : currentUser.isSponsor ? "SPONSOR" : "STANDARD"),
  )
  const [loadingPlan, setLoadingPlan] = useState<BillingPlan | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeLabel = useMemo(
    () => getPlanLabel({ isSponsor: account.isSponsor, isPremium: account.isPremium, premiumUntil: account.premiumUntil ? new Date(account.premiumUntil) : null }),
    [account.isPremium, account.isSponsor, account.premiumUntil],
  )

  const capabilities = useMemo(
    () => getPlanCapabilities({ isSponsor: account.isSponsor, isPremium: account.isPremium, premiumUntil: account.premiumUntil ? new Date(account.premiumUntil) : null }),
    [account.isPremium, account.isSponsor, account.premiumUntil],
  )

  useEffect(() => {
    if (!socket) return

    const handleBillingEvent = (payload: { event: BillingEventView }) => {
      setEvents((current) => [payload.event, ...current].slice(0, 10))
    }

    socket.on("billing:event", handleBillingEvent)

    return () => {
      socket.off("billing:event", handleBillingEvent)
    }
  }, [socket])

  async function checkout(plan: BillingPlan) {
    setLoadingPlan(plan)
    setError(null)

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Impossible de finaliser le checkout")
      }

      const data = (await response.json()) as { user?: BillingPanelProps["currentUser"] }
      if (data.user) {
        setAccount(data.user)
      }
      setSelectedPlan(plan)
      router.refresh()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Impossible de finaliser le checkout")
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="bg-card/70 backdrop-blur-sm border-border/80">
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>Abonnements</CardTitle>
              <CardDescription>Choisis un plan pour débloquer les fonctionnalités correspondant à ton usage.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Plan actuel: {activeLabel}</Badge>
              <Badge variant={connected ? "default" : "outline"}>{connected ? "Live" : "Hors ligne"}</Badge>
            </div>
          </div>
          <Separator />
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(Object.keys(PLAN_CONFIG) as BillingPlan[]).map((plan) => {
            const config = PLAN_CONFIG[plan]
            const isSelected = selectedPlan === plan
            const isCurrent =
              (plan === "PREMIUM" && capabilities.premium) ||
              (plan === "SPONSOR" && capabilities.sponsor) ||
              (plan === "STANDARD" && !capabilities.premium && !capabilities.sponsor)

            return (
              <div key={plan} className={`rounded-2xl border p-5 transition-all ${isSelected ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-background/30"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">{config.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{config.description}</p>
                  </div>
                  {isCurrent && <Badge>Actif</Badge>}
                </div>
                <p className="mt-4 text-3xl font-bold text-foreground">{config.price}</p>
                <ul className="mt-4 space-y-2 text-sm text-foreground/90">
                  {config.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex flex-col gap-2">
                  <Button
                    variant={isSelected ? "default" : "outline"}
                    className={`rounded-full ${isSelected ? "shimmer-btn" : "bg-transparent"}`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    Sélectionner
                  </Button>
                  <Button
                    className="rounded-full"
                    variant={isCurrent ? "secondary" : "default"}
                    onClick={() => checkout(plan)}
                    disabled={loadingPlan === plan}
                  >
                    {loadingPlan === plan ? "Traitement..." : plan === "STANDARD" ? "Rester standard" : "Confirmer"}
                  </Button>
                </div>
              </div>
            )
          })}
          {error && <p className="md:col-span-3 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>

      <Card className="bg-card/70 backdrop-blur-sm border-border/80">
        <CardHeader>
          <CardTitle>Historique</CardTitle>
          <CardDescription>Les derniers événements de facturation et d&apos;accès.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background/20 p-8 text-center text-sm text-muted-foreground">
              Aucun événement pour le moment.
            </div>
          ) : (
            events.map((event) => (
              <div key={event.id} className="rounded-2xl border border-border bg-background/35 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-foreground">{event.plan}</p>
                  <Badge variant="secondary">{event.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{formatAmount(event.amount, event.currency)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{event.providerRef ?? "Paiement simulé"}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDate(event.createdAt)}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
