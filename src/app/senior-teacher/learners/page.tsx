'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, Loader2, Users, Award, CheckCircle2 } from 'lucide-react'
import { GED_SUBJECTS } from '@/lib/constants/ged'

interface Learner {
  id: string
  userId: string
  name: string
  email: string
  ageBracket: string | null
  priorEducation: string | null
  approvalStatus: string
  subscriptionStatus: string | null
  isGEDReady: boolean
  hasCertificate: boolean
  readySubjects: number
  avgMastery: number
  progress: { subject: string; mastery: number; isReady: boolean }[]
  joinedAt: string
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-amber-50 text-amber-700' },
  FREEMIUM: { label: 'Freemium', className: 'bg-emerald-50 text-emerald-700' },
  ACTIVE: { label: 'Paid', className: 'bg-blue-50 text-blue-700' },
  LOCKED: { label: 'Locked', className: 'bg-rose-50 text-rose-700' },
}

export default function SeniorTeacherLearners() {
  const { toast } = useToast()
  const [learners, setLearners] = useState<Learner[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchLearners = useCallback(async () => {
    try {
      const res = await fetch('/api/senior-teacher/learners')
      if (res.ok) {
        const data = await res.json()
        setLearners(data.learners)
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load learners' })
      }
    } catch {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load learners' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchLearners() }, [fetchLearners])

  const filtered = learners.filter((l) => `${l.name} ${l.email}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      <div>
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold text-slate-800">My Learners</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Your adult GED learners and their progress toward the diploma.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email…" className="pl-10 h-10 rounded-xl" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center text-sm text-slate-500">No learners yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((l) => {
            const meta = STATUS_META[l.approvalStatus] ?? STATUS_META.PENDING
            return (
              <Card key={l.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-800 truncate">{l.name}</p>
                        {l.hasCertificate && <Award className="h-4 w-4 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-slate-400">{l.email}</p>
                      {l.ageBracket && <p className="text-xs text-slate-400 mt-0.5">Age {l.ageBracket}{l.priorEducation ? ` · ${l.priorEducation}` : ''}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${meta.className}`}>{meta.label}</span>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                      <span>{l.readySubjects}/{GED_SUBJECTS.length} subjects GED-ready</span>
                      <span className="font-semibold">{l.avgMastery}% avg mastery</span>
                    </div>
                    <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${l.avgMastery}%` }} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {l.progress.map((p) => (
                      <div key={p.subject} className="text-center">
                        <div className={`text-[10px] font-medium truncate ${p.isReady ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {p.subject.split(' ')[0]}
                        </div>
                        <div className="text-sm font-bold text-slate-700">{p.mastery}%</div>
                        {p.isReady && <CheckCircle2 className="h-3 w-3 text-emerald-500 mx-auto" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
