'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Compass, Sparkles, Loader2, TrendingUp, BookOpen,
  ArrowRight, CheckCircle, Star, GraduationCap, Target,
  ChevronDown, ChevronUp, Building2
} from 'lucide-react'

interface Career {
  title: string; field: string; match: number; why: string
  subjects: string[]; universities: string[]; path: string
}
interface SubjectRec { subject: string; reason: string; priority: 'high' | 'medium' | 'low' }
interface CareerResult {
  summary: string
  topCareers: Career[]
  subjectRecommendations: SubjectRec[]
  actionSteps: string[]
  studentProfile: { grade: string; strengths: string; interests: string; topSubjects: { subject: string; avg: number }[]; averageGrade: number | null }
}

const GRADES = [
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'Form 1', 'Form 2', 'Form 3', 'Form 4',
]

const INTEREST_OPTIONS = [
  'Science & Technology', 'Mathematics', 'Arts & Design', 'Business & Finance',
  'Healthcare & Medicine', 'Law & Justice', 'Education & Teaching', 'Engineering',
  'Agriculture & Environment', 'Sports & Fitness', 'Media & Communication', 'Music & Performing Arts',
]

export default function CareerPathwaysPage() {
  const { data: session } = useSession()
  const [step, setStep]           = useState<'form' | 'loading' | 'results'>('form')
  const [grade, setGrade]         = useState('')
  const [strengths, setStrengths] = useState('')
  const [interests, setInterests] = useState<string[]>([])
  const [results, setResults]     = useState<CareerResult | null>(null)
  const [expanded, setExpanded]   = useState<number | null>(0)
  const [error, setError]         = useState('')

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])

  const submit = async () => {
    if (!grade) { setError('Please select your grade'); return }
    setError('')
    setStep('loading')
    try {
      const res = await fetch('/api/student/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade, strengths, interests: interests.join(', ') }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResults(data)
      setStep('results')
    } catch (e: any) {
      setError(e.message || 'Failed to generate guidance. Please try again.')
      setStep('form')
    }
  }

  const matchColor = (m: number) => {
    if (m >= 85) return 'text-green-600 bg-green-50 border-green-200'
    if (m >= 70) return 'text-amber-600 bg-amber-50 border-amber-200'
    return 'text-blue-600 bg-blue-50 border-blue-200'
  }

  const priorityColor = (p: string) => {
    if (p === 'high')   return 'bg-red-100 text-red-700'
    if (p === 'medium') return 'bg-amber-100 text-amber-700'
    return 'bg-slate-100 text-slate-600'
  }

  /* ── FORM ── */
  if (step === 'form') return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
          <Compass className="h-3 w-3" /> Career Pathways
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
          Discover Your{' '}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Career Path
          </span>
        </h1>
        <p className="text-slate-500">
          Answer a few questions and our AI will analyse your academic strengths to suggest careers and subjects that match you.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
        {/* Grade */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">What grade are you in? *</label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {GRADES.map(g => (
              <button
                key={g}
                onClick={() => setGrade(g)}
                className={`py-2 px-3 rounded-xl text-sm font-medium border transition-all ${
                  grade === g
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">What are you interested in? (pick all that apply)</label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(i => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={`py-1.5 px-3 rounded-full text-sm border transition-all ${
                  interests.includes(i)
                    ? 'bg-purple-100 text-purple-700 border-purple-300 font-medium'
                    : 'border-slate-200 text-slate-600 hover:border-purple-300'
                }`}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Strengths */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">What do you feel are your strengths? (optional)</label>
          <textarea
            value={strengths}
            onChange={e => setStrengths(e.target.value)}
            placeholder="e.g. I'm good at solving problems, I enjoy working with people, I like drawing and design..."
            rows={3}
            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
        </div>

        <button
          onClick={submit}
          className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all"
        >
          <Sparkles className="h-4 w-4" /> Generate My Career Pathways
        </button>
      </div>

      <p className="text-xs text-center text-slate-400">
        The AI uses your academic data, mastery scores and AI tutor history to personalise these results.
      </p>
    </div>
  )

  /* ── LOADING ── */
  if (step === 'loading') return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
        <Compass className="h-8 w-8 text-white animate-pulse" />
      </div>
      <p className="text-slate-700 font-semibold">Analysing your academic profile...</p>
      <p className="text-slate-400 text-sm">AI is reviewing your subjects, strengths and interests</p>
      <Loader2 className="h-6 w-6 text-purple-500 animate-spin mt-2" />
    </div>
  )

  /* ── RESULTS ── */
  if (!results) return null

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Career Pathways</h1>
          <p className="text-slate-500 text-sm mt-0.5">Personalised guidance based on your profile</p>
        </div>
        <button
          onClick={() => { setStep('form'); setResults(null) }}
          className="text-sm text-blue-600 hover:underline flex items-center gap-1"
        >
          <ArrowRight className="h-3.5 w-3.5 rotate-180" /> Redo assessment
        </button>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800 mb-1">AI Summary</p>
            <p className="text-slate-600 text-sm leading-relaxed">{results.summary}</p>
          </div>
        </div>
      </div>

      {/* Career cards */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-purple-600" /> Top Career Matches
        </h2>
        <div className="space-y-3">
          {results.topCareers?.map((career, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{career.title}</p>
                    <p className="text-slate-500 text-sm">{career.field}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-3 py-1 rounded-full border ${matchColor(career.match)}`}>
                    {career.match}% match
                  </span>
                  {expanded === i ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </div>
              </button>

              {expanded === i && (
                <div className="px-5 pb-5 border-t border-slate-100 pt-4 space-y-4">
                  <p className="text-slate-600 text-sm">{career.why}</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Key Subjects</p>
                      <div className="flex flex-wrap gap-2">
                        {career.subjects?.map(s => (
                          <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">University Examples</p>
                      <div className="flex flex-wrap gap-2">
                        {career.universities?.map(u => (
                          <span key={u} className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-1 rounded-full flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {u}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Pathway</p>
                    <p className="text-sm text-slate-700">{career.path}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Subject recommendations */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-blue-600" /> Subject Focus Recommendations
        </h2>
        <div className="space-y-3">
          {results.subjectRecommendations?.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-white border border-slate-200 rounded-2xl">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-slate-800 text-sm">{rec.subject}</p>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityColor(rec.priority)}`}>
                    {rec.priority} priority
                  </span>
                </div>
                <p className="text-slate-500 text-sm">{rec.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action steps */}
      <div>
        <h2 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-600" /> Next Action Steps
        </h2>
        <div className="space-y-2">
          {results.actionSteps?.map((step, i) => (
            <div key={i} className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
              <p className="text-slate-700 text-sm">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
