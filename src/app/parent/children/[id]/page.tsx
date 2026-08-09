"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff, RefreshCw, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ChildDetail {
  id: string; name: string; username: string; email: string; grade: string; school: string
  averageGrade: number | null; pendingAssignments: number; completedAssignments: number; streakDays: number
}

export default function ChildDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { toast } = useToast()
  const [child, setChild] = useState<ChildDetail | null>(null)
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchChild = async () => {
      try {
        const res = await fetch(`/api/parent/children/${id}`)
        if (res.ok) {
          const { child: c } = await res.json()
          setChild({ id: c.id, name: c.name, username: c.email?.split('@')[0] || '', email: c.email, grade: c.class?.grade || 'N/A', school: c.school?.name || 'ElimuNova', averageGrade: c.analytics?.averageGrade ?? null, pendingAssignments: c.analytics?.pendingAssignments ?? 0, completedAssignments: c.analytics?.completedAssignments ?? 0, streakDays: c.analytics?.streakDays ?? 0 })
        }
        // Also fetch credentials
        const cr = await fetch(`/api/parent/children/${id}/credentials`)
        if (cr.ok) setCredentials(await cr.json())
      } catch { } finally { setLoading(false) }
    }
    fetchChild()
  }, [id])

  const regeneratePassword = async () => {
    setRegenerating(true)
    try {
      const res = await fetch(`/api/parent/children/${id}/credentials`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setCredentials(data)
        toast({ title: 'Regenerated', description: 'New password generated successfully' })
      }
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setRegenerating(false) }
  }

  const copyCredentials = () => {
    if (!credentials) return
    navigator.clipboard.writeText(`Username: ${credentials.username}\nPassword: ${credentials.password}`)
    toast({ title: 'Copied', description: 'Credentials copied to clipboard' })
  }

  if (loading) return <div className="p-8 max-w-2xl mx-auto animate-pulse"><div className="h-8 w-48 bg-slate-200 rounded mb-6" /><div className="h-40 bg-slate-200 rounded-2xl mb-4" /><div className="h-32 bg-slate-200 rounded-2xl" /></div>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"><ArrowLeft className="w-4 h-4" />Back to Children</button>

      {child && (
        <>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h1 className="text-xl font-bold text-slate-900">{child.name}</h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500 mt-1">
              <span>Grade: {child.grade}</span>
              <span>School: {child.school}</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="p-3 bg-slate-50 rounded-xl text-center"><p className="text-xs text-slate-500">Avg Grade</p><p className="text-lg font-bold">{child.averageGrade !== null ? `${child.averageGrade}%` : '—'}</p></div>
              <div className="p-3 bg-slate-50 rounded-xl text-center"><p className="text-xs text-slate-500">Pending</p><p className="text-lg font-bold">{child.pendingAssignments}</p></div>
              <div className="p-3 bg-slate-50 rounded-xl text-center"><p className="text-xs text-slate-500">Streak</p><p className="text-lg font-bold">{child.streakDays}d</p></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Login Credentials</h2>
            {credentials ? (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div><p className="text-xs text-slate-500">Username</p><code className="text-sm font-mono text-indigo-600 font-semibold">{credentials.username}</code></div>
                  <div>
                    <p className="text-xs text-slate-500">Password</p>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono">{showPwd ? credentials.password : '\u2022'.repeat(credentials.password.length)}</code>
                      <button onClick={() => setShowPwd(v => !v)} className="text-slate-400 hover:text-slate-600">{showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyCredentials} className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-1.5"><Copy className="w-4 h-4" />Copy</button>
                  <button onClick={regeneratePassword} disabled={regenerating} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50">
                    {regenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}Regenerate
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500"><p>Credentials not available</p><button onClick={regeneratePassword} className="mt-2 text-sm text-indigo-600 hover:text-indigo-700">Generate password</button></div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
