'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { HopeAITutorDrawer } from '@/components/ai-tutor-drawer'

interface AITutorContextValue {
  isOpen: boolean
  openAITutor: (initialPrompt?: string, contextSubject?: string, contextTopic?: string) => void
  closeAITutor: () => void
}

const AITutorContext = createContext<AITutorContextValue | null>(null)

export function AITutorProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [sessionKey, setSessionKey] = useState(0)
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>()
  const [contextSubject, setContextSubject] = useState<string | undefined>()
  const [contextTopic, setContextTopic] = useState<string | undefined>()

  const openAITutor = useCallback((prompt?: string, subject?: string, topic?: string) => {
    setInitialPrompt(prompt)
    setContextSubject(subject)
    setContextTopic(topic)
    setSessionKey(k => k + 1)
    setIsOpen(true)
  }, [])

  const closeAITutor = useCallback(() => setIsOpen(false), [])

  const value = useMemo(
    () => ({ isOpen, openAITutor, closeAITutor }),
    [isOpen, openAITutor, closeAITutor],
  )

  return (
    <AITutorContext.Provider value={value}>
      {children}
      {/* Mounted once at the layout root — every page/component can open it via useAITutor().openAITutor().
          key={sessionKey} remounts the drawer per open so each deep-link starts a fresh conversation. */}
      <HopeAITutorDrawer
        key={sessionKey}
        open={isOpen}
        onClose={closeAITutor}
        initialPrompt={initialPrompt}
        currentSubject={contextSubject}
        currentTopic={contextTopic}
      />
    </AITutorContext.Provider>
  )
}

export function useAITutor() {
  const ctx = useContext(AITutorContext)
  if (!ctx) throw new Error('useAITutor must be used within an AITutorProvider')
  return ctx
}
