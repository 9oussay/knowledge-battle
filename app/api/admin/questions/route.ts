import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdminUser } from "@/lib/admin"

const createQuestionSchema = z.object({
  category: z.string().trim().min(2).max(40),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  question: z.string().trim().min(10).max(240),
  choices: z.array(z.string().trim().min(1).max(180)).length(4),
  answer: z.number().int().min(0).max(3),
  points: z.number().int().min(1).max(100),
})

export async function GET(req: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")?.trim()
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "100"), 1), 200)

  const questions = await prisma.question.findMany({
    where: category ? { category } : undefined,
    take: limit,
    orderBy: { id: "desc" },
    select: {
      id: true,
      category: true,
      difficulty: true,
      question: true,
      choices: true,
      answer: true,
      points: true,
    },
  })

  return NextResponse.json({ questions })
}

export async function POST(req: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payload = await req.json()
  const parsed = createQuestionSchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question payload" }, { status: 400 })
  }

  const category = await prisma.category.findFirst({
    where: {
      name: parsed.data.category,
      isActive: true,
    },
    select: { id: true },
  })

  if (!category) {
    return NextResponse.json({ error: "Category does not exist or is disabled" }, { status: 400 })
  }

  const created = await prisma.question.create({
    data: parsed.data,
    select: {
      id: true,
      category: true,
      difficulty: true,
      question: true,
      choices: true,
      answer: true,
      points: true,
    },
  })

  return NextResponse.json({ question: created }, { status: 201 })
}
