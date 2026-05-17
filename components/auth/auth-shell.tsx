"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BrandLogo } from "@/components/brand-logo"

type AuthShellProps = {
  badge: string
  title: string
  description: string
  alternateHref: string
  alternateLabel: string
  alternateText: string
  children: React.ReactNode
}

export function AuthShell({
  badge,
  title,
  description,
  alternateHref,
  alternateLabel,
  alternateText,
  children,
}: AuthShellProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="grid w-full max-w-4xl items-center gap-10 lg:grid-cols-2">
        <div className="hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Knowledge Battle</p>
          <h1 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-foreground">
            Apprends en affrontant de vrais adversaires.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            Duels chronométrés, progression XP, classements et rooms privées — une plateforme pensée pour la pratique
            technique, pas pour le spectacle.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="text-primary">—</span>
              Matchmaking rapide par catégorie et difficulté
            </li>
            <li className="flex gap-2">
              <span className="text-primary">—</span>
              Rooms privées avec code à partager
            </li>
            <li className="flex gap-2">
              <span className="text-primary">—</span>
              Historique et badges sur ton dashboard
            </li>
          </ul>
        </div>

        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-0">
            <div className="border-b border-border px-6 py-5 sm:px-8">
              <Link href="/" className="mb-5 inline-flex items-center gap-2.5">
                <BrandLogo className="h-8 w-12" />
                <span className="text-sm font-semibold">Knowledge Battle</span>
              </Link>
              <Badge variant="secondary" className="mb-3">
                {badge}
              </Badge>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>

            <div className="px-6 py-6 sm:px-8">{children}</div>

            <div className="border-t border-border px-6 py-4 text-sm text-muted-foreground sm:px-8">
              {alternateText}{" "}
              <Link href={alternateHref} className="font-medium text-primary hover:underline">
                {alternateLabel}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
