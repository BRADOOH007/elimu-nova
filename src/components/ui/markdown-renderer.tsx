'use client'

/**
 * MarkdownRenderer
 * Renders AI-generated markdown content with professional, student-friendly styling.
 * Supports: headings, bold/italic, tables, code blocks, lists, blockquotes, HR.
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // ── Headings ────────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-2xl font-extrabold text-slate-900 mt-6 mb-3 pb-2 border-b-2 border-blue-200 flex items-center gap-2">
              <span className="w-1 h-7 bg-blue-500 rounded-full inline-block" />
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-bold text-slate-800 mt-6 mb-3 pb-1.5 border-b border-slate-200 flex items-center gap-2">
              <span className="w-1 h-5 bg-purple-500 rounded-full inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-slate-800 mt-5 mb-2 flex items-center gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 text-xs flex items-center justify-center font-black">§</span>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold text-slate-700 mt-4 mb-1.5 uppercase tracking-wide text-blue-700">
              {children}
            </h4>
          ),

          // ── Paragraphs ─────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="text-sm text-slate-700 leading-relaxed mb-3">
              {children}
            </p>
          ),

          // ── Strong / Em ────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-700">{children}</em>
          ),

          // ── Lists ──────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="my-3 ml-1 space-y-1.5 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-1 space-y-1.5 list-none">{children}</ol>
          ),
          li: ({ children, ordered, index, ...props }: any) => (
            <li className="flex items-start gap-2 text-sm text-slate-700 leading-relaxed">
              {ordered
                ? <span className="mt-0.5 min-w-[1.5rem] h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{(index ?? 0) + 1}</span>
                : <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
              }
              <span>{children}</span>
            </li>
          ),

          // ── Horizontal Rule ────────────────────────────────────────────
          hr: () => (
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
              <span className="text-slate-300 text-xs">✦</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
            </div>
          ),

          // ── Blockquote ─────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-blue-400 bg-blue-50 rounded-r-xl py-3 pr-4">
              <div className="text-sm text-blue-800 italic leading-relaxed">{children}</div>
            </blockquote>
          ),

          // ── Code ───────────────────────────────────────────────────────
          code: ({ node, className, children, ...props }: any) => {
            // react-markdown v10: detect code block by presence of className (e.g. language-js)
            const isBlock = !!(node?.position?.start?.line !== node?.position?.end?.line || className)
            return isBlock ? (
              <div className="my-4 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <div className="bg-slate-800 px-4 py-2 text-xs text-slate-300 font-mono tracking-wide">
                  {className?.replace('language-', '') || 'Code'}
                </div>
                <pre className="bg-slate-900 text-green-300 p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                  <code>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 bg-slate-100 text-blue-700 rounded text-xs font-mono border border-slate-200">
                {children}
              </code>
            )
          },

          // Wrap pre to avoid double-wrapping with our code block
          pre: ({ children }: any) => <>{children}</>,

          // ── Tables ─────────────────────────────────────────────────────
          table: ({ children }) => (
            <div className="my-5 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider border-r border-white/20 last:border-0">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-blue-50/50 transition-colors even:bg-slate-50">
              {children}
            </tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-slate-700 border-r border-slate-100 last:border-0">
              {children}
            </td>
          ),

          // ── Images ────────────────────────────────────────────────────
          img: ({ src, alt, ...props }: any) => {
            if (!src || !src.trim()) {
              return alt
                ? <span className="block text-center text-xs text-slate-400 italic my-3">{alt}</span>
                : null
            }
            return (
              <div className="my-5 rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-white">
                <img
                  src={src}
                  alt={alt || 'illustration'}
                  className="w-full h-auto object-contain max-h-[420px]"
                  loading="lazy"
                  {...props}
                />
                {alt && <span className="block text-center text-xs text-slate-400 py-2 px-3 bg-slate-50 border-t border-slate-100 italic">{alt}</span>}
              </div>
            )
          },

          // ── Links ──────────────────────────────────────────────────────
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline underline-offset-2 hover:text-blue-800 font-medium"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
