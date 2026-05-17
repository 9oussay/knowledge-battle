import { SignJWT, jwtVerify } from "jose"
import { hash, compare } from "bcryptjs"

export const AUTH_COOKIE_NAME = "kbr_session"

type SessionPayload = {
  sub: string
  email: string
  username: string
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error("JWT_SECRET is not set")
  }

  return new TextEncoder().encode(secret)
}

export async function hashPassword(password: string) {
  return hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash)
}

export async function signSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret())
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret())
  return payload as SessionPayload
}
