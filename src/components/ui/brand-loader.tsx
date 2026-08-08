interface BrandLoaderProps {
  label?: string
}

export function BrandLoader({ label = "Loading your dashboard..." }: BrandLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 min-h-[300px]">
      <div className="relative flex items-center justify-center">
        {/* Purple ambient glow backdrop */}
        <div className="absolute w-32 h-32 rounded-full bg-purple-500/10 blur-2xl pointer-events-none" />

        {/* Outer dashed ring (counter-clockwise) */}
        <div
          className="absolute w-20 h-20 rounded-full pointer-events-none"
          style={{
            border: '2px dashed rgba(124,58,237,0.35)',
            animation: 'brand-spin-reverse 3s linear infinite',
          }}
        />

        {/* Inner purple gradient ring (clockwise) */}
        <div
          className="absolute w-14 h-14 rounded-full pointer-events-none"
          style={{
            border: '3px solid transparent',
            borderTopColor: '#7c3aed',
            borderRightColor: '#2563eb',
            animation: 'brand-spin 1s linear infinite',
          }}
        />

        {/* Center spark */}
        <span className="text-2xl leading-none">✨</span>
      </div>

      <p className="mt-3 text-sm font-medium text-slate-600 tracking-wide animate-pulse">{label}</p>

      <style>{`
        @keyframes brand-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes brand-spin-reverse {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
      `}</style>
    </div>
  )
}
