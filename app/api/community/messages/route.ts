import { NextResponse } from "next/server"
import { z } from "zod"
import { getCurrentSessionUser } from "@/lib/session"
import { createCommunityMessage, listCommunityMessages } from "@/lib/community"

const createMessageSchema = z.object({
  content: z.string().trim().min(1).max(280),
  channel: z.string().trim().min(1).max(40).default("lobby"),
})

export async function GET(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const channel = searchParams.get("channel")?.trim().toLowerCase() || "lobby"
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 100)
  const messages = await listCommunityMessages(channel, limit)

  return NextResponse.json({ messages, channel })
}

export async function POST(req: Request) {
  const user = await getCurrentSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json().catch(() => ({}))
  const parsed = createMessageSchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message payload" }, { status: 400 })
  }

  const message = await createCommunityMessage({
    userId: user.id,
    channel: parsed.data.channel,
    content: parsed.data.content,
  })

  return NextResponse.json({ message }, { status: 201 })
}
