'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Pen, Eraser, RotateCcw, Download, Loader2, ImageIcon, Sparkles, Search, ExternalLink } from 'lucide-react'

type Tool = 'pen' | 'eraser'

export function AIWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const [color, setColor] = useState('#0d9488')
  const [size, setSize] = useState(3)
  const [drawing, setDrawing] = useState(false)
  const [diagramPrompt, setDiagramPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const [aiDiagram, setAiDiagram] = useState<string | null>(null)
  const [isPlaceholder, setIsPlaceholder] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: (e.clientX - rect.left) * (canvas.width / rect.width), y: (e.clientY - rect.top) * (canvas.height / rect.height) }
  }

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(true)
    lastPos.current = getPos(e)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineWidth = tool === 'eraser' ? size * 4 : size
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over'
    ctx.beginPath()
    if (lastPos.current) ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  const stopDraw = () => { setDrawing(false); lastPos.current = null }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setAiDiagram(null)
  }

  const searchUrl = (q: string) => {
    const encoded = encodeURIComponent(q)
    return {
      google: `https://www.google.com/search?tbm=isch&q=${encoded}`,
      pinterest: `https://www.pinterest.com/search/pins/?q=${encoded}`,
      unsplash: `https://unsplash.com/s/photos/${encoded}`,
    }
  }

  const generateDiagram = async () => {
    if (!diagramPrompt.trim()) return
    setGenerating(true)
    setIsPlaceholder(false)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Educational diagram: ${diagramPrompt}. Clean, clear, textbook-style educational illustration.`,
          style: 'natural',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.imageUrl) {
          const placeholder = data.source === 'placeholder'
          setIsPlaceholder(placeholder)
          setAiDiagram(data.imageUrl)
          if (!placeholder) {
            const img = new window.Image()
            img.crossOrigin = 'anonymous'
            img.onload = () => {
              const canvas = canvasRef.current
              if (!canvas) return
              const ctx = canvas.getContext('2d')
              if (!ctx) return
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            img.src = data.imageUrl
          }
        }
      }
    } catch { /* ignore */ }
    setGenerating(false)
  }

  const saveWhiteboard = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'whiteboard.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <button onClick={() => setTool('pen')} className={`p-2 rounded-xl ${tool === 'pen' ? 'bg-teal-100 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} title="Pen"><Pen className="h-4 w-4" /></button>
            <button onClick={() => setTool('eraser')} className={`p-2 rounded-xl ${tool === 'eraser' ? 'bg-teal-100 text-teal-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`} title="Eraser"><Eraser className="h-4 w-4" /></button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            {['#0d9488', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0f172a', '#ffffff'].map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-5 h-5 rounded-full border-2 ${color === c ? 'border-slate-900 scale-125' : 'border-slate-300'}`} style={{ backgroundColor: c }} />
            ))}
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <input type="range" min={1} max={12} value={size} onChange={e => setSize(Number(e.target.value))} className="w-16 accent-teal-600" />
            <span className="text-xs text-slate-400 w-5">{size}px</span>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button onClick={clearCanvas} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Clear"><RotateCcw className="h-4 w-4" /></button>
            <button onClick={saveWhiteboard} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100" title="Download"><Download className="h-4 w-4" /></button>
          </div>

          <canvas
            ref={canvasRef}
            width={800} height={500}
            className="w-full h-80 border-2 border-slate-200 rounded-2xl cursor-crosshair bg-white shadow-inner"
            style={{ touchAction: 'none' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
          />
        </CardContent>
      </Card>

      {/* AI Diagram Generator */}
      <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-100 shadow-sm">
        <CardContent className="p-4">
          <p className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-600" />
            AI Diagram Generator
          </p>
          <div className="flex gap-2">
            <input
              value={diagramPrompt}
              onChange={e => setDiagramPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && generateDiagram()}
              placeholder="Describe a diagram to generate (e.g. 'Photosynthesis process', 'Water cycle')"
              className="flex-1 h-10 px-3 border border-slate-200 rounded-2xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={generateDiagram}
              disabled={generating || !diagramPrompt.trim()}
              className="px-4 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 text-white text-sm font-semibold rounded-2xl disabled:opacity-50 transition-all duration-200 hover:shadow-lg hover:shadow-teal-200 flex items-center gap-1.5"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              Generate
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">AI diagram will be drawn onto the whiteboard above. You can also draw freehand with the pen tool.</p>
          {isPlaceholder && (
            <div className="mt-3 pt-3 border-t border-teal-200">
              <p className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5" /> AI generation unavailable — find real images below:
              </p>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(searchUrl(diagramPrompt)).map(([name, url]) => (
                  <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all hover:shadow-md"
                    style={{
                      backgroundColor: name === 'google' ? '#e8f0fe' : name === 'pinterest' ? '#fce4ec' : '#e0f2f1',
                      color: name === 'google' ? '#1a73e8' : name === 'pinterest' ? '#c2185b' : '#00796b',
                    }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    {name === 'google' ? 'Google Images' : name === 'pinterest' ? 'Pinterest' : 'Unsplash'}
                  </a>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
