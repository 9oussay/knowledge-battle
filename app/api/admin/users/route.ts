import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdminUser } from "@/lib/admin"

export async function GET() {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      rank: true,
      xp: true,
      isSponsor: true,
      createdAt: true,
      sessions: {
        select: {
          id: true,
        },
      },
    },
  })

  return NextResponse.json({
    users: users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role ?? "USER",
      rank: user.rank,
      xp: user.xp,
      isSponsor: user.isSponsor,
      createdAt: user.createdAt,
      sessionsCount: user.sessions.length,
    })),
  })
}
