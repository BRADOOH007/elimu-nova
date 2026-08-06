'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  side?: 'right' | 'left'
  className?: string
}

export function Sheet({ open, onOpenChange, children, side = 'right', className = '' }: SheetProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (open) {
      setVisible(true)
      document.body.style.overflow = 'hidden'
    } else {
      const t = setTimeout(() => setVisible(false), 300)
      document.body.style.overflow = ''
      return () => clearTimeout(t)
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!visible) return null

  const isRight = side === 'right'

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={() => onOpenChange(false)}
      />
      <div
        className={`fixed top-0 bottom-0 ${isRight ? 'right-0' : 'left-0'} w-full max-w-lg bg-white shadow-2xl transform transition-transform duration-300 ease-out ${open ? 'translate-x-0' : isRight ? 'translate-x-full' : '-translate-x-full'} ${className}`}
      >
        <div className="absolute top-4 right-4 z-10">
          <button onClick={() => onOpenChange(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
