import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdminUser, slugifyCategoryName } from "@/lib/admin"

const createCategorySchema = z.object({
  name: z.string().trim().min(2).max(40),
  description: z.string().trim().max(180).optional(),
})

export async function GET() {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [categories, questions] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isActive: true,
        createdAt: true,
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

  return NextResponse.json({
    categories: categories.map((category) => ({
      ...category,
      questionCount: counts.get(category.name) ?? 0,
    })),
  })
}

export async function POST(req: Request) {
  const admin = await requireAdminUser()
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const payload = await req.json()
  const parsed = createCategorySchema.safeParse(payload)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  const slug = slugifyCategoryName(parsed.data.name)
  if (!slug) {
    return NextResponse.json({ error: "Invalid category name" }, { status: 400 })
  }

  const existing = await prisma.category.findFirst({
    where: {
      OR: [{ name: parsed.data.name }, { slug }],
    },
    select: {
      id: true,
    },
  })

  if (existing) {
    return NextResponse.json({ error: "Category already exists" }, { status: 409 })
  }

  const created = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description || null,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      isActive: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ category: { ...created, questionCount: 0 } }, { status: 201 })
}
