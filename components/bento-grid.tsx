"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useEffect, useState } from "react"
import { Activity, Command, BarChart3, Zap, Shield } from "lucide-react"

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

function SystemStatus() {
  const [dots, setDots] = useState([true, true, true, false, true])

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => prev.map(() => Math.random() > 0.2))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-2">
      {dots.map((active, i) => (
        <motion.div
          key={i}
          className={`w-2 h-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}
          animate={active ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

function KeyboardCommand() {
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setPressed(true)
      setTimeout(() => setPressed(false), 200)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex items-center gap-1">
      <motion.kbd
        animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
        className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono"
      >
        ⌘
      </motion.kbd>
      <motion.kbd
        animate={pressed ? { scale: 0.95, y: 2 } : { scale: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-300 font-mono"
      >
        K
      </motion.kbd>
    </div>
  )
}

function AnimatedChart() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  const points = [
    { x: 0, y: 60 },
    { x: 20, y: 45 },
    { x: 40, y: 55 },
    { x: 60, y: 30 },
    { x: 80, y: 40 },
    { x: 100, y: 15 },
  ]

  const pathD = points.reduce((acc, point, i) => {
    return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`
  }, "")

  return (
    <svg ref={ref} viewBox="0 0 100 70" className="w-full h-24">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(255,255,255)" stopOpacity="0.2" />
          <stop offset="100%" stopColor="rgb(255,255,255)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {isInView && (
        <>
          <path d={`${pathD} L 100 70 L 0 70 Z`} fill="url(#chartGradient)" className="opacity-50" />
          <path d={pathD} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" className="draw-line" />
        </>
      )}
    </svg>
  )
}

export function BentoGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="how-it-works" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Ce que propose la plateforme
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Profils joueurs, duels par catégorie, arbitrage automatisé, progression et communauté : tout est pensé
            pour rendre l&apos;apprentissage plus vivant.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {/* Large card - System Status */}
          <motion.div
            variants={itemVariants}
            className="md:col-span-2 group relative p-6 rounded-2xl bg-card border border-border hover:border-ring/60 hover:scale-[1.02] transition-all duration-300 overflow-hidden"
          >
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="p-2 rounded-lg bg-accent w-fit mb-4">
                  <Activity className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">Duels arbitrés par l&apos;IA</h3>
                <p className="text-muted-foreground text-sm">
                  Affrontez un ami ou rejoignez une partie aléatoire en Python, JavaScript, networking et plus encore.
                  Tout le monde reçoit le même défi, puis l&apos;IA départage les joueurs automatiquement.
                </p>
              </div>
              <SystemStatus />
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Inscription", value: "Profil" },
                { label: "Historique", value: "Duels" },
                { label: "Arbitrage", value: "IA" },
                { label: "Verdict", value: "Final" },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className="text-2xl font-bold text-foreground mb-1">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Command Palette */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-card border border-border hover:border-ring/60 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-accent w-fit mb-4">
              <Command className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Catégories ciblées</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Choisissez un thème et entrez directement dans un duel adapté à vos compétences.
            </p>
            <KeyboardCommand />
          </motion.div>

          {/* Analytics */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-card border border-border hover:border-ring/60 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-accent w-fit mb-4">
              <BarChart3 className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Leaderboard</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Suivez votre progression dans les classements généraux et dans chaque catégorie.
            </p>
            <AnimatedChart />
          </motion.div>

          {/* Performance */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-card border border-border hover:border-ring/60 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-accent w-fit mb-4">
              <Zap className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Progression et rangs</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Chaque victoire rapporte de l&apos;XP, débloque des badges et fait évoluer votre rang au fil des matchs.
            </p>
            <div className="flex items-center gap-2 text-primary text-sm">
              <span className="font-mono">XP</span>
              <span className="text-muted-foreground">badges, rangs, récompenses</span>
            </div>
          </motion.div>

          {/* Security */}
          <motion.div
            variants={itemVariants}
            className="group relative p-6 rounded-2xl bg-card border border-border hover:border-ring/60 hover:scale-[1.02] transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-accent w-fit mb-4">
              <Shield className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Règles de compétition</h3>
            <p className="text-muted-foreground text-sm mb-4">
              En mode compétitif, le verdict est rendu sans retour détaillé. L&apos;objectif : garder des matchs fluides,
              clairs et sans contestation interminable.
            </p>
            <div className="flex items-center gap-2">
              <span className="px-2 py-1 text-xs bg-accent rounded text-muted-foreground">No feedback</span>
              <span className="px-2 py-1 text-xs bg-accent rounded text-muted-foreground">Verdict final</span>
              <span className="px-2 py-1 text-xs bg-accent rounded text-muted-foreground">Fair play</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
