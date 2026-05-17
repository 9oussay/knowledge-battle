"use client"

import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Swords, Clock, CheckCircle2, XCircle, Trophy, RotateCcw, Home, Users, Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRealtimeSocket } from "@/components/realtime-provider"
import { DUEL_RULES } from "@/lib/duel-rules"
import type { MatchView } from "@/lib/duel-match"
import { playCorrect, playWrong, playComplete, playTimeWarning, initSounds } from "@/lib/sounds"

type Question = {
  id: string
  question: string
  choices: string[]
  answer: number
  points: number
  category: string
}

const TIMER_SECONDS = DUEL_RULES.timerSeconds
const QUESTIONS_PER_DUEL = 20

type Phase = "loading" | "waiting" | "playing" | "feedback" | "done"

function DuelPlay() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const roomCode = searchParams.get("roomCode")?.trim().toUpperCase() ?? null
  const category = searchParams.get("category") ?? "CCNA"
  const difficulty = searchParams.get("difficulty") ?? "Medium"
  const isMultiplayer = Boolean(roomCode)
  const { socket } = useRealtimeSocket()

  const [questions, setQuestions] = useState<Question[]>([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(TIMER_SECONDS)
  const [score, setScore] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [phase, setPhase] = useState<Phase>("loading")
  const [xpEarned, setXpEarned] = useState(0)
  const [matchView, setMatchView] = useState<MatchView | null>(null)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [isResolving, setIsResolving] = useState(false)

  const totalPoints = useMemo(() => questions.reduce((total, question) => total + question.points, 0), [questions])

  const currentPlayerXp = useMemo(() => {
    if (!matchView || !isMultiplayer) return 0
    if (matchView.playerRole === "host") return matchView.hostState?.xpEarned ?? 0
    if (matchView.playerRole === "guest") return matchView.guestState?.xpEarned ?? 0
    return 0
  }, [isMultiplayer, matchView])

  const currentPlayerState = useMemo(() => {
    if (!matchView) return null
    if (matchView.playerRole === "host") return matchView.hostState
    if (matchView.playerRole === "guest") return matchView.guestState
    return null
  }, [matchView])

  useEffect(() => {
    initSounds()
  }, [])

  useEffect(() => {
    if (isMultiplayer) return

    let cancelled = false

    fetch(`/api/duel/questions?category=${category}&difficulty=${difficulty}&count=${QUESTIONS_PER_DUEL}`)
      .then((r) => r.json())
      .then((d) => {
        setQuestions(d.questions)
        setAnswers(new Array(d.questions.length).fill(null))
        setCurrent(0)
        setSelected(null)
        setScore(0)
        setTimeLeft(TIMER_SECONDS)
        setXpEarned(0)
        setMatchError(null)
        setPhase("playing")
      })
      .catch(() => {
        if (!cancelled) {
          setMatchError("Impossible de charger les questions.")
        }
      })

    return () => {
      cancelled = true
    }
  }, [isMultiplayer, category, difficulty])

  const syncMatch = useCallback((nextMatch: MatchView) => {
    setMatchView(nextMatch)
    setMatchError(null)

    if (nextMatch.questions.length > 0) {
      setQuestions(nextMatch.questions)
      setAnswers(new Array(nextMatch.questions.length).fill(null))
      setCurrent(0)
      setSelected(null)
      setScore(0)
      setTimeLeft(TIMER_SECONDS)
    }

    if (nextMatch.status === "FINISHED") {
      const xp =
        nextMatch.playerRole === "host"
          ? nextMatch.hostState?.xpEarned ?? 0
          : nextMatch.guestState?.xpEarned ?? 0
      setXpEarned(xp)
      playComplete()
      setPhase("done")
      return
    }

    const currentState =
      nextMatch.playerRole === "host" ? nextMatch.hostState : nextMatch.guestState

    if (nextMatch.status === "ACTIVE") {
      setPhase(currentState?.completed ? "waiting" : "playing")
      return
    }

    setPhase("waiting")
  }, [])

  useEffect(() => {
    if (!isMultiplayer || !roomCode) return

    let cancelled = false

    async function joinRoom() {
      try {
        const response = await fetch(`/api/duel/matches/${roomCode}/join`, { method: "POST" })
        const data = (await response.json().catch(() => ({}))) as { match?: MatchView; error?: string }

        if (!response.ok || !data.match) {
          throw new Error(data.error || "Impossible de rejoindre la room")
        }

        if (!cancelled) {
          syncMatch(data.match)
        }
      } catch (error) {
        if (!cancelled) {
          setMatchError(error instanceof Error ? error.message : "Impossible de rejoindre la room")
          setPhase("done")
        }
      }
    }

    void joinRoom()

    return () => {
      cancelled = true
    }
  }, [isMultiplayer, roomCode, syncMatch])

  useEffect(() => {
    if (!isMultiplayer || !roomCode || !socket) return

    let cancelled = false

    const handleMatchState = (payload: { match: MatchView }) => {
      if (payload.match.roomCode !== roomCode) return
      syncMatch(payload.match)
    }

    socket.emit("duel:subscribe", { roomCode }, (response: { ok: boolean; match?: MatchView; error?: string }) => {
      if (cancelled || !response.ok || !response.match) return
      syncMatch(response.match)
    })

    socket.on("duel:state", handleMatchState)

    return () => {
      cancelled = true
      socket.off("duel:state", handleMatchState)
    }
  }, [isMultiplayer, roomCode, socket, syncMatch])

  useEffect(() => {
    if (!isMultiplayer || !roomCode || phase !== "waiting") return
    if (matchView?.status === "ACTIVE") return

    let cancelled = false

    const pollMatch = async () => {
      try {
        const response = await fetch(`/api/duel/matches/${roomCode}`)
        if (!response.ok) return

        const data = (await response.json()) as { match?: MatchView }
        if (!cancelled && data.match) {
          syncMatch(data.match)
        }
      } catch {
        // ignore transient poll errors
      }
    }

    const interval = window.setInterval(() => {
      void pollMatch()
    }, 2000)

    void pollMatch()

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [isMultiplayer, roomCode, phase, matchView?.status, syncMatch])

  const advance = useCallback(
    (chosenIndex: number | null) => {
      const q = questions[current]
      if (!q) return
      const correct = chosenIndex === q.answer
      
      if (correct) {
        playCorrect()
      } else {
        playWrong()
      }

      const newScore = correct ? score + q.points : score
      const newAnswers = [...answers]
      newAnswers[current] = chosenIndex
      setAnswers(newAnswers)
      setScore(newScore)
      setSelected(chosenIndex)
      setPhase("feedback")

      setTimeout(() => {
        if (current + 1 >= questions.length) {
          if (isMultiplayer && roomCode) {
            setIsResolving(true)

            fetch(`/api/duel/matches/${roomCode}/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ answers: newAnswers }),
            })
              .then((r) => r.json())
              .then((d) => {
                const nextMatch = d.match as MatchView | undefined
                if (nextMatch) {
                  setMatchView(nextMatch)
                  const earned = nextMatch.playerRole === "host" ? nextMatch.hostState?.xpEarned ?? 0 : nextMatch.guestState?.xpEarned ?? 0
                  setXpEarned(earned)
                  if (nextMatch.status === "FINISHED") {
                    playComplete()
                    setPhase("done")
                  } else {
                    setPhase("waiting")
                  }
                } else {
                  setPhase("waiting")
                }
              })
              .catch((error) => {
                setMatchError(error instanceof Error ? error.message : "Impossible de finaliser le match")
                setPhase("waiting")
              })
              .finally(() => {
                setIsResolving(false)
              })
          } else {
            fetch("/api/duel/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ category, score: newScore, total: totalPoints, difficulty, mode: "SOLO" }),
            })
              .then((r) => r.json())
              .then((d) => setXpEarned(d.xpEarned ?? 0))
            playComplete()
            setPhase("done")
          }
        } else {
          setCurrent((c) => c + 1)
          setSelected(null)
          setTimeLeft(TIMER_SECONDS)
          setPhase("playing")
        }
      }, 1200)
    },
    [questions, current, score, answers, category, difficulty, totalPoints, isMultiplayer, roomCode],
  )

  // Timer
  useEffect(() => {
    if (phase !== "playing") return

    if (timeLeft <= 0) {
      const timeout = setTimeout(() => advance(null), 0)
      return () => clearTimeout(timeout)
    }

    if (timeLeft <= 5) {
      playTimeWarning(timeLeft)
    }

    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, phase, advance])

  if (phase === "loading") {
    return (
      <main className="flex items-center justify-center px-4 py-12">
        <div className="text-center space-y-3 max-w-sm px-4">
          <Swords className="h-10 w-10 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">{isMultiplayer ? "Connexion a la room..." : "Chargement des questions..."}</p>
          {matchError && <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{matchError}</p>}
        </div>
      </main>
    )
  }

  if (phase === "waiting") {
    return (
      <main className="app-page flex flex-col items-center justify-center bg-transparent px-4">
        <div className="w-full max-w-md space-y-5 rounded-lg border border-border bg-card p-6 text-center">
          <Users className="mx-auto h-10 w-10 text-primary" />
          <h1 className="text-2xl font-bold">Room en attente</h1>
          <p className="text-sm text-muted-foreground">
            {currentPlayerState?.completed
              ? "Tes réponses sont enregistrées. On attend que l&apos;autre joueur termine pour calculer le verdict final."
              : "Partage le code avec ton adversaire et attends qu&apos;il rejoigne la partie."}
          </p>
          {roomCode && (
            <div className="rounded-xl border border-border bg-background/40 p-4 text-left">
              <p className="text-xs text-muted-foreground">Code room</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="text-lg font-semibold tracking-[0.24em]">{roomCode}</code>
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/dashboard")}>
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button className="flex-1 " onClick={() => router.push("/duel")}>Retour duel</Button>
          </div>
        </div>
      </main>
    )
  }

  if (phase === "done") {
    if (matchError && !matchView && isMultiplayer) {
      return (
        <main className="app-page flex flex-col items-center justify-center bg-transparent px-4">
          <div className="w-full max-w-md space-y-4 rounded-2xl border border-destructive/40 bg-destructive/10 p-6 text-center">
            <h1 className="text-2xl font-bold text-destructive">Impossible d&apos;ouvrir la room</h1>
            <p className="text-sm text-destructive/90">{matchError}</p>
            <Button className="" onClick={() => router.push("/duel")}>Retour au duel</Button>
          </div>
        </main>
      )
    }

    const total = totalPoints || questions.length * 10
    const pct = total > 0 ? Math.round((score / total) * 100) : 0

    if (isMultiplayer && matchView) {
      const hostScore = matchView.hostState?.score ?? 0
      const guestScore = matchView.guestState?.score ?? 0
      const hostXp = matchView.hostState?.xpEarned ?? 0
      const guestXp = matchView.guestState?.xpEarned ?? 0
      const playerXp = currentPlayerXp

      return (
        <main className="app-page flex flex-col items-center justify-center bg-transparent px-4 py-8">
          <div className="w-full max-w-2xl space-y-6 text-center">
            <Trophy className="mx-auto h-16 w-16 text-yellow-400" />
            <h1 className="text-3xl font-bold">Match terminé</h1>
            <p className="text-sm text-muted-foreground">Room {matchView.roomCode} · {matchView.category} · {matchView.difficulty}</p>

            <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4 text-left backdrop-blur-sm">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">Joueur 1</p>
                  <p className="mt-1 font-semibold">{matchView.hostUsername}</p>
                  <p className="text-sm text-yellow-400">{hostScore} pts · +{hostXp} XP</p>
                </div>
                <div className="rounded-xl bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">Joueur 2</p>
                  <p className="mt-1 font-semibold">{matchView.guestUsername ?? "En attente"}</p>
                  <p className="text-sm text-yellow-400">{guestScore} pts · +{guestXp} XP</p>
                </div>
                <div className="rounded-xl bg-background/60 p-4">
                  <p className="text-xs text-muted-foreground">Verdict</p>
                  <p className="mt-1 font-semibold text-primary">{matchView.winnerUsername ?? "No feedback"}</p>
                  <p className="text-sm text-muted-foreground">Ton gain: +{playerXp} XP</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1 bg-transparent" onClick={() => router.push("/dashboard") }>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </Button>
              <Button className="flex-1 " onClick={() => router.push("/duel")}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Nouveau duel
              </Button>
            </div>
          </div>
        </main>
      )
    }

    return (
      <main className="app-page flex flex-col items-center justify-center bg-transparent px-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Trophy className="h-16 w-16 text-yellow-400 mx-auto" />
          <h1 className="text-3xl font-bold">Duel terminé !</h1>
          <div className="rounded-2xl border border-border bg-card/60 p-6 space-y-4">
            <div className="text-5xl font-bold text-primary">{pct}%</div>
            <p className="text-muted-foreground">
              {score} / {total} points
            </p>
            <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-400">
              <Trophy className="h-4 w-4" />
              +{xpEarned} XP gagné
            </div>
            <div className="grid grid-cols-3 gap-3 pt-2 text-sm">
              <div className="rounded-xl bg-background/60 p-3">
                <p className="text-2xl font-bold text-green-400">
                  {answers.filter((a, i) => a === questions[i]?.answer).length}
                </p>
                <p className="text-muted-foreground">Correctes</p>
              </div>
              <div className="rounded-xl bg-background/60 p-3">
                <p className="text-2xl font-bold text-red-400">
                  {answers.filter((a, i) => a !== null && a !== questions[i]?.answer).length}
                </p>
                <p className="text-muted-foreground">Incorrectes</p>
              </div>
              <div className="rounded-xl bg-background/60 p-3">
                <p className="text-2xl font-bold text-muted-foreground">
                  {answers.filter((a) => a === null).length}
                </p>
                <p className="text-muted-foreground">Manquées</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={() => router.push("/dashboard")}
            >
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              className="flex-1 "
              onClick={() => router.push(`/duel/play?category=${category}&difficulty=${difficulty}`)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Rejouer
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const q = questions[current]
  const timerPct = (timeLeft / TIMER_SECONDS) * 100
  const timerColor = timeLeft > 8 ? "bg-green-500" : timeLeft > 4 ? "bg-yellow-500" : "bg-red-500"

  return (
    <main className="flex flex-col items-center px-4 py-8 lg:px-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Swords className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">{category}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Question{" "}
            <span className="font-semibold text-foreground">
              {current + 1}/{questions.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium">
            <Trophy className="h-4 w-4 text-yellow-400" />
            {score} pts
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-border/60 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((current) / questions.length) * 100}%` }}
          />
        </div>

        {/* Timer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Temps restant
            </div>
            <span className={`font-bold text-lg ${timeLeft <= 4 ? "text-red-400" : timeLeft <= 8 ? "text-yellow-400" : "text-green-400"}`}>
              {timeLeft}s
            </span>
          </div>
          <div className="h-2 bg-border/60 overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${timerColor}`}
              style={{ width: `${timerPct}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="rounded-2xl border border-border bg-card/60 backdrop-blur-sm p-6">
          <p className="text-lg font-semibold leading-snug">{q.question}</p>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-1 gap-3">
          {q.choices.map((choice, i) => {
            let style =
              "w-full rounded-xl border border-border bg-card/40 px-5 py-4 text-left text-sm font-medium transition-all duration-200 hover:bg-card/80 hover:border-primary/50"

            if (phase === "feedback") {
              if (i === q.answer) {
                style =
                  "w-full rounded-xl border border-green-500/60 bg-green-500/10 px-5 py-4 text-left text-sm font-medium text-green-400"
              } else if (i === selected && selected !== q.answer) {
                style =
                  "w-full rounded-xl border border-red-500/60 bg-red-500/10 px-5 py-4 text-left text-sm font-medium text-red-400"
              }
            }

            return (
              <button
                key={i}
                onClick={() => phase === "playing" && advance(i)}
                disabled={phase !== "playing" || isResolving}
                className={style}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-current text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>{choice}</span>
                  {phase === "feedback" && i === q.answer && (
                    <CheckCircle2 className="ml-auto h-4 w-4 text-green-400" />
                  )}
                  {phase === "feedback" && i === selected && selected !== q.answer && (
                    <XCircle className="ml-auto h-4 w-4 text-red-400" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}

export default function DuelPlayPage() {
  return (
    <Suspense>
      <DuelPlay />
    </Suspense>
  )
}
