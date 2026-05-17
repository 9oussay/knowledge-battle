import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")?.trim()
  const difficulty = searchParams.get("difficulty")?.trim()
  const requestedCount = Number.parseInt(searchParams.get("count") ?? "20", 10)
  const count = Number.isFinite(requestedCount) ? Math.min(Math.max(requestedCount, 1), 50) : 20

  if (!category) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 })
  }

  const categoryExists = await prisma.category.findFirst({
    where: {
      name: category,
      isActive: true,
    },
    select: { id: true },
  })

  if (!categoryExists) {
    const fallbackQuestion = await prisma.question.findFirst({
      where: { category },
      select: { id: true },
    })

    if (!fallbackQuestion) {
      return NextResponse.json({ error: "Unknown category" }, { status: 404 })
    }
  }

  const where = {
    category,
    ...(difficulty && ["Easy", "Medium", "Hard"].includes(difficulty) ? { difficulty } : {}),
  }

  const all = await prisma.question.findMany({ where })
  if (all.length === 0) {
    return NextResponse.json({ error: "No questions found for this category" }, { status: 404 })
  }

  // Shuffle and pick `count` questions
  const shuffled = [...all]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }

  return NextResponse.json({ questions: shuffled.slice(0, count) })
}
