'use client'

import { useState } from 'react'
import { ExternalLink, Loader2, ChevronDown } from 'lucide-react'

interface ScratchEmbedProps {
  projectId?: string
  title?: string
  lessonTitle?: string
}

const TEMPLATES: Record<string, string> = {
  'Blank Canvas': '',
  'Moving Sprites': 'https://turbowarp.org/editor?embed&addons=pause-button,gamepad#',
  'Loops & Sound': 'https://turbowarp.org/editor?embed&addons=pause-button,gamepad,music#',
  'Interactive Game': 'https://turbowarp.org/editor?embed&addons=pause-button,gamepad,clones#',
}

export function ScratchEmbed({ projectId, title, lessonTitle }: ScratchEmbedProps) {
  const [loading, setLoading] = useState(true)
  const [template, setTemplate] = useState('')

  const embedUrl = projectId
    ? `https://scratch.mit.edu/projects/${projectId}/embed`
    : template
      ? `https://turbowarp.org/editor?embed&addons=pause-button,gamepad${template.includes('music') ? ',music' : ''}${template.includes('clones') ? ',clones' : ''}`
      : 'https://turbowarp.org/editor?embed&addons=pause-button,gamepad'

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-900">
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">{title ?? 'Scratch Block Editor'}</span>
          {projectId && <span className="text-[10px] bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">Project #{projectId}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={template}
              onChange={e => { setTemplate(e.target.value); setLoading(true) }}
              className="appearance-none bg-slate-800 text-zinc-300 text-xs border border-slate-700 rounded-lg px-3 py-1.5 pr-7 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Blank Canvas</option>
              <option value="Moving Sprites">Moving Sprites</option>
              <option value="Loops & Sound">Loops & Sound</option>
              <option value="Interactive Game">Interactive Game</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-500 pointer-events-none" />
          </div>
          <a href={projectId ? `https://scratch.mit.edu/projects/${projectId}` : 'https://turbowarp.org'} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors">
            <ExternalLink className="h-3 w-3" />Open TurboWarp
          </a>
        </div>
      </div>
      <div className="relative" style={{ height: '520px' }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}
        <iframe src={embedUrl} className="w-full h-full border-0" allowFullScreen allow="autoplay; camera; microphone" onLoad={() => setLoading(false)} title="Scratch Workspace" />
      </div>
      <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-700/50">
        <p className="text-[11px] text-zinc-500">Drag and snap blocks to create programs. Click the green flag to run.</p>
      </div>
    </div>
  )
}
