"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"
import { AtSign, KeyRound, Swords, UserCircle2 } from "lucide-react"
import { AuthShell } from "@/components/auth/auth-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      })

      const data = (await response.json()) as { error?: string }

      if (!response.ok) {
        setError(data.error ?? "Unable to register")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Unable to register")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      badge="Inscription"
      title="Créer ton profil joueur"
      description="Ouvre ton compte pour débloquer les duels classés, suivre ta progression et construire ton historique."
      alternateHref="/login"
      alternateLabel="Se connecter"
      alternateText="Déjà inscrit ?"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <AtSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="toi@exemple.com"
              autoComplete="email"
              className="h-12 rounded-xl border-border/80 bg-background/50 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="username">Pseudo</Label>
          <div className="relative">
            <UserCircle2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="battle_name"
              autoComplete="username"
              className="h-12 rounded-xl border-border/80 bg-background/50 pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <span className="text-xs text-muted-foreground">8 caractères minimum</span>
          </div>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Choisis un mot de passe solide"
              autoComplete="new-password"
              className="h-12 rounded-xl border-border/80 bg-background/50 pl-10"
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
          {loading ? "Création du compte..." : "Créer mon compte"}
        </Button>

        <div className="rounded-2xl border border-border/80 bg-background/40 p-4 text-sm text-muted-foreground">
          <div className="mb-2 flex items-center gap-2 font-medium text-foreground">
            <Swords className="h-4 w-4 text-primary" />
            Prêt pour les duels classés
          </div>
          Ton profil démarre au rang Rookie avec suivi de l&apos;XP, historique des matchs et accès direct au dashboard.
        </div>
      </form>
    </AuthShell>
  )
}
