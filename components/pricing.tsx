"use client"

import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const modes = [
  {
    plan: "standard",
    name: "Standard",
    description: "L&apos;essentiel pour commencer et progresser",
    features: ["Accès aux duels publics", "Progression classique", "Récompenses de base", "Présence de publicité"],
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
    plan: "sponsor",
    name: "Sponsor (Ba9chich)",
    description: "Soutenir le projet et débloquer des avantages visuels",
    features: ["Badge Sponsor", "Cosmétiques exclusifs", "Bonus de progression", "Récompenses spéciales à chaque rang"],
    cta: "Devenir sponsor",
    highlighted: true,
  },
  {
    plan: "premium",
    name: "Premium",
    description: "Pour aller plus loin et s&apos;entraîner sans limite",
    features: ["Catégories avancées", "Statistiques détaillées", "Entraînement illimité", "Accès prioritaire aux nouveautés"],
    cta: "Passer premium",
    highlighted: false,
  },
]

function BorderBeam() {
  return (
    <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
      <div
        className="absolute w-24 h-24 bg-primary/30 blur-xl border-beam"
        style={{
          offsetPath: "rect(0 100% 100% 0 round 16px)",
        }}
      />
    </div>
  )
}

export function Pricing() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section id="modes" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2
            className="text-3xl sm:text-4xl font-bold text-foreground mb-4"
            style={{ fontFamily: "var(--font-instrument-sans)" }}
          >
            Offres et accès
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Une offre gratuite pour démarrer, un soutien sponsor pour la communauté, et un accès premium pour aller plus loin.
          </p>
        </motion.div>

        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {modes.map((mode, index) => (
            <motion.div
              key={mode.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
              className={`relative p-6 rounded-2xl border transition-all duration-300 hover:scale-[1.02] ${
                mode.highlighted ? "bg-card border-ring/50" : "bg-card/60 border-border hover:border-ring/40"
              }`}
            >
              {mode.highlighted && <BorderBeam />}

              {mode.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Recommandé
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">{mode.name}</h3>
                <p className="text-muted-foreground text-sm">{mode.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {mode.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm text-foreground/90">
                    <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                asChild
                variant={mode.highlighted ? "default" : "outline"}
                className={`w-full rounded-full ${mode.highlighted ? "shimmer-btn" : ""}`}
              >
                <Link href={`/billing?plan=${mode.plan}`}>{mode.cta}</Link>
              </Button>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
