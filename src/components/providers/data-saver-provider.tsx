'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

interface DataSaverContextValue {
  online: boolean
  dataSaver: boolean
  setDataSaver: (v: boolean) => void
  effectiveType: string | null
}

const DataSaverContext = createContext<DataSaverContextValue | null>(null)

function detectNetworkType(): string | null {
  const nav = navigator as any
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection
  return conn?.effectiveType || null
}

function detectAutoDataSaver(): boolean {
  const nav = navigator as any
  const conn = nav.connection || nav.mozConnection || nav.webkitConnection
  // Browser's own "data saver" flag, or a very slow connection (2G).
  if (conn?.saveData === true) return true
  const type = conn?.effectiveType
  return type === 'slow-2g' || type === '2g'
}

const STORAGE_KEY = 'elimunova-data-saver'

export function DataSaverProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState<boolean>(true)
  const [effectiveType, setEffectiveType] = useState<string | null>(null)
  const [dataSaver, setDataSaverState] = useState<boolean>(false)

  useEffect(() => {
    setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true)
    setEffectiveType(detectNetworkType())

    const goOffline = () => setOnline(false)
    const goOnline = () => setOnline(true)
    const onConnChange = () => setEffectiveType(detectNetworkType())

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    const conn = (navigator as any).connection
    if (conn) {
      conn.addEventListener('change', onConnChange)
    }

    // Initial data-saver: manual override wins, else auto-detect.
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === '1') setDataSaverState(true)
      else if (saved === '0') setDataSaverState(false)
      else setDataSaverState(detectAutoDataSaver())
    } catch {
      setDataSaverState(detectAutoDataSaver())
    }

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
      if (conn) conn.removeEventListener('change', onConnChange)
    }
  }, [])

  const setDataSaver = useCallback((v: boolean) => {
    setDataSaverState(v)
    try { localStorage.setItem(STORAGE_KEY, v ? '1' : '0') } catch { /* ignore */ }
  }, [])

  const value = useMemo(
    () => ({ online, dataSaver, setDataSaver, effectiveType }),
    [online, dataSaver, setDataSaver, effectiveType],
  )

  return <DataSaverContext.Provider value={value}>{children}</DataSaverContext.Provider>
}

export function useDataSaver(): DataSaverContextValue {
  const ctx = useContext(DataSaverContext)
  if (!ctx) throw new Error('useDataSaver must be used within a DataSaverProvider')
  return ctx
}
