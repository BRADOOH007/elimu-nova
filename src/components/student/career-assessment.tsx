'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Compass, Loader2, Sparkles, Briefcase, BookOpen, ArrowRight, Star, RefreshCw } from 'lucide-react'

const INTEREST_OPTIONS = [
  { value: 'solving_problems', label: 'Solving Problems', icon: '🧩' },
  { value: 'creative_arts', label: 'Creative Arts & Design', icon: '🎨' },
  { value: 'helping_people', label: 'Helping People', icon: '🤝' },
  { value: 'building_things', label: 'Building & Making Things', icon: '🔧' },
  { value: 'nature_science', label: 'Nature & Science', icon: '🔬' },
  { value: 'leading_teams', label: 'Leading Teams', icon: '👥' },
  { value: 'computers_tech', label: 'Computers & Technology', icon: '💻' },
  { value: 'business_money', label: 'Business & Money', icon: '💰' },
  { value: 'teaching_others', label: 'Teaching Others', icon: '📚' },
  { value: 'health_fitness', label: 'Health & Fitness', icon: '🏥' },
]

const SKILL_OPTIONS = [
  { value: 'math', label: 'Mathematics & Numbers' },
  { value: 'writing', label: 'Writing & Communication' },
  { value: 'science', label: 'Science & Analysis' },
  { value: 'art_design', label: 'Art & Design' },
  { value: 'public_speaking', label: 'Public Speaking' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'leadership', label: 'Leadership & Management' },
  { value: 'technology', label: 'Technology & Coding' },
  { value: 'music_arts', label: 'Music & Performing Arts' },
  { value: 'sports', label: 'Sports & Physical Activity' },
]

interface CareerResult {
  summary: string
  topCareers: Array<{
    title: string
    field: string
    match: number
    why: string
    subjects: string[]
    path: string
  }>
  subjectRecommendations: Array<{
    subject: string
    reason: string
    priority: string
  }>
  actionSteps: string[]
}

export function CareerAssessment() {
  const [step, setStep] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [interests, setInterests] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CareerResult | null>(null)
  const [expandedCareer, setExpandedCareer] = useState<string | null>(null)

  const toggleInterest = (v: string) => {
    setInterests(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const toggleSkill = (v: string) => {
    setSkills(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])
  }

  const handleAnalyse = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strengths: skills,
          interests: interests,
          grade: '',
          skills: skills,
          goals: 'Find the best career path based on my interests and skills',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setResult({
          summary: data.summary || '',
          topCareers: data.topCareers || [],
          subjectRecommendations: data.subjectRecommendations || [],
          actionSteps: data.actionSteps || [],
        })
        setStep('results')
      }
    } catch (e) { console.error('Career assessment failed:', e) }
    setLoading(false)
  }

  if (step === 'intro') {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-100">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4">
            <Compass className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">Discover Your Career Path</h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
            Answer a few questions about your interests and skills, and our AI will recommend the best career paths and subjects to focus on.
          </p>
          <Button
            onClick={() => setStep('quiz')}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
          >
            <Sparkles className="h-4 w-4 mr-2" /> Start Assessment
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (step === 'quiz') {
    return (
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              What are you interested in? ({interests.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleInterest(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    interests.includes(opt.value)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                  }`}
                >
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-blue-500" />
              What are your strengths? ({skills.length} selected)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleSkill(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                    skills.includes(opt.value)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleAnalyse}
          disabled={loading || interests.length === 0 || skills.length === 0}
          className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90"
        >
          {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analysing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Get Career Recommendations</>}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Button variant="outline" size="sm" onClick={() => { setStep('intro'); setResult(null) }}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Retake Assessment
      </Button>

      {result?.summary && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
            <p className="text-sm text-indigo-800 leading-relaxed">{result.summary}</p>
          </div>
        </div>
      )}

      {result?.topCareers && result.topCareers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              Your Top Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.topCareers.map((career, i) => (
              <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedCareer(expandedCareer === career.title ? null : career.title)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {i + 1}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-slate-800">{career.title}</p>
                      <p className="text-xs text-slate-400">{career.field}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-black text-indigo-600">{career.match}%</p>
                      <p className="text-[10px] text-slate-400">match</p>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-slate-300 transition-transform ${expandedCareer === career.title ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {expandedCareer === career.title && (
                  <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 space-y-2">
                    <p className="text-sm text-slate-700">{career.why}</p>
                    {career.subjects?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-1">Key Subjects:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {career.subjects.map(sub => (
                            <span key={sub} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-slate-500 leading-relaxed">{career.path}</p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result?.subjectRecommendations && result.subjectRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-600" />
              Subject Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.subjectRecommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${
                  rec.priority === 'high' ? 'bg-green-500' : rec.priority === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                }`}>
                  {rec.priority === 'high' ? 'H' : rec.priority === 'medium' ? 'M' : 'L'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rec.subject}</p>
                  <p className="text-xs text-slate-500">{rec.reason}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result?.actionSteps && result.actionSteps.length > 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
          <p className="font-semibold text-green-800 text-sm mb-3 flex items-center gap-2">
            <Star className="h-4 w-4" /> Next Steps
          </p>
          <ol className="space-y-2">
            {result.actionSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-green-700">
                <span className="w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
