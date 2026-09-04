"use client"

import { useSchoolInfo } from "@/hooks/use-school-info"
import { IndependentUserWelcome } from "@/components/onboarding/independent-user-welcome"
import { SubscriptionAlert } from "@/components/subscription/subscription-alert"
import SmartRecommendations from "@/components/student/smart-recommendations"
import WhatToLearnNext from "@/components/student/what-to-learn-next"
import DashboardSkeleton from "@/components/dashboard-skeleton"
import { SpacedRepetitionWidget } from "@/components/student/spaced-repetition-widget"
import { useSession } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import useSWR from "swr"
import { useAITutor } from "@/components/ai-tutor-provider"
import {
  Zap, Flame, Target, Clock, BookOpen, GraduationCap, Brain, ClipboardList, ArrowRight,
  Sparkles, Star, TrendingUp, Play, Repeat, AlertCircle, Trophy, CheckCircle, Plus, MessageSquare,
  Calculator, FlaskConical, Globe, Languages, Church, Leaf, Palette, Home, School, Music, Activity
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getGameState, updateStreak, getLevelName, getXpToNextLevel } from '@/lib/gamification'
import { getUnreviewedMistakes } from '@/lib/mistake-bank'
import { OnboardingTourFab } from '@/components/onboarding-tour-fab'
import { ActiveLiveClassBanner } from '@/components/notifications/active-live-class-banner'

interface DashboardData {
  student: { id: string; name: string; email: string; school: string; teacher: string; class: string }
  stats: { activeAssignments: number; completedAssignments: number; averageGrade: number | null; studyTime: number; overdueAssignments: number }
  assignments: Array<{ id: string; title: string; description: string; dueDate: string; status: string; grade: number | null; teacher: string; subject: string }>
  upcomingLessons: Array<{ id: string; title: string; subject: string; time: string; teacher: string; location?: string }>
  studySessions: Array<{ id: string; subject: string; topic: string; duration: number; startTime: string; endTime?: string; notes?: string }>
  analytics: { totalStudyTime: number; averageGrade: number | null; completedAssignments: number; pendingAssignments: number; overdueAssignments: number; lastActiveDate: string | null; streakDays: number; longestStreak: number; weeklyGoal: number; monthlyGoal: number }
  unreadNotificationCount?: number
}

const fallbackData: DashboardData = {
  student: { id: "", name: "Student", email: "", school: "ElimuNova", teacher: "AI Teacher", class: "Independent Study" },
  stats: { activeAssignments: 0, completedAssignments: 0, averageGrade: null, studyTime: 0, overdueAssignments: 0 },
  assignments: [], upcomingLessons: [], studySessions: [],
  analytics: { totalStudyTime: 0, averageGrade: null, completedAssignments: 0, pendingAssignments: 0, overdueAssignments: 0, lastActiveDate: null, streakDays: 0, longestStreak: 0, weeklyGoal: 300, monthlyGoal: 1200 },
}

import { getSubjectsForStudent } from '@/lib/constants/cbc-curriculum'
import { getSubjectsForCurriculum } from '@/lib/curriculum-subjects'
import { resolveEffectiveCurriculum, resolveStudentGradeAndCurriculum } from '@/lib/student-curriculum-resolver'
import { formatTeacherName, formatDate, formatDuration, formatTime } from '@/lib/utils/formatters'

const SUBJECT_ICONS: Record<string, LucideIcon> = {
  Mathematics: Calculator, Math: Calculator, English: BookOpen, 'English Language Arts': BookOpen, Science: FlaskConical, 'Social Studies': Globe, History: Globe, Geography: Globe, 'Religious Education': Church, 'Creative Arts': Palette, 'Agriculture & Nutrition': Leaf, Agriculture: Leaf, 'Pre-Technical Studies': Brain, 'Computer Science': Brain, 'Computer Studies': Brain, 'Business Studies': TrendingUp, 'Physical Education': Activity, 'Health & PE': Activity, 'Health Education': Activity, Physics: Zap, Chemistry: FlaskConical, Biology: Leaf, Kiswahili: Languages, 'Kiswahili / KSL': Languages, Economics: TrendingUp, 'Visual & Performing Arts': Palette, 'Fine Arts': Palette, Art: Palette, Music: Music, 'World Languages': Languages, 'Foreign Languages': Languages, French: Languages, Spanish: Languages, 'Environmental Science': FlaskConical, 'Life Science': FlaskConical, 'Physical Science': FlaskConical, 'Earth & Space Science': FlaskConical,
}
const SUBJECT_COLORS: Record<string, string[]> = {
  Mathematics: ['text-blue-600','bg-blue-50','bg-blue-500'], English: ['text-emerald-600','bg-emerald-50','bg-emerald-500'], 'English Language Arts': ['text-emerald-600','bg-emerald-50','bg-emerald-500'], Kiswahili: ['text-amber-600','bg-amber-50','bg-amber-500'], 'Kiswahili / KSL': ['text-amber-600','bg-amber-50','bg-amber-500'], 'Science & Technology': ['text-cyan-600','bg-cyan-50','bg-cyan-500'], 'Integrated Science': ['text-cyan-600','bg-cyan-50','bg-cyan-500'], Science: ['text-cyan-600','bg-cyan-50','bg-cyan-500'], 'Social Studies': ['text-orange-600','bg-orange-50','bg-orange-500'], 'Religious Education': ['text-purple-600','bg-purple-50','bg-purple-500'], CRE: ['text-purple-600','bg-purple-50','bg-purple-500'], 'Creative Arts': ['text-pink-600','bg-pink-50','bg-pink-500'], 'Creative Arts & Sports': ['text-pink-600','bg-pink-50','bg-pink-500'], 'Agriculture & Nutrition': ['text-green-600','bg-green-50','bg-green-500'], Agriculture: ['text-green-600','bg-green-50','bg-green-500'], 'Pre-Technical Studies': ['text-indigo-600','bg-indigo-50','bg-indigo-500'], 'Business Studies': ['text-orange-600','bg-orange-50','bg-orange-500'], 'Computer Studies': ['text-indigo-600','bg-indigo-50','bg-indigo-500'], 'Computer Science': ['text-indigo-600','bg-indigo-50','bg-indigo-500'], 'Physical Education': ['text-lime-600','bg-lime-50','bg-lime-500'], 'Health & PE': ['text-lime-600','bg-lime-50','bg-lime-500'], 'Health Education': ['text-lime-600','bg-lime-50','bg-lime-500'], 'Indigenous Language': ['text-teal-600','bg-teal-50','bg-teal-500'], 'Environmental Activities': ['text-green-600','bg-green-50','bg-green-500'], 'Creative Activities': ['text-pink-600','bg-pink-50','bg-pink-500'], 'Physical & Health Education': ['text-lime-600','bg-lime-50','bg-lime-500'],   History: ['text-orange-600','bg-orange-50','bg-orange-500'], Geography: ['text-cyan-600','bg-cyan-50','bg-cyan-500'], Physics: ['text-blue-600','bg-blue-50','bg-blue-500'], Chemistry: ['text-purple-600','bg-purple-50','bg-purple-500'], Biology: ['text-green-600','bg-green-50','bg-green-500'], 'Home Science': ['text-pink-600','bg-pink-50','bg-pink-500'],
}

function getSubjectCards(grade: string, curriculumId?: string | null, country?: string | null) {
  // Country-aware: resolve the effective curriculum so non-Kenyan students
  // never fall back to CBC subjects just because no curriculum was saved.
  const effective = resolveEffectiveCurriculum(country, curriculumId)
  const subjects = effective !== 'cbc'
    ? getSubjectsForCurriculum(effective, grade)
    : getSubjectsForStudent(grade)
  return subjects.slice(0, 8).map(name => {
    const c = SUBJECT_COLORS[name] || ['text-slate-600','bg-slate-50','bg-slate-500']
    return { name, icon: SUBJECT_ICONS[name] || Brain, color: c[0], bg: c[1], bar: c[2] }
  })
}

function fmtTime(totalMinutes: number): string {
  if (totalMinutes < 60) return `${totalMinutes}min`
  return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
}

export default function StudentDashboard() {
  const { data: session } = useSession()
  const router = useRouter()
  const { schoolInfo, loading: schoolInfoLoading } = useSchoolInfo()
  const isIndependent = !schoolInfo?.school?.id && !session?.user?.schoolId

  const [showOnboarding, setShowOnboarding] = useState(false)
  const [, setShowNotifs] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)

  const { openAITutor } = useAITutor()

  // Gamification
  const [gameState] = useState(() => updateStreak(getGameState()))
  const levelName = getLevelName(gameState.level)
  const xpProgress = getXpToNextLevel(gameState.xp)
  const mistakes = getUnreviewedMistakes()

  const fetcher = (url: string) => fetch(url).then(r => {
    if (!r.ok) return null
    return r.json()
  })

  const { data: prefsData } = useSWR<{ curriculum?: string; country?: string; grade?: string; createdAt?: string; updatedAt?: string }>('/api/user-preferences', fetcher)

  // Dashboard data cached in memory by SWR (staleTime 5min). Returning to this
  // page renders the cached state instantly without the skeleton loader while
  // revalidating in the background.
  const { data: dashboardData, isLoading: loading } = useSWR<DashboardData>(
    "/api/student/dashboard",
    fetcher,
  )

  // Learning path for Continue CTA
  const { data: pathData } = useSWR<{ resumeTopic?: { subject: string; topicName: string } }>(
    `/api/student/learning-path?limit=1&curriculum=${prefsData?.curriculum || ''}&grade=${encodeURIComponent(prefsData?.grade || '')}`,
    fetcher,
  )
  const resumeTopic = pathData?.resumeTopic
    ? { subject: pathData.resumeTopic.subject || 'Mathematics', topic: pathData.resumeTopic.topicName }
    : null

  // Display name from profile
  const { data: profileData } = useSWR<{ firstName?: string; lastName?: string }>(
    session?.user?.id ? `/api/user-profile?userId=${session.user.id}` : null,
    fetcher,
  )
  const displayName = profileData ? `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() : ""

  // Dynamic upcoming events from Schedule + Assignments
  const { data: upcomingEvents } = useSWR<Array<{ id: string; type: string; title: string; subject: string; teacherName: string; startTime: string; endTime: string; dueDate: string }>>(
    '/api/student/upcoming', fetcher,
  )
  const { data: recentActivity } = useSWR<Array<{ id: string; type: 'quiz' | 'class' | 'lesson' | 'streak'; label: string; time: string; icon: string }>>(
    '/api/student/recent-activity', fetcher,
  )

  useEffect(() => {
    if (isIndependent && !schoolInfoLoading) {
      const onboarded = localStorage.getItem('independent_onboarded')
      if (!onboarded) setShowOnboarding(true)
    }
  }, [isIndependent, schoolInfoLoading])

  useEffect(() => { function h(e: MouseEvent) { if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])

  const name = displayName || dashboardData?.student?.name || session?.user?.name || "Student"
  const firstName = name.split(' ')[0]

  if (showOnboarding) return <IndependentUserWelcome userRole="STUDENT" userName={name} onComplete={() => { localStorage.setItem('independent_onboarded', '1'); setShowOnboarding(false) }} />
  // Only show the skeleton when there is no cached data in the SWR in-memory
  // cache -- i.e. a fresh app load or hard refresh. On client navigation the
  // cached dashboard state is already available, so isLoading is false and the
  // dashboard UI renders optimistically while SWR revalidates in the background.
  if (loading) {
    return <DashboardSkeleton />
  }

  const d = dashboardData ?? { ...fallbackData, student: { ...fallbackData.student, id: session?.user?.id || "", name: session?.user?.name || "Student" } }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
  const todayStr = new Date().toISOString().split('T')[0]
  const dailyDone = !!localStorage.getItem(`daily_done_${todayStr}`)

  // Grade + recent subjects for the "What to learn next?" sidebar widget.
  // Country-aware & year-aware: the effective curriculum never falls back to CBC
  // for non-Kenyan students, and the grade auto-advances each calendar year.
  const classGrade = /Grade|Form/i.test(d.student.class) ? d.student.class : null
  const resolved = resolveStudentGradeAndCurriculum({
    grade: prefsData?.grade,
    country: prefsData?.country,
    curriculum: prefsData?.curriculum,
    createdAt: prefsData?.createdAt,
    updatedAt: prefsData?.updatedAt,
    classGrade,
  })
  const studentGrade = resolved.grade
  const effectiveCurriculum = resolved.curriculum
  const recentSubjects = Array.from(new Set((d.studySessions || []).map(s => s.subject).filter(Boolean)))

  const dueReviews = (() => {
    try {
      const raw = localStorage.getItem('elimunova_reviews')
      if (!raw) return []
      return (JSON.parse(raw) as Array<{ subject?: string; topic: string; nextReview: string }>).filter((r) => new Date(r.nextReview) <= new Date())
    } catch { return [] }
  })()

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5 md:space-y-6">
      <SubscriptionAlert />
      <ActiveLiveClassBanner />

      {/* HERO: Greeting + Gamification + Continue CTA */}
      <Card className="border-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-xl overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE1IiByPSIxLjUiIGZpbGw9IiNmZmYiIG9wYWNpdHk9IjAuMDgiLz48Y2lyY2xlIGN4PSI0NSIgY3k9IjMwIiByPSIyIiBmaWxsPSIjZmZmIiBvcGFjaXR5PSIwLjA2Ii8+PGNpcmNsZSBjeD0iMzAiIGN5PSI0NSIgcj0iMSIgZmlsbD0iI2ZmZiIgb3BhY2l0eT0iMC4xIi8+PC9nPjwvc3ZnPg==')] opacity-50" />
        <CardContent className="relative p-5 md:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-violet-200" />
              <span className="text-xs font-medium text-violet-200 uppercase tracking-wider">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">{greeting}, {firstName}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm">
              {isIndependent && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-400/20 text-emerald-100 border border-emerald-400/30"><Home className="w-3 h-3" />Self-Paced</span>}
              <div className="flex items-center gap-1"><Zap className="h-4 w-4 text-amber-300" /><span className="font-bold">{gameState.xp} XP</span></div>
              <div className="flex items-center gap-1"><Flame className="h-4 w-4 text-orange-300" /><span className="font-bold">{gameState.streak}d streak</span></div>
              {mistakes.length > 0 && <Link href="/student/learn" className="flex items-center gap-1 text-red-200 hover:text-red-100"><AlertCircle className="h-4 w-4" />{mistakes.length} to review</Link>}
            </div>
          </div>
          <div className="flex flex-col sm:items-end gap-3">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 rounded-full px-3 py-1.5 text-sm font-bold">{levelName}</div>
              <Button size="sm" className="bg-white text-indigo-700 hover:bg-indigo-50 font-semibold border-0" onClick={() => router.push('/student/learn')}>
                {resumeTopic ? <><Play className="h-4 w-4 mr-1.5" />Continue Learning</> : <><BookOpen className="h-4 w-4 mr-1.5" />Start Learning</>}
              </Button>
              <button onClick={() => openAITutor(undefined, resumeTopic?.subject || '')} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors" aria-label="Chat with AI Tutor">
                <MessageSquare className="h-4 w-4 text-white" />
              </button>
            </div>
            <div className="hidden sm:block w-48">
              <div className="flex justify-between text-xs text-violet-200 mb-1"><span>{levelName}</span><span>{getLevelName(gameState.level + 1)}</span></div>
              <div className="bg-white/20 rounded-full h-1.5 overflow-hidden"><div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${xpProgress.progress}%` }} /></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QUICK STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Clock, label: 'Study Time', value: fmtTime(d.analytics.totalStudyTime || d.stats.studyTime), color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', from: 'from-blue-50', to: 'to-indigo-50', empty: true, emptyLabel: 'Start a 5-min lesson', emptyHref: '/student/learn' },
            { icon: ClipboardList, label: 'Assignments', value: (d.stats.completedAssignments + d.stats.activeAssignments) > 0 ? `${d.stats.completedAssignments}/${d.stats.completedAssignments + d.stats.activeAssignments} done` : '0', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', from: 'from-emerald-50', to: 'to-teal-50', empty: (d.stats.completedAssignments + d.stats.activeAssignments) === 0, emptyLabel: 'View assignments', emptyHref: '/student/assignments' },
            { icon: Star, label: 'Avg Grade', value: d.stats.averageGrade ? `${Math.round(d.stats.averageGrade)}%` : '--', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', from: 'from-amber-50', to: 'to-orange-50', empty: !d.stats.averageGrade, emptyLabel: 'Take a quick quiz', emptyHref: '/student/lesson-plans?tab=quizzes' },
            { icon: Trophy, label: 'Topics', value: d.analytics.completedAssignments > 0 ? `${d.analytics.completedAssignments} mastered` : '0', color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', from: 'from-purple-50', to: 'to-pink-50', empty: d.analytics.completedAssignments === 0, emptyLabel: 'Study a topic', emptyHref: '/student/learn' },
          ].map((stat, i) => (
            <Card key={i} className={`border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br ${stat.from} ${stat.to} ${stat.border}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center shadow-sm`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">{stat.label}</p>
                  {stat.empty ? (
                    <Link href={stat.emptyHref} className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 flex items-center gap-1 group mt-0.5">{stat.emptyLabel} <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" /></Link>
                  ) : (
                    <p className="font-bold text-slate-800 text-lg leading-tight">{stat.value}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Today's Focus + My Learning Areas + Recommendations */}
        <div className="lg:col-span-2 space-y-5">
          {/* Today's Focus */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"><Target className="h-5 w-5 text-indigo-600" />Today&apos;s Focus
              <button onClick={() => openAITutor(undefined, resumeTopic?.subject || 'your studies', resumeTopic?.topic || '')} className="ml-auto text-xs text-indigo-500 hover:text-indigo-700 font-medium flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" />Chat with AI
              </button>
            </h2>
            <div className="space-y-3">
              {!dailyDone && resumeTopic && (
                <Link href="/student/learn" className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-3 border border-amber-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0"><Trophy className="h-5 w-5 text-white" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-amber-900">Daily Challenge</p><p className="text-xs text-amber-700 truncate">{resumeTopic.subject}: {resumeTopic.topic}</p></div>
                  <ArrowRight className="h-5 w-5 text-amber-500 shrink-0" />
                </Link>
              )}
              {dueReviews.length > 0 && (
                <Link href="/student/learn" className="flex items-center gap-3 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-3 border border-orange-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shrink-0"><Repeat className="h-5 w-5 text-white" /></div>
                  <div className="flex-1 min-w-0"><p className="text-sm font-bold text-orange-900">{dueReviews.length} topic{dueReviews.length !== 1 ? 's' : ''} due for review</p><p className="text-xs text-orange-700 truncate">{dueReviews.slice(0, 2).map(r => r.topic).join(', ')}</p></div>
                  <ArrowRight className="h-5 w-5 text-orange-500 shrink-0" />
                </Link>
              )}
              {!resumeTopic && !dueReviews.length && (
                <Link href="/student/learn" className="flex items-center gap-3 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-xl p-3 border border-indigo-200 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0"><BookOpen className="h-5 w-5 text-white" /></div>
                  <div className="flex-1"><p className="text-sm font-bold text-indigo-900">Start a new study session</p><p className="text-xs text-indigo-700">Pick a topic from your curriculum</p></div>
                  <ArrowRight className="h-5 w-5 text-indigo-500 shrink-0" />
                </Link>
              )}
            </div>
          </div>

          {/* My Learning Areas */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-teal-600" />My Learning Areas</h2>
              <Link href="/student/learn" className="text-xs text-teal-600 font-semibold hover:underline flex items-center gap-1">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {getSubjectCards(studentGrade, effectiveCurriculum).map((subject) => (
                <Link key={subject.name} href={`/student/learn?subject=${encodeURIComponent(subject.name)}`}
                  className={`${subject.bg} rounded-xl p-3 border border-slate-100 hover:shadow-md hover:scale-[1.02] transition-all cursor-pointer group`}>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm"><subject.icon className={`h-4 w-4 ${subject.color}`} /></div>
                    <span className="text-xs font-semibold text-slate-700 truncate">{subject.name}</span>
                  </div>
                </Link>
              ))}
              <Link href="/student/learn" className="rounded-xl border-2 border-dashed border-slate-200 p-3 flex flex-col items-center justify-center gap-1.5 hover:border-teal-300 hover:bg-teal-50/50 transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors"><Plus className="h-4 w-4 text-slate-400 group-hover:text-teal-600" /></div>
                <span className="text-[10px] font-semibold text-slate-400 group-hover:text-teal-600">Explore All</span>
              </Link>
            </div>
          </div>

          {/* Study Recommendations */}
          <SmartRecommendations />
        </div>

        {/* RIGHT COLUMN: Upcoming + Recent Activity */}
        <div className="space-y-5">
          {/* Upcoming */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3"><Clock className="h-5 w-5 text-cyan-600" />Upcoming</h2>
            {(upcomingEvents?.length ?? 0) > 0 ? (
              <div className="space-y-2.5">
                {upcomingEvents!.slice(0, 4).map((event, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: event.type === 'exam' ? '#ef4444' : event.type === 'live' ? 'LIVE' : '#3b82f6' }} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{event.type === 'live' ? 'LIVE' : event.type === 'assignment' ? 'ASSIGNMENT' : 'CLASS'}</p>
                      <p className="font-medium text-slate-700 truncate text-xs">{event.title}</p>
                      <p className="text-[10px] text-slate-400">
                        {event.teacherName ? `${formatTeacherName(event.teacherName)} ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ` : ''}
                        {event.dueDate ? `Due ${formatDate(event.dueDate)}` : `${formatTime(event.startTime)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">No upcoming exams or live classes</p>
            )}
          </div>

          {/* What do you want to learn next? */}
          <WhatToLearnNext grade={studentGrade} recentSubjects={recentSubjects} dueReviews={dueReviews} curriculum={prefsData?.curriculum} />

          {/* Spaced Repetition — due reviews surfaced on the dashboard */}
          <SpacedRepetitionWidget
            subject={recentSubjects?.[0]}
            onStartReview={(topic) => {
              const subj = recentSubjects?.[0] || 'Mathematics'
              router.push(`/student/learn?subject=${encodeURIComponent(subj)}&topic=${encodeURIComponent(topic)}`)
            }}
          />

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3"><TrendingUp className="h-5 w-5 text-emerald-600" />Recent Activity</h2>
            {(recentActivity?.length ?? 0) > 0 ? (
              <div className="space-y-2.5">
                {(recentActivity ?? []).slice(0, 5).map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    <span className="text-xs">{item.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600">{item.label}</p>
                      <p className="text-[10px] text-slate-400">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Link href="/student/learn" className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 border border-emerald-200 hover:shadow-md transition-all group">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><Zap className="h-4 w-4 text-emerald-600" /></div>
                <div className="flex-1"><p className="text-sm font-semibold text-emerald-800">Start your first micro-lesson</p><p className="text-xs text-emerald-600">Open Learning Hub to begin</p></div>
                <ArrowRight className="h-4 w-4 text-emerald-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            )}
          </div>

          {/* Quick Actions ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â integrated into the sidebar stack */}
          <div className="flex items-center justify-between px-1 pt-1">
            <Link href="/student/assignments" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              <ClipboardList className="h-3.5 w-3.5" /> Assignments
              {d.assignments.length > 0 && <span className="bg-rose-50 text-rose-600 rounded-full px-1.5 py-0.5 text-[10px] font-bold">{d.assignments.length}</span>}
            </Link>
            <Link href="/student/learn" className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors">
              Study Now <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ASSIGNMENTS */}
      {d.assignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><ClipboardList className="h-5 w-5 text-rose-600" />Pending Assignments</h2>
            <Link href="/student/assignments" className="text-xs text-indigo-600 font-semibold hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {d.assignments.filter(a => !d.studySessions.some(s => s.id === a.id)).slice(0, 4).map(a => (
              <div key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0 group">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  a.status === 'Overdue' ? 'bg-red-100' : a.status === 'Submitted' ? 'bg-blue-100' : a.status === 'Completed' ? 'bg-green-100' : 'bg-amber-100'
                }`}>
                  {a.status === 'Completed' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                   a.status === 'Overdue' ? <AlertCircle className="w-4 h-4 text-red-500" /> :
                   a.status === 'Submitted' ? <CheckCircle className="w-4 h-4 text-blue-600" /> :
                   <Clock className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">{a.title}</p>
                  <p className="text-xs text-slate-400">{a.subject} Â· {new Date(a.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${
                  a.status === 'Submitted' ? 'bg-blue-50 text-blue-700' :
                  a.status === 'Completed' ? 'bg-green-50 text-green-700' :
                  a.status === 'Overdue' ? 'bg-red-50 text-red-700' :
                  'bg-amber-50 text-amber-700'
                }`}>{a.status === 'Submitted' ? 'Submitted' : a.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HOPE AI TUTOR DRAWER -- mounted globally via AITutorProvider */}
      <OnboardingTourFab role={session?.user?.role || 'STUDENT'} />
    </div>
  )
}
