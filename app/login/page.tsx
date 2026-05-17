"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { Eye, KeyRound, UserCircle2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  const router = useRouter()
  const [identity, setIdentity] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity, password }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(data.error ?? "Unable to login")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Unable to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      badge="Connexion"
      title="Bon retour"
      description="Connecte-toi pour retrouver tes duels, suivre ta progression et accéder à ton espace joueur."
      alternateHref="/register"
      alternateLabel="Créer un compte"
      alternateText="Pas encore inscrit ?"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="identity">Email ou pseudo</Label>
          <div className="relative">
            <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="identity"
              value={identity}
              onChange={(event) => setIdentity(event.target.value)}
              placeholder="toi@exemple.com ou battle_name"
              autoComplete="username"
              className="h-12 rounded-xl border-border/80 bg-background/50 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <span className="text-xs text-muted-foreground">Session sécurisée</span>
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Eye className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Entre ton mot de passe"
              autoComplete="current-password"
              className="h-12 rounded-xl border-border/80 bg-background/50 pl-10 pr-10"
              required
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Button type="submit" className="h-11 w-full" disabled={loading}>
          {loading ? "Connexion en cours..." : "Accéder au dashboard"}
        </Button>

        <div className="rounded-2xl border border-border/80 bg-background/40 p-4 text-sm text-muted-foreground">
          En duel compétitif, les verdicts restent courts et sans explication détaillée pour garder le rythme du match.
        </div>
      </form>
    </AuthShell>
  )
}
