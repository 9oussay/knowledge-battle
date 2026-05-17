import type React from "react"
import type { Metadata } from "next"
import { Manrope, Instrument_Sans } from "next/font/google"
import localFont from "next/font/local"
import { Analytics } from "@vercel/analytics/next"
import { LayoutRouter } from "@/components/app/layout-router"
import { RealtimeProvider } from "@/components/realtime-provider"
import { getCurrentSessionUser, isAdminRole } from "@/lib/session"
import "./globals.css"

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
})

const calSans = localFont({
  src: "./fonts/CalSans-SemiBold.woff2",
  variable: "--font-cal-sans",
  display: "swap",
})

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Knowledge Battle Royale",
  description: "Des duels techniques pour apprendre, progresser et monter au classement.",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const sessionUser = await getCurrentSessionUser()
  const premiumActive = !!sessionUser && sessionUser.isPremium && (!sessionUser.premiumUntil || sessionUser.premiumUntil > new Date())

  return (
    <html lang="en" className="dark">
      <body className={`${manrope.variable} ${calSans.variable} ${instrumentSans.variable} relative font-sans antialiased`}>
        <RealtimeProvider>
          <LayoutRouter
            user={
              sessionUser
                ? {
                    username: sessionUser.username,
                    isAdmin: isAdminRole(sessionUser.role),
                    isSponsor: sessionUser.isSponsor,
                    isPremium: sessionUser.isPremium,
                    premiumUntil: sessionUser.premiumUntil ? sessionUser.premiumUntil.toISOString() : null,
                    premiumActive,
                  }
                : null
            }
          >
            {children}
          </LayoutRouter>
          <Analytics />
        </RealtimeProvider>
      </body>
    </html>
  )
}
