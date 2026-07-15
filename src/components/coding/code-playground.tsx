'use client'

import { useState, useCallback } from 'react'
import { CodeEditor } from './code-editor'
import { LivePreview } from './live-preview'
import { Play, RotateCcw, Files, Check, Copy } from 'lucide-react'

interface FileTab {
  name: string
  language: string
  content: string
}

interface CodePlaygroundProps {
  files: FileTab[]
  initialTab?: string
  title?: string
}

export function CodePlayground({ files, initialTab, title }: CodePlaygroundProps) {
  const [tabs, setTabs] = useState(files)
  const [activeTab, setActiveTab] = useState(initialTab ?? files[0]?.name ?? 'index.html')
  const [showPreview, setShowPreview] = useState(true)
  const [copied, setCopied] = useState(false)

  const activeFile = tabs.find(t => t.name === activeTab)
  const htmlFile = tabs.find(t => t.name.endsWith('.html'))
  const cssFile = tabs.find(t => t.name.endsWith('.css'))
  const jsFile = tabs.find(t => t.name.endsWith('.js'))

  const updateCode = useCallback((value: string) => {
    setTabs(prev => prev.map(t => t.name === activeTab ? { ...t, content: value } : t))
  }, [activeTab])

  const resetCode = useCallback(() => {
    setTabs(files.map(f => ({ ...f })))
  }, [files])

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(activeFile?.content ?? '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [activeFile])

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900/50">
      {title && (
        <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700/50">
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-2 py-1.5 bg-zinc-900/80 border-b border-zinc-700/50">
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                activeTab === tab.name
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={copyCode}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={resetCode}
            className="p-1.5 rounded hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            title="Reset code"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setShowPreview(p => !p)}
            className={`p-1.5 rounded transition-colors ${
              showPreview ? 'bg-emerald-700 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-700'
            }`}
            title={showPreview ? 'Hide preview' : 'Show preview'}
          >
            <Play className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Editor + Preview */}
      <div className={`grid ${showPreview ? 'grid-cols-2' : 'grid-cols-1'} divide-x divide-zinc-700/50`}>
        <div className="min-h-[400px]">
          {activeFile && (
            <CodeEditor
              value={activeFile.content}
              onChange={updateCode}
              language={activeFile.language}
              height="400px"
            />
          )}
        </div>
        {showPreview && (
          <div className="min-h-[400px]">
            <LivePreview
              html={htmlFile?.content ?? ''}
              css={cssFile?.content ?? ''}
              js={jsFile?.content ?? ''}
            />
          </div>
        )}
      </div>
    </div>
  )
}
