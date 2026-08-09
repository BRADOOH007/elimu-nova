'use client'

import { useRef, useEffect, useState } from 'react'
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react'

interface LivePreviewProps {
  html: string
  css?: string
  js?: string
  onError?: (error: string) => void
}

export function LivePreview({ html, css = '', js = '', onError }: LivePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [key, setKey] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const lastErrorRef = useRef('')

  const generateDocument = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
    ${css}
  </style>
</head>
<body>
  ${html}
  <script>
    window.onerror = function (msg, src, line) {
      window.parent.postMessage({ type: 'codepreview:error', message: String(msg), line: line || 0 }, '*');
    };
    try {
      ${js}
    } catch (e) {
      var m = (e && e.message) ? e.message : String(e);
      window.parent.postMessage({ type: 'codepreview:error', message: m, line: 0 }, '*');
    }
  <\/script>
</body>
</html>`
  }

  useEffect(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument
      if (doc) {
        doc.open()
        doc.write(generateDocument())
        doc.close()
      }
    }
  }, [html, css, js, key])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'codepreview:error' && typeof e.data.message === 'string') {
        const next = `Error${e.data.line ? ` (line ${e.data.line})` : ''}: ${e.data.message}`
        if (next !== lastErrorRef.current) {
          lastErrorRef.current = next
          onError?.(next)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [onError])

  return (
    <div className={`rounded-lg overflow-hidden border border-zinc-700/50 ${fullscreen ? 'fixed inset-4 z-50 bg-zinc-900' : ''}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700/50">
        <span className="text-xs font-medium text-zinc-400">Live Preview</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setKey(k => k + 1)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setFullscreen(f => !f)}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        title="Live Preview"
        className="w-full bg-white"
        style={{ height: fullscreen ? 'calc(100% - 40px)' : '400px' }}
        sandbox="allow-scripts allow-same-origin"
      />
      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <Minimize2 className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
