"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

type LeaderboardLiveRefreshProps = {
  intervalMs?: number
}

export function LeaderboardLiveRefresh({ intervalMs = 20000 }: LeaderboardLiveRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh()
    }, intervalMs)

    return () => clearInterval(interval)
  }, [intervalMs, router])

  return null
}