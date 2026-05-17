let audioCtx: AudioContext | null = null

function getAudioContext() {
  if (typeof window === "undefined") return null

  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return null
    audioCtx = new AudioContextClass()
  }

  if (audioCtx.state === "suspended") {
    void audioCtx.resume()
  }

  return audioCtx
}

function playTone({
  frequency,
  duration,
  gain,
  type = "sine",
  detune = 0,
}: {
  frequency: number
  duration: number
  gain: number
  type?: OscillatorType
  detune?: number
}) {
  const context = getAudioContext()
  if (!context) return

  const now = context.currentTime
  const oscillator = context.createOscillator()
  const gainNode = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, now)
  oscillator.detune.setValueAtTime(detune, now)
  gainNode.gain.setValueAtTime(0.0001, now)
  gainNode.gain.exponentialRampToValueAtTime(gain, now + 0.02)
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gainNode)
  gainNode.connect(context.destination)

  oscillator.start(now)
  oscillator.stop(now + duration)
}

export function initSounds() {
  const context = getAudioContext()
  if (!context) return

  window.playCorrect = () => {
    playTone({ frequency: 740, duration: 0.18, gain: 0.08, type: "triangle" })
    setTimeout(() => {
      playTone({ frequency: 980, duration: 0.22, gain: 0.07, type: "triangle" })
    }, 120)
  }

  window.playWrong = () => {
    playTone({ frequency: 220, duration: 0.16, gain: 0.11, type: "sawtooth", detune: -8 })
    setTimeout(() => {
      playTone({ frequency: 160, duration: 0.24, gain: 0.1, type: "sawtooth", detune: -18 })
    }, 120)
  }

  window.playComplete = () => {
    const notes = [523.25, 659.25, 783.99]
    notes.forEach((frequency, index) => {
      setTimeout(() => {
        playTone({ frequency, duration: 0.3, gain: 0.08, type: "triangle" })
      }, index * 160)
    })
  }

  window.playTimeWarning = (timeLeft: number) => {
    const urgency = Math.max(1, Math.min(5, 6 - timeLeft))
    const frequency = 520 + urgency * 72
    const gain = 0.03 + urgency * 0.01
    playTone({ frequency, duration: 0.12, gain, type: "square" })
    setTimeout(() => {
      playTone({ frequency: frequency - 26, duration: 0.08, gain: gain * 0.72, type: "square" })
    }, 120)
  }
}

export function playCorrect() {
  if (typeof window !== "undefined" && window.playCorrect) {
    window.playCorrect()
  }
}

export function playWrong() {
  if (typeof window !== "undefined" && window.playWrong) {
    window.playWrong()
  }
}

export function playComplete() {
  if (typeof window !== "undefined" && window.playComplete) {
    window.playComplete()
  }
}

export function playTimeWarning(timeLeft: number) {
  if (typeof window !== "undefined" && window.playTimeWarning) {
    window.playTimeWarning(timeLeft)
  }
}

declare global {
  interface Window {
    playCorrect: () => void
    playWrong: () => void
    playComplete: () => void
    playTimeWarning: (timeLeft: number) => void
  }
}