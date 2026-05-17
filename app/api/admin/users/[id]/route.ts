import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdminUser } from "@/lib/admin"

const updateUserSchema = z
  .object({
    role: z.enum(["USER", "ADMIN"]).optional(),
    rank: z.string().trim().min(2).max(40).optional(),
    xp: z.number().int().min(0).max(1_000_000).optional(),
    isSponsor: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "No update fields provided",
  })

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(req: Request, context: RouteContext) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const payload = await req.json()
  const parsed = updateUserSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: {
      ...(parsed.data.role ? { role: parsed.data.role } : {}),
      ...(parsed.data.rank ? { rank: parsed.data.rank } : {}),
      ...(typeof parsed.data.xp === "number" ? { xp: parsed.data.xp } : {}),
      ...(typeof parsed.data.isSponsor === "boolean" ? { isSponsor: parsed.data.isSponsor } : {}),
    },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      rank: true,
      xp: true,
      isSponsor: true,
    },
  })

  return NextResponse.json({
    user: {
      ...updated,
      role: updated.role ?? "USER",
    },
  })
}
