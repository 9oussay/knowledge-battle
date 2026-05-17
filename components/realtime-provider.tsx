"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { io, type Socket } from "socket.io-client"

type RealtimeContextValue = {
  socket: Socket | null
  connected: boolean
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [socket] = useState<Socket | null>(() => {
    if (typeof window === "undefined") return null

    return io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      withCredentials: true,
    })
  })
  const [connected, setConnected] = useState(() => socket?.connected ?? false)

  useEffect(() => {
    if (!socket) return

    const handleConnect = () => setConnected(true)
    const handleDisconnect = () => setConnected(false)

    socket.on("connect", handleConnect)
    socket.on("disconnect", handleDisconnect)

    return () => {
      socket.off("connect", handleConnect)
      socket.off("disconnect", handleDisconnect)
      socket.disconnect()
    }
  }, [socket])

  const value = useMemo(() => ({ socket, connected }), [socket, connected])

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
}

export function useRealtimeSocket() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error("useRealtimeSocket must be used inside RealtimeProvider")
  }

  return context
}
