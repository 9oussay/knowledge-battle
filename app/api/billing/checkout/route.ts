import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentSessionUser } from "@/lib/session"
import { completeBillingCheckout } from "@/lib/billing"

const checkoutSchema = z.object({
  plan: z.enum(["STANDARD", "PREMIUM", "SPONSOR"]),
})

export async function POST(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json().catch(() => ({}))
  const parsed = checkoutSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid checkout payload" }, { status: 400 })
  }

  const result = await completeBillingCheckout({
    userId: user.id,
    plan: parsed.data.plan,
  })

  return NextResponse.json({
    billingEvent: result.billingEvent,
    user: result.user,
  })
}
