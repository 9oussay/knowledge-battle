import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const [categories, questions] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
    }),
    prisma.question.findMany({
      select: {
        category: true,
      },
    }),
  ])

  const counts = new Map<string, number>()
  for (const question of questions) {
    counts.set(question.category, (counts.get(question.category) ?? 0) + 1)
  }

  if (categories.length > 0) {
    return NextResponse.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        questionCount: counts.get(category.name) ?? 0,
      })),
    })
  }

  const fallback = Array.from(new Set(questions.map((question) => question.category)))
    .filter((name) => name.trim().length > 0)
    .sort((a, b) => a.localeCompare(b))

  return NextResponse.json({
    categories: fallback.map((name) => ({
      id: name,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""),
      description: null,
      questionCount: counts.get(name) ?? 0,
    })),
  })
}
