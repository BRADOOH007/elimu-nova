'use client'

import { useRef, useCallback } from 'react'
import Editor, { OnMount, type Monaco } from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange?: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string
}

const LANGUAGE_MAP: Record<string, string> = {
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  js: 'javascript',
  python: 'python',
  py: 'python',
  typescript: 'typescript',
  ts: 'typescript',
  json: 'json',
  xml: 'xml',
  markdown: 'markdown',
}

export function CodeEditor({
  value,
  onChange,
  language = 'html',
  readOnly = false,
  height = '400px',
}: CodeEditorProps) {
  const monacoRef = useRef<Monaco | null>(null)

  const handleMount: OnMount = useCallback((_, monaco) => {
    monacoRef.current = monaco
    monaco.editor.defineTheme('eduTheme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'tag', foreground: '569CD6' },
        { token: 'attribute', foreground: '9CDCFE' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
      ],
      colors: {
        'editor.background': '#1e1e2e',
        'editor.foreground': '#d4d4d8',
        'editor.lineHighlightBackground': '#2a2a3e',
        'editorCursor.foreground': '#f472b6',
        'editor.selectionBackground': '#3f3f5e',
        'editorLineNumber.foreground': '#6b7280',
        'editorLineNumber.activeForeground': '#d4d4d8',
        'editor.inactiveSelectionBackground': '#3f3f5e88',
      },
    })
    monaco.editor.setTheme('eduTheme')
  }, [])

  const normalizedLang = LANGUAGE_MAP[language.toLowerCase()] || 'html'

  return (
    <div className="rounded-lg overflow-hidden border border-zinc-700/50">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-700/50">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {normalizedLang}
        </span>
        <span className="text-[10px] text-zinc-500">Monaco Editor</span>
      </div>
      <Editor
        height={height}
        language={normalizedLang}
        value={value}
        onChange={(v) => onChange?.(v ?? '')}
        onMount={handleMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          tabSize: 2,
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          bracketPairColorization: { enabled: true },
          renderWhitespace: 'selection',
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
        }}
      />
    </div>
  )
}
