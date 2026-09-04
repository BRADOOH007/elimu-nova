export default function ParentProgressMockup() {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
        <p className="text-white text-sm font-semibold">Parent Dashboard</p>
        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Child summary */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">E</div>
          <div className="flex-1">
            <p className="text-white text-sm font-semibold">Ethan Miller</p>
            <p className="text-slate-400 text-xs">Grade 7 · Austin, TX</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-300 font-medium">
            🔥 5-day streak
          </span>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
            <p className="text-white font-bold text-lg leading-none">96%</p>
            <p className="text-slate-400 text-[10px] mt-1">Attendance</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
            <p className="text-white font-bold text-lg leading-none">3.2h</p>
            <p className="text-slate-400 text-[10px] mt-1">Studied today</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-2.5 text-center">
            <p className="text-white font-bold text-lg leading-none">A-</p>
            <p className="text-slate-400 text-[10px] mt-1">Overall</p>
          </div>
        </div>

        {/* Subject progress */}
        <div className="space-y-2.5">
          {[
            { name: "Mathematics", pct: 85, color: "bg-blue-500" },
            { name: "Science", pct: 92, color: "bg-emerald-500" },
            { name: "English", pct: 78, color: "bg-purple-500" },
            { name: "History", pct: 88, color: "bg-amber-500" },
          ].map((s) => (
            <div key={s.name} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs text-slate-400">{s.name}</span>
              <div className="flex-1 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
                <div className={`h-full rounded-full ${s.color}`} style={{ width: `${s.pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-xs font-semibold text-white">{s.pct}%</span>
            </div>
          ))}
        </div>

        {/* Insight / alert */}
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 flex items-start gap-2">
          <span className="text-sm">💡</span>
          <p className="text-[11px] text-amber-200 leading-relaxed">Ethan needs a little extra help with Geometry — 2 practice sets recommended this week.</p>
        </div>
      </div>
    </div>
  );
}
