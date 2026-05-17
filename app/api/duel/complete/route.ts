import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getCurrentSessionUser } from "@/lib/session"
import { getRankFromXp } from "@/lib/duel-rules"
import { createNotification } from "@/lib/notifications"

const completeSchema = z.object({
  category: z.string().trim().min(2),
  score: z.number().int().min(0),
  total: z.number().int().min(1),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).default("Medium"),
  mode: z.string().trim().min(2).max(40).default("SOLO"),
})

export async function POST(req: Request) {
  try {
    const user = await getCurrentSessionUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = await req.json()
    const parsed = completeSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid completion payload" }, { status: 400 })
    }

    const { category, score, total, difficulty, mode } = parsed.data
    const xpEarned = score * 2

    await prisma.duelSession.create({
      data: {
        userId: user.id,
        category,
        difficulty,
        mode,
        score,
        total,
        xpEarned,
      },
    })

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { xp: { increment: xpEarned } },
      select: { xp: true },
    })

    await prisma.user.update({
      where: { id: user.id },
      data: { rank: getRankFromXp(updatedUser.xp) },
    })

    await createNotification({
      userId: user.id,
      kind: "duel",
      title: "Duel terminé",
      body: `Ton duel ${mode === "SOLO" ? "solo" : ""} est enregistré avec ${xpEarned} XP gagnés.`,
      href: "/dashboard",
    })

    return NextResponse.json({ xpEarned, xp: updatedUser?.xp })
  } catch (error) {
    console.error("Duel save error:", error)
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 })
  }
}
