import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { emitBillingEvent, type RealtimeBillingEvent } from "@/lib/realtime"
import { getPlanLabel } from "@/lib/entitlements"

export type BillingPlan = "STANDARD" | "PREMIUM" | "SPONSOR"

type BillingEventRecord = {
  id: string
  userId: string
  plan: string
  amount: number
  currency: string
  status: string
  providerRef: string | null
  createdAt: Date
}

export type BillingEventView = RealtimeBillingEvent

const PLAN_PRICES: Record<BillingPlan, number> = {
  STANDARD: 0,
  PREMIUM: 1290,
  SPONSOR: 490,
}

export function serializeBillingEvent(event: BillingEventRecord): BillingEventView {
  return {
    id: event.id,
    userId: event.userId,
    plan: event.plan,
    amount: event.amount,
    currency: event.currency,
    status: event.status,
    providerRef: event.providerRef,
    createdAt: event.createdAt.toISOString(),
  }
}

export async function completeBillingCheckout(input: {
  userId: string
  plan: BillingPlan
}) {
  const isPremium = input.plan === "PREMIUM"
  const isSponsor = input.plan === "SPONSOR"
  const premiumUntil = isPremium ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null

  const updatedUser = await prisma.user.update({
    where: { id: input.userId },
    data: {
      ...(input.plan === "STANDARD"
        ? { isPremium: false, premiumUntil: null }
        : { isPremium, premiumUntil }),
      ...(isSponsor ? { isSponsor: true } : {}),
    },
    select: {
      id: true,
      username: true,
      isSponsor: true,
      isPremium: true,
      premiumUntil: true,
    },
  })

  const event = await prisma.billingEvent.create({
    data: {
      userId: input.userId,
      plan: input.plan,
      amount: PLAN_PRICES[input.plan],
      currency: "USD",
      status: "COMPLETED",
      providerRef: `mock_${input.plan.toLowerCase()}_${Date.now()}`,
    },
    select: {
      id: true,
      userId: true,
      plan: true,
      amount: true,
      currency: true,
      status: true,
      providerRef: true,
      createdAt: true,
    },
  })

  const eventView = serializeBillingEvent(event)
  emitBillingEvent(input.userId, eventView)

  await createNotification({
    userId: input.userId,
    kind: "billing",
    title: input.plan === "STANDARD" ? "Compte revenu au standard" : `Accès ${getPlanLabel(updatedUser)} activé`,
    body:
      input.plan === "PREMIUM"
        ? "Les catégories avancées et les statistiques détaillées sont maintenant débloquées."
        : input.plan === "SPONSOR"
          ? "Le badge sponsor est maintenant actif et les avantages visuels sont disponibles."
          : "L'abonnement premium a été désactivé et le compte repasse en mode standard.",
    href: "/billing",
  })

  return {
    billingEvent: eventView,
    user: updatedUser,
  }
}

export async function listBillingEvents(userId: string, limit = 10) {
  const events = await prisma.billingEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      userId: true,
      plan: true,
      amount: true,
      currency: true,
      status: true,
      providerRef: true,
      createdAt: true,
    },
  })

  return events.map(serializeBillingEvent)
}
