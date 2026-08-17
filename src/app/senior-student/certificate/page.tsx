'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DashboardSkeleton from '@/components/dashboard-skeleton'
import {
  Award, CheckCircle2, Circle, Loader2, Calculator, BookOpen, FlaskConical, Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GED_SUBJECTS, GED_PASS_SCORE } from '@/lib/constants/ged'

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'Mathematical Reasoning': Calculator,
  'Reasoning Through Language Arts': BookOpen,
  'Science': FlaskConical,
  'Social Studies': Globe,
}

interface Readiness {
  subject: string
  mastery: number
  isReady: boolean
  gedScore: number
}

interface CertificateData {
  readiness: Readiness[]
  certificate: { certNumber: string; awardedAt: string; subjectScores: Record<string, number> | null } | null
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null))

export default function CertificatePage() {
  const { data, isLoading, mutate } = useSWR<CertificateData>('/api/senior-student/certificate', fetcher)
  const [issuing, setIssuing] = useState(false)
  const [error, setError] = useState('')

  const issue = async () => {
    setIssuing(true)
    setError('')
    const res = await fetch('/api/senior-student/certificate', { method: 'POST' })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Unable to issue certificate yet')
    } else {
      await mutate()
    }
    setIssuing(false)
  }

  if (isLoading && !data) return <DashboardSkeleton />

  const readiness = data?.readiness ?? []
  const allReady = readiness.length === GED_SUBJECTS.length && readiness.every((r) => r.isReady)
  const certificate = data?.certificate ?? null

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">
      <div className="text-center">
        <div className="inline-flex w-14 h-14 rounded-2xl bg-teal-50 items-center justify-center mb-3">
          <Award className="h-7 w-7 text-teal-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-800">General Education Diploma</h1>
        <p className="text-sm text-slate-500 mt-1">
          Certificate of Completion — GED Preparation (US High School Equivalency)
        </p>
      </div>

      {certificate ? (
        <Card className="border-2 border-teal-200 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-teal-600 to-emerald-700 text-white p-8 text-center">
            <Award className="h-10 w-10 mx-auto mb-3 opacity-90" />
            <p className="text-xs uppercase tracking-widest text-emerald-100">This certifies that</p>
            <h2 className="text-2xl font-extrabold mt-1">ElimuNova Learner</h2>
            <p className="text-sm text-emerald-100 mt-2 leading-relaxed">
              has completed the General Education Diploma preparation program,
              demonstrating mastery across all four GED subject areas.
            </p>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {GED_SUBJECTS.map((s) => (
                <div key={s} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-xs font-medium text-slate-600">{s}</span>
                  <span className="text-sm font-bold text-slate-800">
                    {certificate.subjectScores?.[s] ?? GED_PASS_SCORE}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-4">
              <span>Certificate Number</span>
              <span className="font-mono font-semibold text-slate-700">{certificate.certNumber}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-500 mt-2">
              <span>Issued</span>
              <span className="font-medium text-slate-700">{new Date(certificate.awardedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
              This is a certificate of completion for GED preparation. The official GED credential is issued
              by GED Testing Service after passing the proctored exam at an approved testing center.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <h2 className="font-semibold text-slate-800 mb-4">Subject Readiness</h2>
              <div className="space-y-3">
                {GED_SUBJECTS.map((s) => {
                  const r = readiness.find((x) => x.subject === s)
                  const Icon = SUBJECT_ICONS[s] ?? BookOpen
                  const ready = r?.isReady ?? false
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-slate-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">{s}</p>
                          <span className="text-xs text-slate-500">{r ? `${r.mastery}% mastery` : 'Not started'}</span>
                        </div>
                        <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                          <div className={`h-full rounded-full transition-all duration-500 ${ready ? 'bg-emerald-500' : 'bg-teal-500'}`} style={{ width: `${r?.mastery ?? 0}%` }} />
                        </div>
                      </div>
                      {ready ? <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" /> : <Circle className="h-5 w-5 text-slate-200 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
          )}

          <div className="text-center">
            {allReady ? (
              <Button size="lg" onClick={issue} disabled={issuing} className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700">
                {issuing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Award className="h-4 w-4 mr-2" />}
                Issue My Certificate
              </Button>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-3">
                  Reach {GED_PASS_SCORE}+ readiness in every subject to unlock your certificate.
                </p>
                <Link href="/senior-student/learn">
                  <Button>Continue Learning</Button>
                </Link>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
