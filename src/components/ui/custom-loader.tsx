"use client"

interface CustomLoaderProps {
  text?: string
  fullPage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function CustomLoader({
  text = "Loading...",
  fullPage = true,
  size = 'md',
}: CustomLoaderProps) {
  const ringSizes = { sm: 'w-12 h-12', md: 'w-14 h-14', lg: 'w-20 h-20' }
  const outerSizes = { sm: 'w-16 h-16', md: 'w-20 h-20', lg: 'w-28 h-28' }
  const glowSizes = { sm: 'w-24 h-24', md: 'w-32 h-32', lg: 'w-40 h-40' }

  const containerClass = fullPage
    ? "flex flex-col items-center justify-center min-h-[60vh] w-full bg-transparent border-0 shadow-none mx-auto"
    : "flex flex-col items-center justify-center w-full bg-transparent border-0 shadow-none py-12"

  return (
    <div className={containerClass}>
      <div className="flex flex-col items-center justify-center gap-4 p-4">
        <div className="relative flex items-center justify-center">
          <div className={`absolute ${glowSizes[size]} rounded-full bg-violet-500/10 blur-2xl pointer-events-none`} />
          <div
            className={`absolute ${outerSizes[size]} rounded-full pointer-events-none`}
            style={{
              border: '2px dashed rgba(124,58,237,0.35)',
              animation: 'custom-loader-spin-reverse 3s linear infinite',
            }}
          />
          <div
            className={`absolute ${ringSizes[size]} rounded-full pointer-events-none`}
            style={{
              border: '3px solid transparent',
              borderTopColor: '#7c3aed',
              borderRightColor: '#2563eb',
              animation: 'custom-loader-spin 1s linear infinite',
            }}
          />
          <span className={`${size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl'} leading-none`}>✨</span>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-600 tracking-wide animate-pulse">{text}</p>
      </div>
      <style>{`
        @keyframes custom-loader-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes custom-loader-spin-reverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
