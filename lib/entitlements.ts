type EntitlementSource = {
  isSponsor: boolean
  isPremium: boolean
  premiumUntil: Date | null
}

export function isPremiumActive(source: EntitlementSource, now = new Date()) {
  if (!source.isPremium) return false
  if (!source.premiumUntil) return true
  return source.premiumUntil.getTime() > now.getTime()
}

export function getPlanLabel(source: EntitlementSource, now = new Date()) {
  const premiumActive = isPremiumActive(source, now)

  if (premiumActive && source.isSponsor) return "Premium + Sponsor"
  if (premiumActive) return "Premium"
  if (source.isSponsor) return "Sponsor"
  return "Standard"
}

export function getPlanCapabilities(source: EntitlementSource, now = new Date()) {
  const premiumActive = isPremiumActive(source, now)

  return {
    standard: true,
    sponsor: source.isSponsor,
    premium: premiumActive,
  }
}
