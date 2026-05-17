import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export type SessionUser = {
  id: string
  email: string
  username: string
  role: "USER" | "ADMIN"
  isSponsor: boolean
  isPremium: boolean
  premiumUntil: Date | null
}

export function isAdminRole(role: SessionUser["role"]) {
  return role === "ADMIN"
}

export async function getCurrentSessionUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(AUTH_COOKIE_NAME)?.value
  if (!token) return null

  try {
    const session = await verifySessionToken(token)
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isSponsor: true,
        isPremium: true,
        premiumUntil: true,
      },
    })
    if (!user) return null

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: (user.role ?? "USER") as "USER" | "ADMIN",
      isSponsor: user.isSponsor,
      isPremium: user.isPremium,
      premiumUntil: user.premiumUntil,
    }
  } catch {
    return null
  }
}
