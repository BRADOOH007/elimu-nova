export default function ParentProgressMockup() {
  return (
    <div className="rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl overflow-hidden">
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
        <p className="text-white text-sm font-semibold">Parent Dashboard</p>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">J</div>
          <div>
            <p className="text-white text-sm">John Doe</p>
            <p className="text-slate-400 text-xs">Grade 7</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-white font-bold text-lg">85%</p>
            <p className="text-slate-400 text-xs">Math</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-white font-bold text-lg">92%</p>
            <p className="text-slate-400 text-xs">Science</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <p className="text-white font-bold text-lg">78%</p>
            <p className="text-slate-400 text-xs">English</p>
          </div>
        </div>
      </div>
    </div>
  );
}
