import { getCurrentSessionUser, isAdminRole } from "@/lib/session"

export async function requireAdminUser() {
  const user = await getCurrentSessionUser()
  if (!user || !isAdminRole(user.role)) {
    return null
  }

  return user
}

export function slugifyCategoryName(name: string) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}
