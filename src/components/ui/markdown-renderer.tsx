'use client'

/**
 * MarkdownRenderer
 * Renders AI-generated markdown content with professional, student-friendly styling.
 * Supports: headings, bold/italic, tables, code blocks, lists, blockquotes, HR.
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

interface Props {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: Props) {
  return (
    <div className={`markdown-body ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // ── Headings ────────────────────────────────────────────────────
          h1: ({ children }) => (
            <h1 className="text-xl font-extrabold text-slate-900 mt-6 mb-3 pb-2 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold text-slate-800 mt-5 mb-2.5 pb-1.5 border-b border-slate-100">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold text-slate-800 mt-4 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold text-slate-700 mt-3 mb-1.5 uppercase tracking-wide text-slate-500">
              {children}
            </h4>
          ),

          // ── Paragraphs ─────────────────────────────────────────────────
          p: ({ children }) => (
            <p className="text-[15px] text-slate-700 leading-[1.75] mb-3">
              {children}
            </p>
          ),

          // ── Strong / Em ────────────────────────────────────────────────
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-600">{children}</em>
          ),

          // ── Lists ──────────────────────────────────────────────────────
          ul: ({ children }) => (
            <ul className="my-3 ml-1 space-y-1.5 list-none">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="my-3 ml-1 space-y-1.5 list-none">{children}</ol>
          ),
          li: ({ children, ordered, index, ...props }: any) => (
            <li className="flex items-start gap-2.5 text-[15px] text-slate-700 leading-[1.7]">
              {ordered
                ? <span className="mt-0.5 min-w-[1.4rem] h-5 bg-slate-100 text-slate-500 rounded flex items-center justify-center text-[11px] font-bold shrink-0">{(index ?? 0) + 1}</span>
                : <span className="mt-2 w-1.5 h-1.5 bg-slate-400 rounded-full flex-shrink-0" />
              }
              <span>{children}</span>
            </li>
          ),

          // ── Horizontal Rule ────────────────────────────────────────────
          hr: () => (
            <div className="my-6 border-t border-slate-200" />
          ),

          // ── Blockquote ─────────────────────────────────────────────────
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-4 border-l-4 border-indigo-300 bg-indigo-50/50 rounded-r-lg py-3 pr-4">
              <div className="text-sm text-indigo-800 leading-relaxed">{children}</div>
            </blockquote>
          ),

          // ── Code ───────────────────────────────────────────────────────
          code: ({ node, className, children, ...props }: any) => {
            const isBlock = !!(node?.position?.start?.line !== node?.position?.end?.line || className)
            return isBlock ? (
              <div className="my-4 rounded-xl overflow-hidden border border-slate-200">
                <div className="bg-slate-100 px-4 py-1.5 text-[11px] text-slate-500 font-mono tracking-wide border-b border-slate-200">
                  {className?.replace('language-', '') || 'code'}
                </div>
                <pre className="bg-slate-50 text-slate-800 p-4 text-sm font-mono leading-relaxed overflow-x-auto">
                  <code>{children}</code>
                </pre>
              </div>
            ) : (
              <code className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-sm font-mono">
                {children}
              </code>
            )
          },

          // Wrap pre to avoid double-wrapping with our code block
          pre: ({ children }: any) => <>{children}</>,

          // ── Tables ─────────────────────────────────────────────────────
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-50 border-b border-slate-200">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider border-r border-slate-100 last:border-0">
              {children}
            </th>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-100">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-slate-50/50 transition-colors">{children}</tr>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-slate-700 border-r border-slate-100 last:border-0">
              {children}
            </td>
          ),

          // ── Images ────────────────────────────────────────────────────
          // Inline content images are constrained, centred, and aligned with
          // the text flow so they never dominate the lesson.
          img: ({ src, alt, ...props }: any) => {
            if (!src || !src.trim()) {
              return alt
                ? <span className="block text-center text-xs text-slate-400 italic my-3">{alt}</span>
                : null
            }
            return (
              <figure className="my-5 flex flex-col items-center">
                <img
                  src={src}
                  alt={alt || 'illustration'}
                  className="mx-auto w-auto max-w-full max-h-[220px] rounded-lg border border-slate-200 object-contain bg-white px-2 py-1 shadow-sm"
                  loading="lazy"
                  {...props}
                />
                {alt && (
                  <figcaption className="mt-2 max-w-md text-center text-xs text-slate-400">
                    {alt}
                  </figcaption>
                )}
              </figure>
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

          // ── HTML elements (for rehype-raw) ────────────────────
          details: ({ children, ...props }: any) => (
            <details className="my-3 rounded-xl border border-slate-200 bg-slate-50/50 overflow-hidden" {...props}>
              {children}
            </details>
          ),
          summary: ({ children, ...props }: any) => (
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors list-none flex items-center gap-2" {...props}>
              <span className="text-indigo-500">&#9654;</span>
              {children}
            </summary>
          ),
          figure: ({ children, ...props }: any) => (
            <figure className="my-4 rounded-xl border border-slate-200 bg-white overflow-hidden" {...props}>
              {children}
            </figure>
          ),
          figcaption: ({ children, ...props }: any) => (
            <figcaption className="px-3 py-2 text-xs text-slate-500 bg-slate-50 border-t border-slate-100" {...props}>
              {children}
            </figcaption>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
