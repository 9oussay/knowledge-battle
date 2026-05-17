"use client"

import { useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Cloud,
  Code,
  Crown,
  Loader2,
  Network,
  Server,
  Swords,
  Target,
  Wifi,
  Zap,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageContainer } from "@/components/app/page-container"
import { PageHeader } from "@/components/app/page-header"
import { ContentPanel } from "@/components/app/content-panel"
import { SelectionTile } from "@/components/app/selection-tile"
import { DUEL_RULES } from "@/lib/duel-rules"

type ApiCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  questionCount: number
}

type DuelCategory = {
  id: string
  label: string
  description: string
  questionCount: number
  icon: LucideIcon
}

function getCategoryIcon(name: string) {
  const value = name.toLowerCase()
  if (value.includes("aws") || value.includes("cloud")) return Cloud
  if (value.includes("python") || value.includes("code")) return Code
  if (value.includes("ccna") || value.includes("network") || value.includes("reseau")) return Network
  if (value.includes("devops") || value.includes("infra") || value.includes("server")) return Server
  if (value.includes("ai") || value.includes("ml") || value.includes("data")) return BrainCircuit
  if (value.includes("security") || value.includes("sec")) return Wifi
  return BookOpen
}

const difficulties = [
  { id: "Easy", label: "Facile", points: "5 pts", icon: Target },
  { id: "Medium", label: "Moyen", points: "10 pts", icon: Zap },
  { id: "Hard", label: "Difficile", points: "20 pts", icon: Crown },
]

const duelModes = [
  { id: "solo" as const, label: "Solo", description: "Entraînement chronométré.", icon: Target },
  { id: "private" as const, label: "Room privée", description: "Partage un code avec un ami.", icon: Swords },
  { id: "random" as const, label: "Match rapide", description: "File d'attente automatique.", icon: Zap },
]

export default function DuelCategoryPage() {
  const router = useRouter()
  const [categories, setCategories] = useState<DuelCategory[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [categoriesError, setCategoriesError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>("Medium")
  const [selectedMode, setSelectedMode] = useState<"solo" | "private" | "random">("solo")
  const [roomCodeInput, setRoomCodeInput] = useState("")
  const [roomError, setRoomError] = useState<string | null>(null)
  const [creatingRoom, setCreatingRoom] = useState(false)

  const hasCategories = categories.length > 0
  const selectedCategoryData = categories.find((category) => category.id === selectedCategory)
  const canStartDuel = !!selectedCategory && (selectedCategoryData?.questionCount ?? 0) > 0

  const startLabel = useMemo(() => {
    if (!selectedCategory) return "Sélectionner une catégorie"
    if ((selectedCategoryData?.questionCount ?? 0) <= 0) return "Catégorie sans questions"
    if (selectedMode === "solo") return "Lancer le duel solo"
    if (selectedMode === "random") return "Rechercher un adversaire"
    return "Créer une room privée"
  }, [selectedCategory, selectedCategoryData, selectedMode])

  useEffect(() => {
    let cancelled = false

    async function loadCategories() {
      setLoadingCategories(true)
      setCategoriesError(null)

      try {
        const response = await fetch("/api/duel/categories")
        if (!response.ok) throw new Error("Impossible de charger les catégories")

        const data = (await response.json()) as { categories: ApiCategory[] }
        if (cancelled) return

        const mapped: DuelCategory[] = data.categories.map((category) => ({
          id: category.name,
          label: category.name,
          description:
            category.description || `${category.questionCount} questions disponibles.`,
          questionCount: category.questionCount,
          icon: getCategoryIcon(category.name),
        }))

        setCategories(mapped)
        setSelectedCategory((prev) => prev ?? mapped[0]?.id ?? null)
      } catch {
        if (!cancelled) setCategoriesError("Impossible de récupérer les catégories.")
      } finally {
        if (!cancelled) setLoadingCategories(false)
      }
    }

    void loadCategories()
    return () => {
      cancelled = true
    }
  }, [])

  async function startDuel() {
    if (!canStartDuel || !selectedCategory || !selectedDifficulty) return

    if (selectedMode === "solo") {
      router.push(`/duel/play?category=${selectedCategory}&difficulty=${selectedDifficulty}`)
      return
    }

    setCreatingRoom(true)
    setRoomError(null)

    try {
      const response = await fetch("/api/duel/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          difficulty: selectedDifficulty,
          mode: selectedMode,
        }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(data?.error || "Impossible de créer la room")
      }

      const data = (await response.json()) as { playUrl?: string; roomCode?: string }
      if (data.playUrl) router.push(data.playUrl)
      else if (data.roomCode) router.push(`/duel/play?roomCode=${data.roomCode}`)
      else throw new Error("La room n'a pas pu être ouverte")
    } catch (error) {
      setRoomError(error instanceof Error ? error.message : "Impossible de créer la room")
    } finally {
      setCreatingRoom(false)
    }
  }

  function joinRoom() {
    const normalized = roomCodeInput.trim().toUpperCase()
    if (normalized.length < 4) {
      setRoomError("Entre un code de room valide.")
      return
    }
    setRoomError(null)
    router.push(`/duel/play?roomCode=${normalized}`)
  }

  return (
    <PageContainer size="lg">
      <PageHeader
        eyebrow="Arena"
        title="Configurer un duel"
        description={`${DUEL_RULES.questionsPerDuel} questions · ${DUEL_RULES.timerSeconds}s par question`}
        actions={
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <ContentPanel title="Mode de jeu" description="Choisis comment tu veux jouer">
            <div className="grid gap-2 sm:grid-cols-3">
              {duelModes.map((mode) => (
                <SelectionTile
                  key={mode.id}
                  title={mode.label}
                  description={mode.description}
                  icon={mode.icon}
                  selected={selectedMode === mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                />
              ))}
            </div>
          </ContentPanel>

          <ContentPanel title="Difficulté" description="Points par bonne réponse">
            <div className="grid gap-2 sm:grid-cols-3">
              {difficulties.map((diff) => (
                <SelectionTile
                  key={diff.id}
                  title={diff.label}
                  description={diff.points}
                  icon={diff.icon}
                  selected={selectedDifficulty === diff.id}
                  onClick={() => setSelectedDifficulty(diff.id)}
                />
              ))}
            </div>
          </ContentPanel>

          <ContentPanel title="Catégorie" description="Banque de questions">
            {loadingCategories ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : categoriesError ? (
              <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {categoriesError}
              </p>
            ) : (
              <div className="grid gap-2">
                {categories.map((cat) => (
                  <SelectionTile
                    key={cat.id}
                    title={cat.label}
                    description={cat.description}
                    icon={cat.icon}
                    meta={`${cat.questionCount} Q`}
                    selected={selectedCategory === cat.id}
                    disabled={cat.questionCount <= 0}
                    onClick={() => setSelectedCategory(cat.id)}
                  />
                ))}
              </div>
            )}
          </ContentPanel>
        </div>

        <aside className="space-y-4">
          <ContentPanel title="Lancer">
            <Button
              className="w-full"
              size="lg"
              onClick={startDuel}
              disabled={!canStartDuel || !hasCategories || !!categoriesError || creatingRoom}
            >
              <Swords className="mr-2 h-4 w-4" />
              {creatingRoom ? "Préparation…" : startLabel}
            </Button>
            {roomError ? <p className="mt-3 text-sm text-destructive">{roomError}</p> : null}
          </ContentPanel>

          <ContentPanel title="Rejoindre une room" description="Code partagé par l'hôte">
            <div className="flex flex-col gap-2">
              <Input
                value={roomCodeInput}
                onChange={(event) => setRoomCodeInput(event.target.value)}
                placeholder="Ex. AB12CD"
                className="font-mono uppercase"
              />
              <Button type="button" variant="outline" className="w-full" onClick={joinRoom}>
                Rejoindre
              </Button>
            </div>
          </ContentPanel>

          <ContentPanel title="Règles">
            <ul className="space-y-2 text-xs leading-relaxed text-muted-foreground">
              <li>Verdict court en mode compétitif.</li>
              <li>XP : score ×2 + bonus multijoueur.</li>
              <li>Rang mis à jour après chaque duel.</li>
            </ul>
          </ContentPanel>
        </aside>
      </div>
    </PageContainer>
  )
}
