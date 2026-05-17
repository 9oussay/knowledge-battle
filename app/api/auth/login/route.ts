import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, signSessionToken, verifyPassword } from "@/lib/auth"

const loginSchema = z.object({
  identity: z.string().min(3),
  password: z.string().min(8).max(72),
})

export async function POST(req: Request) {
  try {
    const json = await req.json()
    const result = loginSchema.safeParse(json)

    if (!result.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 })
    }

    const { identity, password } = result.data
    const normalizedIdentity = identity.trim().toLowerCase()

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedIdentity }, { username: normalizedIdentity }],
      },
      select: {
        id: true,
        email: true,
        username: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.passwordHash)

    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await signSessionToken({
      sub: user.id,
      email: user.email,
      username: user.username,
    })

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      },
      { status: 200 },
    )

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
  } catch {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
