'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { Compass, ArrowRight, ArrowUpRight, Sparkles } from 'lucide-react'

type Status = 'In Progress' | 'Up Next' | 'Needs Review'

interface Suggestion {
  subject: string
  topic: string
  status: Status
}

interface WhatToLearnNextProps {
  grade?: string
  recentSubjects?: string[]
  dueReviews?: Array<{ subject?: string; topic: string }>
}

interface SubjectPath {
  subject: string
  topics: Array<{ topicName: string; status?: string }>
}

const DEFAULT_SUBJECTS = ['Mathematics', 'Science', 'Kiswahili']

const STATUS_STYLE: Record<Status, string> = {
  'In Progress': 'bg-amber-50 text-amber-700',
  'Up Next': 'bg-blue-50 text-blue-700',
  'Needs Review': 'bg-rose-50 text-rose-700',
}

function topicHref(subject: string, topic: string) {
  return `/student/learn?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`
}

async function loadPaths(grade: string, subjects: string[]): Promise<SubjectPath[]> {
  return Promise.all(
    subjects.map(async subject => {
      try {
        const res = await fetch(`/api/student/learning-path?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
        if (!res.ok) return { subject, topics: [] }
        const data = await res.json()
        return { subject, topics: (data.topics || []) as SubjectPath['topics'] }
      } catch {
        return { subject, topics: [] }
      }
    }),
  )
}

function buildSuggestions(results: SubjectPath[] | undefined, dueReviews: WhatToLearnNextProps['dueReviews'] = []): Suggestion[] {
  const inProgress: Suggestion[] = []
  const upNext: Suggestion[] = []
  for (const { subject, topics } of results || []) {
    const ip = topics.find(t => t.status === 'IN_PROGRESS')
    if (ip) inProgress.push({ subject, topic: ip.topicName, status: 'In Progress' })
    const ns = topics.find(t => !t.status || t.status === 'NOT_STARTED')
    if (ns) upNext.push({ subject, topic: ns.topicName, status: 'Up Next' })
  }

  const seen = new Set<string>()
  const next: Suggestion[] = []
  const push = (s: Suggestion) => {
    const key = `${s.subject}|${s.topic}`
    if (!s.topic || seen.has(key) || next.length >= 3) return
    seen.add(key)
    next.push(s)
  }

  for (const r of dueReviews) {
    if (!r.topic) continue
    const subject = r.subject && r.subject.trim() ? r.subject : 'Mathematics'
    push({ subject, topic: r.topic, status: 'Needs Review' })
  }
  for (const s of inProgress) push(s)
  for (const s of upNext) push(s)

  if (next.length === 0) {
    for (const { subject, topics } of results || []) {
      if (topics[0]) push({ subject, topic: topics[0].topicName, status: 'Up Next' })
    }
  }

  return next
}

export default function WhatToLearnNext({ grade = 'Grade 4', recentSubjects = [], dueReviews = [] }: WhatToLearnNextProps) {
  const subjects = useMemo(
    () => Array.from(new Set([...recentSubjects, ...DEFAULT_SUBJECTS].filter(Boolean))).slice(0, 3),
    [recentSubjects.join(',')], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const key = `what-to-learn-next|${grade}|${subjects.join(',')}`
  const { data, isLoading } = useSWR<SubjectPath[]>(
    key,
    () => loadPaths(grade, subjects),
    { revalidateOnFocus: false, revalidateOnReconnect: false, dedupingInterval: 5 * 60 * 1000 },
  )

  const suggestions = useMemo(() => buildSuggestions(data, dueReviews), [data, dueReviews])

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:border-purple-300 transition-all">
      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
        <Compass className="h-5 w-5 text-purple-600" />
        <span>What do you want to learn next?</span>
      </h2>

      <div className="space-y-2.5">
        {isLoading ? (
          <>
            {[0, 1, 2].map(i => (
              <div key={i} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5 animate-pulse">
                <div className="h-2 w-24 bg-slate-200 rounded mb-2" />
                <div className="h-3.5 w-32 bg-slate-200 rounded" />
              </div>
            ))}
          </>
        ) : suggestions.length === 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 p-3">
            <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-purple-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-700">Pick a topic from your curriculum</p>
              <p className="text-xs text-slate-400">Browse the full subject list to start</p>
            </div>
          </div>
        ) : (
          suggestions.map(s => (
            <Link
              key={`${s.subject}|${s.topic}`}
              href={topicHref(s.subject, s.topic)}
              className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/60 hover:border-purple-200 p-2.5 transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide truncate">{s.subject}</span>
                  <span className={`text-[10px] font-semibold rounded-full px-1.5 py-0.5 shrink-0 ${STATUS_STYLE[s.status]}`}>{s.status}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-purple-700 transition-colors">{s.topic}</p>
              </div>
              <span className="text-xs font-bold text-purple-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 shrink-0">
                Start <ArrowUpRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          ))
        )}
      </div>

      <Link
        href="/student/learn"
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-sm font-semibold py-2.5 hover:shadow-md transition-all"
      >
        Browse Full Curriculum <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
