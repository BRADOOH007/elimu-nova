'use client'

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-slate-900 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      Skip to main content
    </a>
  )
}
