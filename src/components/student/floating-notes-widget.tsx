'use client'

import { useState, useEffect } from 'react'
import { X, Minimize2, Maximize2, FileText } from 'lucide-react'

interface FloatingNotesWidgetProps {
  notes: string
  setNotes: (v: string) => void
  savedNotes: Array<{ id: string; text: string; topic: string }>
  saveNote: () => void
  activeLesson: any
}

export function FloatingNotesWidget({ notes, setNotes, savedNotes, saveNote, activeLesson }: FloatingNotesWidgetProps) {
  const [mode, setMode] = useState<'closed' | 'minimized' | 'expanded'>('closed')
  const [autoSaved, setAutoSaved] = useState(false)
  const hasNotes = notes.trim().length > 0

  useEffect(() => {
    if (notes.trim()) {
      const timer = setTimeout(() => {
        localStorage.setItem('learn_page_notes', notes)
        setAutoSaved(true)
        setTimeout(() => setAutoSaved(false), 2000)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [notes])

  useEffect(() => {
    const saved = localStorage.getItem('learn_page_notes')
    if (saved && !notes) setNotes(saved)
  }, [])

  if (mode === 'closed') {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => setMode('expanded')}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-xl hover:scale-105 hover:shadow-2xl transition-all">
          <FileText className="h-4 w-4" /> Notes
          {hasNotes && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-purple-600">{savedNotes.length || '\u2022'}</span>}
        </button>
      </div>
    )
  }

  if (mode === 'minimized') {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-xl backdrop-blur">
        <FileText className="h-4 w-4 text-purple-600" />
        <span className="text-sm font-semibold text-slate-700">My Notes {autoSaved && '(Draft Saved)'}</span>
        <div className="ml-2 flex items-center gap-1">
          <button onClick={() => setMode('expanded')} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-purple-600"><Maximize2 className="h-4 w-4" /></button>
          <button onClick={() => setMode('closed')} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"><X className="h-4 w-4" /></button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl backdrop-blur">
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-100 bg-gradient-to-r from-purple-50 to-indigo-50 px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <FileText className="h-4 w-4 text-purple-600" /> My Notes
          {activeLesson && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] text-purple-700">{activeLesson.topic}</span>}
        </h3>
        <div className="flex items-center gap-1">
          <button onClick={() => setMode('minimized')} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-amber-600"><Minimize2 className="h-4 w-4" /></button>
          <button onClick={() => setMode('closed')} className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-red-500"><X className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="p-4">
        <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Type your lesson notes here..." rows={6}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
        <div className="mt-2 flex items-center justify-between">
          <p className="text-[10px] text-slate-400">{autoSaved ? 'Draft saved' : 'Auto-saves as you type'}</p>
          <button onClick={saveNote} disabled={!notes.trim()} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700 disabled:opacity-50">Save Note</button>
        </div>
      </div>
      {savedNotes.length > 0 && (
        <div className="max-h-32 space-y-1 overflow-y-auto border-t border-slate-100 px-4 py-2">
          {savedNotes.slice(0, 3).map(n => (
            <div key={n.id} className="rounded-lg bg-slate-50 p-2">
              <p className="text-[10px] text-slate-400">{n.topic}</p>
              <p className="line-clamp-2 text-xs text-slate-700">{n.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
