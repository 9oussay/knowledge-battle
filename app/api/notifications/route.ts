import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentSessionUser } from "@/lib/session"
import { listNotifications, markNotificationsRead } from "@/lib/notifications"

const markSchema = z.object({
  markAll: z.boolean().optional(),
  ids: z.array(z.string().trim().min(1)).optional(),
})

export async function GET(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "20", 10) || 20, 1), 50)
  const result = await listNotifications(user.id, limit)

  return NextResponse.json(result)
}

export async function PATCH(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json().catch(() => ({}))
  const parsed = markSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const count = await markNotificationsRead(user.id, parsed.data.ids, parsed.data.markAll ?? false)
  const result = await listNotifications(user.id, 20)

  return NextResponse.json({
    ...result,
    updatedCount: count,
  })
}
