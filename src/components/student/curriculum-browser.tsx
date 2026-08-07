'use client'

import { useState, useEffect } from 'react'
import { BookOpen, ChevronRight, ChevronDown, ExternalLink, Loader2, Play, CheckCircle2, RefreshCw } from 'lucide-react'
import { getKECWorkbook, getKECCategoryUrl } from '@/data/kec-workbooks'

interface Strand {
  id: string
  name: string
  order: number
}

interface Substrand {
  id: string
  name: string
  learningOutcomes: string[]
  activities: string[]
  order: number
}

interface CurriculumBrowserProps {
  onSelectTopic: (subject: string, topic: string, learningOutcomes?: string[]) => void
  defaultSubject?: string
  defaultGrade?: string
}

const GRADES = ['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Form 1','Form 2','Form 3','Form 4']
const SUBJECTS = ['Mathematics','English','Kiswahili','Science','Social Studies','CRE','Physics','Chemistry','Biology','History','Geography','Agriculture','Business Studies','Computer Studies']

const STATUS_STYLE: Record<string, string> = {
  COMPLETED: 'bg-green-100 text-green-700 border-green-200',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border-amber-200',
  NOT_STARTED: 'bg-slate-100 text-slate-500 border-slate-200',
}

export function CurriculumBrowser({ onSelectTopic, defaultSubject, defaultGrade }: CurriculumBrowserProps) {
  const [grade, setGrade] = useState(defaultGrade || 'Grade 4')
  const [subject, setSubject] = useState(defaultSubject || 'Mathematics')
  const [strands, setStrands] = useState<Strand[]>([])
  const [expandedStrand, setExpandedStrand] = useState<string | null>(null)
  const [substrands, setSubstrands] = useState<Record<string, Substrand[]>>({})
  const [loading, setLoading] = useState(false)
  const [loadingSubstrands, setLoadingSubstrands] = useState<string | null>(null)
  const [statusMap, setStatusMap] = useState<Record<string, { status: string; lastContent: string | null }>>({})

  // Keep internal grade/subject in sync when the parent updates the defaults
  // (e.g. clicking a Learning Area on the dashboard soft-navigates to /student/learn?subject=X)
  useEffect(() => {
    if (defaultSubject) setSubject(defaultSubject)
  }, [defaultSubject])

  useEffect(() => {
    if (defaultGrade) setGrade(defaultGrade)
  }, [defaultGrade])

  useEffect(() => {
    fetchStrands()
  }, [grade, subject])

  useEffect(() => {
    fetchStatuses()
  }, [grade, subject])

  const fetchStatuses = async () => {
    try {
      const res = await fetch(`/api/student/learning-path?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      if (res.ok) {
        const data = await res.json()
        const map: Record<string, { status: string; lastContent: string | null }> = {}
        ;(data.topics || []).forEach((t: any) => {
          map[t.topicName] = { status: t.status, lastContent: t.lastContent || null }
        })
        setStatusMap(map)
      }
    } catch { /* ignore */ }
  }

  const statusBadge = (name: string) => {
    const s = statusMap[name]?.status
    if (!s || s === 'NOT_STARTED') return null
    if (s === 'COMPLETED') return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold border border-green-300 bg-green-50 text-green-700 rounded-full px-1.5 py-0.5">
        <CheckCircle2 className="h-2.5 w-2.5" /> Mastered
      </span>
    )
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold border rounded-full px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-200">
        <RefreshCw className="h-2.5 w-2.5" /> In progress
      </span>
    )
  }

  const fetchStrands = async () => {
    setLoading(true)
    setExpandedStrand(null)
    setSubstrands({})
    try {
      const res = await fetch(`/api/curriculum/strands?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}`)
      if (res.ok) {
        const data = await res.json()
        const strandsArr = data.strands || []
        if (strandsArr.length > 0) {
          setStrands(strandsArr)
        } else {
          const fallback = getFallbackTopics(subject)
          setStrands(fallback.map((t, i) => ({ id: `fb-${i}`, name: t, order: i })))
        }
      } else {
        const fallback = getFallbackTopics(subject)
        setStrands(fallback.map((t, i) => ({ id: `fb-${i}`, name: t, order: i })))
      }
    } catch {
      const fallback = getFallbackTopics(subject)
      setStrands(fallback.map((t, i) => ({ id: `fb-${i}`, name: t, order: i })))
    }
    setLoading(false)
  }

  const getFallbackTopics = (subj: string): string[] => {
    const map: Record<string, string[]> = {
      Mathematics: ['Whole Numbers','Fractions','Decimals','Measurement','Geometry','Algebra','Data Handling'],
      English: ['Reading Comprehension','Grammar','Writing','Vocabulary','Poetry'],
      Kiswahili: ['Sarufi','Msamiati','Ufahamu','Insha','Fasihi'],
      Science: ['Living Things','Energy','Light','Sound','Forces','Materials','Weather'],
      'Social Studies': ['Our Country','Environment','Resources','Transport','Government'],
      Physics: ['Forces','Motion','Energy','Waves','Light','Electricity','Magnetism'],
      Chemistry: ['States of Matter','Mixtures','Chemical Reactions','Acids & Bases'],
      Biology: ['Cells','Classification','Nutrition','Respiration','Reproduction','Ecology'],
      History: ['Early Man','Trade','Colonial Administration','Independence'],
      Geography: ['Map Work','Weather & Climate','Vegetation','Population'],
      Agriculture: ['Crop Farming','Animal Keeping','Soil Preparation'],
      'Business Studies': ['Business Environment','Entrepreneurship','Money & Banking'],
      'Computer Studies': ['Computer Basics','Programming','Internet','Data Security'],
      CRE: ['Creation','The Bible','Jesus Christ','Christian Values'],
    }
    return map[subj] || ['General']
  }

  const toggleStrand = async (strandId: string, strandName: string) => {
    if (expandedStrand === strandId) {
      setExpandedStrand(null)
      return
    }
    setExpandedStrand(strandId)
    if (!substrands[strandId]) {
      setLoadingSubstrands(strandId)
      try {
        const res = await fetch(`/api/curriculum/substrands?strandId=${strandId}`)
        if (res.ok) {
          const data = await res.json()
          setSubstrands(prev => ({ ...prev, [strandId]: data.substrands || [] }))
        }
      } catch { /* ignore */ }
      setLoadingSubstrands(null)
    }
  }

  const handleStudy = (strandName: string, substrandName?: string, learningOutcomes?: string[]) => {
    const topic = substrandName || strandName
    onSelectTopic(subject, topic, learningOutcomes)
  }

  const studyLabel = (name: string) => {
    const s = statusMap[name]?.status
    if (s === 'COMPLETED') return <><CheckCircle2 className="h-3 w-3" /> Mastered</>
    if (s === 'IN_PROGRESS') return <><RefreshCw className="h-3 w-3" /> Continue</>
    return <><Play className="h-3 w-3" /> Study</>
  }

  const isMastered = (name: string) => statusMap[name]?.status === 'COMPLETED'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Grade</label>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="w-full h-9 px-3 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {GRADES.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Subject</label>
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full h-9 px-3 border border-slate-200 rounded-2xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500">
            {SUBJECTS.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {strands.length > 0 ? `${strands.length} strands available` : ''}
        </p>
        <div className="flex gap-2">
          {(() => {
            const kec = getKECWorkbook(grade, subject)
            const catUrl = getKECCategoryUrl(grade)
            if (kec?.pageUrl || kec?.courseUrl) {
              return (
                <a
                  href={kec.pageUrl || kec.courseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full px-3 py-1.5 transition-all"
                >
                  <ExternalLink className="h-3 w-3" /> KEC Workbook
                </a>
              )
            }
            if (catUrl) {
              return (
                <a
                  href={catUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1.5 transition-all"
                >
                  <ExternalLink className="h-3 w-3" /> KEC Resources
                </a>
              )
            }
            return null
          })()}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 text-teal-500 animate-spin" /></div>
      ) : strands.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">No strands found for this grade and subject.</div>
      ) : (
        <div className="space-y-1">
          {strands.map(strand => (
            <div key={strand.id} className="border border-slate-200 rounded-xl overflow-hidden">
              <div
                onClick={() => toggleStrand(strand.id, strand.name)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStrand(strand.id, strand.name) } }}
                role="button" tabIndex={0}
                className="w-full flex items-center justify-between px-4 py-3 bg-white hover:bg-slate-50 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen className="h-4 w-4 text-teal-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-800">{strand.name}</span>
                  {statusBadge(strand.name)}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={isMastered(strand.name) ? undefined : (e => { e.stopPropagation(); handleStudy(strand.name) })}
                    disabled={isMastered(strand.name)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
                      isMastered(strand.name)
                        ? 'text-green-600 bg-green-50 cursor-default'
                        : 'text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-500 hover:shadow-md'
                    }`}
                  >
                    {studyLabel(strand.name)}
                  </button>
                  {expandedStrand === strand.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
              </div>
              {expandedStrand === strand.id && (
                <div className="border-t border-slate-100 bg-slate-50/50 px-4 py-2">
                  {loadingSubstrands === strand.id ? (
                    <div className="flex items-center gap-2 py-2 text-xs text-slate-400"><Loader2 className="h-3 w-3 animate-spin" /> Loading topics...</div>
                  ) : substrands[strand.id]?.length > 0 ? (
                    <div className="space-y-0.5">
                      {substrands[strand.id].map(sub => (
                        <div key={sub.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white transition-colors group">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-700 truncate">{sub.name}</p>
                            {sub.learningOutcomes.length > 0 && (
                              <p className="text-[10px] text-slate-400 truncate mt-0.5">{sub.learningOutcomes[0]}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {statusBadge(sub.name)}
                            <button
                              onClick={() => handleStudy(strand.name, sub.name, sub.learningOutcomes)}
                              className="text-xs font-semibold text-teal-600 hover:text-white bg-teal-50 hover:bg-teal-500 px-2.5 py-1 rounded-full transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 hover:shadow-md"
                            >
                              {studyLabel(sub.name)}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-2">No substrands available.</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
