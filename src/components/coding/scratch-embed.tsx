'use client'

import { useState } from 'react'
import { ExternalLink, Maximize2, Loader2 } from 'lucide-react'

interface ScratchEmbedProps {
  projectId?: string
  title?: string
}

export function ScratchEmbed({ projectId, title }: ScratchEmbedProps) {
  const [loading, setLoading] = useState(true)
  const embedUrl = projectId
    ? `https://scratch.mit.edu/projects/${projectId}/embed`
    : 'https://scratch.mit.edu/projects/editor/'

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900/50">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-200">
            {title ?? 'Scratch Block Editor'}
          </span>
          {projectId && (
            <span className="text-[10px] bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded-full">
              Project #{projectId}
            </span>
          )}
        </div>
        <a
          href={projectId ? `https://scratch.mit.edu/projects/${projectId}` : 'https://scratch.mit.edu'}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          Open in Scratch
        </a>
      </div>
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/80">
            <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        )}
        <iframe
          src={embedUrl}
          className="w-full"
          style={{ height: '480px', maxWidth: '100%' }}
          allowFullScreen
          allow="autoplay; camera; microphone"
          onLoad={() => setLoading(false)}
        />
      </div>
      <div className="px-4 py-2 bg-zinc-900/50 border-t border-zinc-700/50">
        <p className="text-[11px] text-zinc-500">
          Drag and snap blocks together to create programs. Click the green flag to run your project.
        </p>
      </div>
    </div>
  )
}
