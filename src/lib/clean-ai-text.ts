/**
 * stripLatex
 * Removes LaTeX / TeX commands from AI-generated content and replaces them
 * with readable plain-text equivalents. Acts as a safety net even when the
 * AI ignores the "no LaTeX" instruction in the prompt.
 */
export function stripLatex(text: string): string {
  if (!text) return text

  return text
    // ── Fractions: \frac{a}{b} → a/b ────────────────────────────────────
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')

    // ── Answer blanks: \underline{\qquad} or \underline{...} → ________ ─
    .replace(/\\underline\s*\{[^}]*\}/g, '_______')
    .replace(/\\underline\b/g, '_______')

    // ── Spacing commands → space ─────────────────────────────────────────
    .replace(/\\qquad|\\quad/g, '   ')
    .replace(/\\,|\\;|\\:/g, ' ')
    .replace(/\\!/g, '')

    // ── Text decorators: \textbf{x} → x, \textit{x} → x ────────────────
    .replace(/\\text(?:bf|it|rm|sf|tt|up)\{([^}]+)\}/g, '$1')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mathbf\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    .replace(/\\boldsymbol\{([^}]+)\}/g, '$1')

    // ── Roots: \sqrt{x} → √x ────────────────────────────────────────────
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\b/g, '√')

    // ── Superscripts/subscripts: x^{2} → x^2, x_{i} → x_i ─────────────
    .replace(/\^\{([^}]+)\}/g, '^$1')
    .replace(/_\{([^}]+)\}/g, '_$1')

    // ── Common symbols ───────────────────────────────────────────────────
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥')
    .replace(/\\neq/g, '≠')
    .replace(/\\approx/g, '≈')
    .replace(/\\infty/g, '∞')
    .replace(/\\pi/g, 'π')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\theta/g, 'θ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\cdot/g, '·')
    .replace(/\\%/g, '%')

    // ── Environments: \begin{...}...\end{...} → strip tags ──────────────
    .replace(/\\begin\{[^}]+\}/g, '')
    .replace(/\\end\{[^}]+\}/g, '')

    // ── Inline/display math delimiters ───────────────────────────────────
    .replace(/\\\[|\\\]/g, '')
    .replace(/\\\(|\\\)/g, '')
    .replace(/\$\$[\s\S]*?\$\$/g, (m) => m.slice(2, -2).trim()) // $$...$$ → content
    .replace(/\$([^$]+)\$/g, '$1')                               // $...$ → content

    // ── Any remaining bare \command → strip the backslash ───────────────
    .replace(/\\([a-zA-Z]+)\b/g, '$1')

    // ── Orphaned curly braces ────────────────────────────────────────────
    .replace(/\{([^{}]*)\}/g, '$1')   // {content} → content (run twice for nested)
    .replace(/\{([^{}]*)\}/g, '$1')
    .replace(/[{}]/g, '')             // any leftover braces

    // ── Clean up ─────────────────────────────────────────────────────────
    .replace(/  +/g, ' ')       // collapse multiple spaces
    .replace(/\n{3,}/g, '\n\n') // collapse blank lines
    .trim()
}

/**
 * cleanAIText
 * Strips markdown formatting for plain-text display contexts (chat bubbles etc.)
 * Also strips LaTeX as a safety net.
 */
export function cleanAIText(text: string): string {
  if (!text) return text

  // First strip any LaTeX
  let cleaned = stripLatex(text)

  return cleaned
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic — careful not to break bullet points
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, '$1')
    // Remove headers (## Heading → Heading)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove horizontal rules
    .replace(/^[-*_]{3,}\s*$/gm, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Clean up extra blank lines
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
