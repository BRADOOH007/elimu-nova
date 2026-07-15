'use client'

import { useCallback, useRef } from 'react'

type SoundType = 'message' | 'notification'

let audioCtx: AudioContext | null = null

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.15) {
  try {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)
    gain.gain.setValueAtTime(volume, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* audio not supported */ }
}

const sounds: Record<SoundType, () => void> = {
  message: () => {
    playTone(523.25, 0.12, 'sine', 0.12)
    setTimeout(() => playTone(659.25, 0.18, 'sine', 0.10), 100)
  },
  notification: () => {
    playTone(880, 0.08, 'sine', 0.10)
    setTimeout(() => playTone(1108.73, 0.08, 'sine', 0.10), 80)
    setTimeout(() => playTone(1318.51, 0.12, 'sine', 0.08), 160)
  },
}

export function useNotificationSound() {
  const lastPlayedRef = useRef<Record<string, number>>({})

  const play = useCallback((type: SoundType, key = 'default') => {
    const now = Date.now()
    const last = lastPlayedRef.current[key] || 0
    if (now - last < 2000) return
    lastPlayedRef.current[key] = now
    sounds[type]?.()
  }, [])

  return { play }
}
