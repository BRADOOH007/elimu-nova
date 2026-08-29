'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTTSOptions {
  paragraphs: string[]
  rate?: number
  onParagraphChange?: (index: number | null) => void
}

interface UseTTSReturn {
  speaking: boolean
  paused: boolean
  currentParagraph: number | null
  rate: number
  setRate: (r: number) => void
  play: (fromIndex?: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  toggle: () => void
  voices: SpeechSynthesisVoice[]
  selectedVoice: string
  selectVoice: (name: string) => void
}

const VOICE_PREF_KEY = 'tts-preferred-voice'
const RATE_PREF_KEY = 'tts-preferred-rate'

// Prioritized voice name patterns for natural-sounding English
const PREFERRED_VOICES = [
  // Premium / neural voices (Chrome on some OS)
  'Google UK English Female',
  'Google UK English Male',
  'Google US English',
  'Google English',
  // macOS natural voices
  'Samantha',
  'Alex',
  'Victoria',
  'Karen',
  'Daniel',
  'Moira',
  'Tessa',
  // Windows natural voices
  'Microsoft Zira',
  'Microsoft David',
  'Microsoft Mark',
  'Microsoft Hazelnut',
  // Fallback patterns
  'English',
  'en-',
]

function pickBestVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null

  // Check saved preference first
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(VOICE_PREF_KEY)
    if (saved) {
      const match = voices.find(v => v.name === saved)
      if (match) return match
    }
  }

  // Try each preferred pattern in order
  for (const pattern of PREFERRED_VOICES) {
    const match = voices.find(v =>
      v.name.includes(pattern) && v.lang.startsWith('en')
    )
    if (match) return match
  }

  // Fallback: first English voice
  const english = voices.find(v => v.lang.startsWith('en'))
  return english || voices[0]
}

// Clean text for SSML — escape XML entities, add natural pauses
function toSSML(text: string): string {
  let clean = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

  // Add short pauses after sentences ending with period/comma
  clean = clean.replace(/([.!?])\s+/g, '$1 <break time="300ms"/> ')
  clean = clean.replace(/,\s*/g, ', <break time="150ms"/> ')

  // Add medium pauses for em-dashes and semicolons
  clean = clean.replace(/—\s*/g, '<break time="400ms"/> ')
  clean = clean.replace(/;\s*/g, '<break time="300ms"/> ')

  return `<speak>${clean}</speak>`
}

export function useTTS({ paragraphs, rate: initialRate = 1, onParagraphChange }: UseTTSOptions): UseTTSReturn {
  const [speaking, setSpeaking] = useState(false)
  const [paused, setPaused] = useState(false)
  const [currentParagraph, setCurrentParagraph] = useState<number | null>(null)
  const [rate, setRateState] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(RATE_PREF_KEY)
      if (saved) return parseFloat(saved) || initialRate
    }
    return initialRate
  })
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceName, setSelectedVoiceName] = useState('')

  const synthRef = useRef<SpeechSynthesis | null>(null)
  const currentParaRef = useRef(0)
  const isActiveRef = useRef(false)
  const paragraphsRef = useRef(paragraphs)
  const rateRef = useRef(rate)
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)

  // Keep refs in sync
  paragraphsRef.current = paragraphs
  rateRef.current = rate

  // Initialize speech synthesis and load voices
  useEffect(() => {
    if (typeof window === 'undefined') return
    synthRef.current = window.speechSynthesis

    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices()
      setVoices(v)
      const best = pickBestVoice(v)
      if (best) {
        voiceRef.current = best
        setSelectedVoiceName(best.name)
      }
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.cancel()
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  // Sync voice selection to ref
  useEffect(() => {
    const v = voices.find(v => v.name === selectedVoiceName)
    if (v) voiceRef.current = v
  }, [selectedVoiceName, voices])

  const selectVoice = useCallback((name: string) => {
    setSelectedVoiceName(name)
    if (typeof window !== 'undefined') {
      localStorage.setItem(VOICE_PREF_KEY, name)
    }
  }, [])

  const setRate = useCallback((r: number) => {
    setRateState(r)
    if (typeof window !== 'undefined') {
      localStorage.setItem(RATE_PREF_KEY, String(r))
    }
  }, [])

  // Notify parent of paragraph changes
  useEffect(() => {
    onParagraphChange?.(currentParagraph)
  }, [currentParagraph, onParagraphChange])

  const speakParagraph = useCallback((index: number) => {
    const synth = synthRef.current
    const paras = paragraphsRef.current
    if (!synth || paras.length === 0 || index >= paras.length) {
      setSpeaking(false)
      setPaused(false)
      setCurrentParagraph(null)
      isActiveRef.current = false
      return
    }

    isActiveRef.current = true
    currentParaRef.current = index
    setCurrentParagraph(index)

    // Cancel any in-progress speech
    synth.cancel()

    const u = new SpeechSynthesisUtterance(paras[index])
    u.rate = rateRef.current
    u.pitch = 1
    u.volume = 1

    if (voiceRef.current) {
      u.voice = voiceRef.current
    }

    u.onend = () => {
      if (!isActiveRef.current) return
      // Smooth transition to next paragraph after a brief pause
      setTimeout(() => {
        if (isActiveRef.current) {
          speakParagraph(index + 1)
        }
      }, 200)
    }

    u.onerror = (e) => {
      // 'canceled' is expected when we call cancel() ourselves
      if (e.error === 'canceled') return
      console.warn('[TTS] Speech error:', e.error)
      setSpeaking(false)
      setPaused(false)
      setCurrentParagraph(null)
      isActiveRef.current = false
    }

    synth.speak(u)
  }, [])

  const play = useCallback((fromIndex = 0) => {
    const synth = synthRef.current
    if (!synth) return

    synth.cancel()
    isActiveRef.current = true
    setSpeaking(true)
    setPaused(false)

    // Small delay to let cancel() settle before starting new speech
    setTimeout(() => {
      if (isActiveRef.current) {
        speakParagraph(fromIndex)
      }
    }, 50)
  }, [speakParagraph])

  const pause = useCallback(() => {
    const synth = synthRef.current
    if (!synth) return
    synth.pause()
    setSpeaking(false)
    setPaused(true)
  }, [])

  const resume = useCallback(() => {
    const synth = synthRef.current
    if (!synth) return
    synth.resume()
    setSpeaking(true)
    setPaused(false)
  }, [])

  const stop = useCallback(() => {
    const synth = synthRef.current
    if (synth) synth.cancel()
    isActiveRef.current = false
    setSpeaking(false)
    setPaused(false)
    setCurrentParagraph(null)
    currentParaRef.current = 0
  }, [])

  const toggle = useCallback(() => {
    if (speaking) {
      pause()
    } else if (paused && currentParagraph !== null) {
      resume()
    } else {
      play(currentParagraph ?? 0)
    }
  }, [speaking, paused, currentParagraph, pause, resume, play])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const synth = synthRef.current
      if (synth) {
        isActiveRef.current = false
        synth.cancel()
      }
    }
  }, [])

  return {
    speaking,
    paused,
    currentParagraph,
    rate,
    setRate,
    play,
    pause,
    resume,
    stop,
    toggle,
    voices,
    selectedVoice: selectedVoiceName,
    selectVoice,
  }
}
