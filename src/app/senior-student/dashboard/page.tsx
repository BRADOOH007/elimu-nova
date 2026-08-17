'use client'

import { useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import DashboardSkeleton from '@/components/dashboard-skeleton'
import { useAITutor } from '@/components/ai-tutor-provider'
import {
  GraduationCap, Award, Calculator, BookOpen, FlaskConical, Globe,
  Laptop, Brain, TrendingUp, ArrowRight, CheckCircle2, Circle, Sparkles, MessageSquare,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GED_SUBJECTS, GED_READY_MASTERY } from '@/lib/constants/ged'

interface GedSubjectProgress {
  subject: string
  completedLessons: number
  totalLessons: number
  mastery: number
  isReady: boolean
  practiceScore: number | null
  gedScore: number
}

interface DashboardData {
  senior: { name: string; email: string; isGEDReady: boolean; goals: string[] }
  gedSubjects: GedSubjectProgress[]
  allReady: boolean
  certificate: { certNumber: string; awardedAt: string } | null
  courses: Array<{ id: string; title: string; type: string; progress: number; status: string }>
}

const SUBJECT_META: Record<string, { icon: LucideIcon; color: string; bg: string; bar: string }> = {
  'Mathematical Reasoning': { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50', bar: 'bg-blue-500' },
  'Reasoning Through Language Arts': { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50', bar: 'bg-emerald-500' },
  'Science': { icon: FlaskConical, color: 'text-cyan-600', bg: 'bg-cyan-50', bar: 'bg-cyan-500' },
  'Social Studies': { icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50', bar: 'bg-orange-500' },
}

const COURSE_ICONS: Record<string, LucideIcon> = {
  ADULT_COMPUTER_LITERACY: Laptop,
  ADULT_AI_LITERACY: Brain,
  ADULT_FINANCIAL_LITERACY: TrendingUp,
  ADULT_WORKPLACE_READINESS: GraduationCap,
  ADULT_ESL: BookOpen,
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : null))

export default function SeniorStudentDashboard() {
  const { data: session } = useSession()
  const [dismissed, setDismissed] = useState(false)
  const { openAITutor } = useAITutor()

  const { data, isLoading } = useSWR<DashboardData>('/api/senior-student/dashboard', fetcher, {
    revalidateOnFocus: true,
  })

  if (isLoading && !data) return <DashboardSkeleton />

  const d = data
  const firstName = (session?.user?.name || 'Learner').split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const readyCount = (d?.gedSubjects ?? []).filter((s) => s.isReady).length

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
      {/* HERO */}
      <Card className="border-0 bg-gradient-to-br from-teal-600 via-emerald-600 to-green-700 text-white shadow-xl overflow-hidden relative">
        <CardContent className="relative p-5 md:p-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-4 w-4 text-emerald-200" />
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">
              General Education Diploma · USA
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{greeting}, {firstName}</h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Prepare for the US GED at your own pace. Master the four subjects, then earn your
            General Education Diploma certificate of completion.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="bg-white/15 rounded-full px-3 py-1.5 text-sm font-bold">
              {readyCount}/{GED_SUBJECTS.length} subjects ready
            </div>
            {d?.certificate ? (
              <Link href="/senior-student/certificate">
                <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold border-0">
                  <Award className="h-4 w-4 mr-1.5" /> View Certificate
                </Button>
              </Link>
            ) : (
              <Link href="/senior-student/learn">
                <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold border-0">
                  <BookOpen className="h-4 w-4 mr-1.5" /> Continue Learning
                </Button>
              </Link>
            )}
            <button
              onClick={() => openAITutor(undefined, 'General Education Diploma', undefined, 'ged-hiset', 'senior_tutor')}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5 transition-colors"
            >
              <MessageSquare className="h-4 w-4" /> Ask Hope AI
            </button>
          </div>
        </CardContent>
      </Card>

      {d && !d.allReady && !dismissed && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold">Your path to the diploma</p>
            <p className="text-amber-700">
              Reach {GED_READY_MASTERY}% mastery in each of the four subjects to earn your certificate.
              Start with the subject you feel most comfortable with.
            </p>
          </div>
          <button onClick={() => setDismissed(true)} className="text-amber-500 hover:text-amber-700 text-xs font-semibold shrink-0">Dismiss</button>
        </div>
      )}

      {/* GED SUBJECTS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-teal-600" /> GED Subjects
          </h2>
          <Link href="/senior-student/learn" className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">
            Open learning hub <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(d?.gedSubjects ?? []).map((s) => {
            const meta = SUBJECT_META[s.subject] ?? { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-50', bar: 'bg-slate-500' }
            const Icon = meta.icon
            return (
              <Link key={s.subject} href={`/senior-student/learn?subject=${encodeURIComponent(s.subject)}`}>
                <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow h-full ${meta.bg}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                        <Icon className={`h-4 w-4 ${meta.color}`} />
                      </div>
                      {s.isReady ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{s.subject}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {s.completedLessons}/{s.totalLessons} lessons · GED score {s.gedScore}
                    </p>
                    <div className="bg-white/70 rounded-full h-1.5 overflow-hidden mt-2">
                      <div className={`h-full ${meta.bar} rounded-full transition-all duration-500`} style={{ width: `${s.mastery}%` }} />
                    </div>
                    <p className="text-[11px] font-semibold text-slate-600 mt-1.5">{s.mastery}% mastery</p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>

      {/* COURSES */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Laptop className="h-5 w-5 text-indigo-600" /> Essential Skills Courses
          </h2>
          <Link href="/senior-student/learn?tab=courses" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {(d?.courses?.length ?? 0) > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {d!.courses.map((c) => {
              const Icon = COURSE_ICONS[c.type] ?? Laptop
              return (
                <Link key={c.id} href="/senior-student/learn?tab=courses">
                  <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <Icon className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{c.title}</p>
                          <p className="text-xs text-slate-500">{c.status === 'COMPLETED' ? 'Completed' : `${c.progress}% complete`}</p>
                        </div>
                      </div>
                      <div className="bg-slate-100 rounded-full h-1.5 overflow-hidden mt-3">
                        <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${c.progress}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-slate-500 mb-3">
                Build computer literacy and AI skills alongside your GED subjects.
              </p>
              <Link href="/senior-student/learn?tab=courses">
                <Button variant="outline">Browse Courses</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
