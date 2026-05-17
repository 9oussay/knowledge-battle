"use client"

import { motion, useInView } from "framer-motion"
import { useRef, useState } from "react"

const sponsors = [
  { name: "Sponsor", src: "/sponsors/vercel.svg" },
  { name: "Community", src: "/sponsors/github.svg" },
  { name: "Discord", src: "/sponsors/discord.svg" },
  { name: "Learning Hub", src: "/sponsors/stripe.svg" },
  { name: "Code Arena", src: "/sponsors/linear.svg" },
  { name: "Battle Club", src: "/sponsors/notion.svg" },
]

export function LogoMarquee() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [failed, setFailed] = useState<Record<string, boolean>>({})

  return (
    <section id="community" ref={ref} className="py-16 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">
          Communauté, soutien et matchmaking
        </p>
      </motion.div>

      <div className="relative">
        {/* Fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        {/* Marquee container */}
        <div className="flex animate-marquee">
          {[...sponsors, ...sponsors].map((sponsor, index) => (
            <div
              key={index}
              className="group flex items-center justify-center min-w-[180px] h-16 mx-8 opacity-70 hover:opacity-100 transition-all duration-300"
            >
              {!failed[sponsor.src] ? (
                <img
                  src={sponsor.src}
                  alt={`${sponsor.name} logo`}
                  className="h-6 w-auto max-w-[140px] object-contain grayscale group-hover:grayscale-0 transition"
                  loading="lazy"
                  onError={() => setFailed((prev) => ({ ...prev, [sponsor.src]: true }))}
                />
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-8 h-8 rounded-lg bg-card border border-border flex items-center justify-center">
                    <span className="text-xs font-bold">{sponsor.name[0]}</span>
                  </div>
                  <span className="font-medium" style={{ fontFamily: "var(--font-instrument-sans)" }}>
                    {sponsor.name}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
