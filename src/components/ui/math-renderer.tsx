'use client'

import { useEffect, useRef } from 'react'

interface MathRendererProps {
  content: string
  className?: string
  inline?: boolean
}

/**
 * Renders mathematical expressions using KaTeX via CDN.
 * Supports both inline ($...$) and display ($$...$$) math.
 * Falls back to plain text if KaTeX is not available.
 */
export function MathRenderer({ content, className = '', inline = false }: MathRendererProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current || !content) return

    // Try to use KaTeX if available (loaded via CDN in layout)
    const renderMath = async () => {
      try {
        // Dynamically load KaTeX only when needed
        if (typeof window !== 'undefined' && !(window as any).katex) {
          // Load KaTeX CSS
          if (!document.getElementById('katex-css')) {
            const link = document.createElement('link')
            link.id  = 'katex-css'
            link.rel = 'stylesheet'
            link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css'
            document.head.appendChild(link)
          }
          // Load KaTeX JS
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js'
            script.onload  = () => resolve()
            script.onerror = reject
            document.head.appendChild(script)
          })
          // Load auto-render extension
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script')
            script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js'
            script.onload  = () => resolve()
            script.onerror = reject
            document.head.appendChild(script)
          })
        }

        if (ref.current && (window as any).renderMathInElement) {
          ref.current.innerHTML = content
          ;(window as any).renderMathInElement(ref.current, {
            delimiters: [
              { left: '$$', right: '$$', display: true  },
              { left: '$',  right: '$',  display: false },
              { left: '\\[', right: '\\]', display: true  },
              { left: '\\(', right: '\\)', display: false },
            ],
            throwOnError: false,
          })
        } else if (ref.current) {
          // Fallback: plain text
          ref.current.textContent = content
        }
      } catch {
        if (ref.current) ref.current.textContent = content
      }
    }

    renderMath()
  }, [content])

  if (inline) {
    return (
      <span
        ref={ref as any}
        className={`math-content ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  return (
    <div
      ref={ref}
      className={`math-content leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

/**
 * Quick helper — renders a single math expression.
 */
export function InlineMath({ expr }: { expr: string }) {
  return <MathRenderer content={`$${expr}$`} inline />
}

export function DisplayMath({ expr }: { expr: string }) {
  return <MathRenderer content={`$$${expr}$$`} />
}
