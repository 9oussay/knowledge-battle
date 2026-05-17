import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, hashPassword, signSessionToken } from "@/lib/auth"
import { Prisma } from "@/generated/prisma"

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(72),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const result = registerSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { email, username, password } = result.data

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: email.toLowerCase() }, { username }],
      },
      select: { id: true, email: true, username: true },
    })

    if (existing) {
      const field = existing.email === email.toLowerCase() ? "email" : "username"
      return NextResponse.json(
        { error: `This ${field} is already in use` },
        { status: 409 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        username,
        passwordHash,
      },
      select: { id: true, email: true, username: true },
    })

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    })

    const response = NextResponse.json({ user }, { status: 201 })

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 })
    }
    console.error("Register error:", error)
    return NextResponse.json({ error: "Registration failed" }, { status: 500 })
  }
}