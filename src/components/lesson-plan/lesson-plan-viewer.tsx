'use client'

import { Clock, BookOpen } from 'lucide-react'
import { MarkdownRenderer } from '@/components/ui/markdown-renderer'
import {
  normalizeLessonContent,
  extractMarkdownContent,
} from '@/lib/lesson-plan-content'

/**
 * Shared professional lesson plan renderer.
 *
 * Used identically by:
 *  - the list "View" modal
 *  - the lesson plan detail page
 *  - the post-generation preview (create page)
 *  - the edit page preview
 *
 * It always parses JSON strings first, then renders the lesson with the
 * same professional card template (gradient header, KICD meta grid,
 * SLOs, KIQs, competencies/values/PCIs, lesson development, resources,
 * assessment, extension activities, differentiation, reflection).
 * Raw JSON is never shown to the teacher.
 */

interface LessonPlanViewerProps {
  content: any
  title?: string
  teacherName?: string
  date?: string
}

export function LessonPlanViewer({ content, teacherName, date }: LessonPlanViewerProps) {
  const c = normalizeLessonContent(content)

  if (!c || typeof c !== 'object') {
    return <p className="text-sm text-slate-500">No content available.</p>
  }

  // Term plan: { weeks: [...] } — every week with its lessons rendered as cards
  if (Array.isArray(c.weeks)) {
    return (
      <div className="space-y-4">
        {c.weeks.map((week: any, wi: number) => (
          <div key={wi} className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-800 text-white px-4 py-2 text-sm font-semibold flex items-center justify-between">
              <span>Week {week.weekNumber || wi + 1}{week.theme ? ` — ${week.theme}` : ''}</span>
              <span className="text-xs text-slate-300 font-normal">{(week.lessons?.length || 0)} lessons</span>
            </div>
            <div className="divide-y divide-slate-100">
              {(week.lessons || []).map((lesson: any, li: number) => (
                <div key={li} className="p-4">
                  <p className="font-semibold text-sm mb-2">
                    Lesson {lesson.lessonNumber || li + 1}: {lesson.topic || 'Lesson'}
                    {lesson.duration ? <span className="text-xs text-slate-400 ml-2 font-normal"><Clock className="w-3 h-3 inline mr-0.5" />{lesson.duration} min</span> : null}
                  </p>
                  <LessonCard lesson={lesson} teacherName={teacherName} date={date} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Plain markdown / legacy content strings
  const markdown = extractMarkdownContent(c)
  if (markdown !== null) {
    return <MarkdownRenderer content={markdown} />
  }

  return <LessonCard lesson={c} teacherName={teacherName} date={date} />
}

// ── Professional lesson card (same template as the generation preview) ──

function SectionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-blue-200 pl-3 mb-3">
      <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">{label}</p>
      <div className="text-sm text-slate-700">{children}</div>
    </div>
  )
}

function Step({ label, step }: { label: string; step?: any }) {
  if (!step) return null
  return (
    <SectionBlock label={label}>
      <p className="text-xs text-slate-500 mb-0.5">{step.duration} min</p>
      <div className="text-xs mb-1"><span className="font-medium text-blue-700">Teacher:</span> {step.teacherActivity ?? step.teacherActions ?? step.activity}</div>
      {step.learnerActivity || step.studentActions ? (
        <div className="text-xs"><span className="font-medium text-green-700">Learner:</span> {step.learnerActivity ?? step.studentActions}</div>
      ) : null}
    </SectionBlock>
  )
}

function isKICDFormat(lesson: any): boolean {
  return !!(lesson.organisationOfLearning || lesson.coreCompetencies)
}

function toArray(v: any): string[] {
  if (v == null) return []
  if (Array.isArray(v)) return v.map(String).filter(Boolean)
  return [String(v)]
}

export function LessonCard({ lesson, teacherName, date }: { lesson: any; teacherName?: string; date?: string }) {
  const l = normalizeLessonContent(lesson) ?? {}
  const useKICD = isKICDFormat(l)
  const header = l.lessonHeader || {}
  const school = header.school || l.school || ''
  const teacher = header.teacher || teacherName || ''
  const dateStr = header.date || date || ''
  const enrolment = header.enrolment || l.enrolment

  const slos = toArray(l.specificLearningOutcomes)
  const kips = toArray(l.keyInquiryQuestions)
  const comps = toArray(l.coreCompetencies)
  const values = toArray(l.values)
  const pcis = toArray(l.pcis)
  const resources = toArray(l.learningResources)

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3">
        <h3 className="text-white font-bold text-sm">{l.title || 'Lesson Plan'}</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          {(l.duration || header.duration) && (
            <span className="text-blue-100 text-xs"><Clock className="w-3 h-3 inline mr-1" />{l.duration || header.duration} min</span>
          )}
          {useKICD && l.strand && <span className="text-blue-100 text-xs"><BookOpen className="w-3 h-3 inline mr-1" />{l.strand}</span>}
        </div>
      </div>
      <div className="p-4 space-y-3">
        {/* ── KICD Header row ── */}
        {useKICD && (school || teacher || header.grade || header.term || header.week || header.lesson || header.duration || dateStr || enrolment) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2 text-xs bg-slate-50 rounded-lg p-3 border border-slate-100">
            {school && <div><span className="font-medium">School:</span> {school}</div>}
            {teacher && <div><span className="font-medium">Teacher:</span> {teacher}</div>}
            {header.grade && <div><span className="font-medium">Grade:</span> {header.grade}</div>}
            {header.learningArea && <div><span className="font-medium">Learning Area:</span> {header.learningArea}</div>}
            {header.term && <div><span className="font-medium">Term:</span> {header.term}</div>}
            {header.week && <div><span className="font-medium">Week:</span> {header.week}</div>}
            {header.lesson && <div><span className="font-medium">Lesson:</span> {header.lesson}</div>}
            {(header.duration || l.duration) && <div><span className="font-medium">Duration:</span> {header.duration || l.duration} min</div>}
            {dateStr && <div><span className="font-medium">Date:</span> {dateStr}</div>}
            {enrolment ? <div><span className="font-medium">Enrolment:</span> {enrolment}</div> : null}
          </div>
        )}

        {/* ── Strand / Sub-Strand ── */}
        {(l.strand || l.subStrand) && (
          <SectionBlock label="Strand / Sub-Strand">
            <p>{l.strand}{l.strand && l.subStrand ? ' → ' : ''}{l.subStrand}</p>
          </SectionBlock>
        )}

        {/* ── SLOs ── */}
        {slos.length > 0 && (
          <SectionBlock label={Array.isArray(l.specificLearningOutcomes) ? 'Specific Learning Outcomes' : 'Learning Outcomes'}>
            {Array.isArray(l.specificLearningOutcomes)
              ? slos.map((slo, i) => <p key={i} className="mb-0.5">{i + 1}. {slo}</p>)
              : <p>{slos[0]}</p>}
          </SectionBlock>
        )}

        {/* ── KIQs ── */}
        {kips.length > 0 && (
          <SectionBlock label="Key Inquiry Question(s)">
            <ul className="list-disc list-inside space-y-0.5">
              {kips.map((q, i) => <li key={i}>{q}</li>)}
            </ul>
          </SectionBlock>
        )}

        {/* ── Core Competencies (KICD) ── */}
        {comps.length > 0 && (
          <SectionBlock label="Core Competencies">
            <div className="flex flex-wrap gap-1">
              {comps.map((c, i) => (
                <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Values (KICD) ── */}
        {values.length > 0 && (
          <SectionBlock label="Values">
            <div className="flex flex-wrap gap-1">
              {values.map((v, i) => (
                <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">{v}</span>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── PCIs (KICD) ── */}
        {pcis.length > 0 && (
          <SectionBlock label="Pertinent & Contemporary Issues">
            <div className="flex flex-wrap gap-1">
              {pcis.map((p, i) => (
                <span key={i} className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{p}</span>
              ))}
            </div>
          </SectionBlock>
        )}

        {/* ── Organisation of Learning (KICD) ── */}
        {l.organisationOfLearning ? (
          <>
            <Step label="Introduction" step={l.organisationOfLearning.introduction} />
            <Step label="Step 1" step={l.organisationOfLearning.step1} />
            <Step label="Step 2" step={l.organisationOfLearning.step2} />
            <Step label="Step 3" step={l.organisationOfLearning.step3} />
            <Step label="Conclusion" step={l.organisationOfLearning.conclusion} />
          </>
        ) : (
          <>
            {/* ── Legacy structure (backward compat) ── */}
            {l.introduction && (
              <SectionBlock label="Introduction">
                <p className="text-xs text-slate-500 mb-0.5">{l.introduction.duration} min</p>
                <p>{l.introduction.activity}</p>
              </SectionBlock>
            )}
            {l.mainActivity && (
              <SectionBlock label="Main Activity">
                <p className="text-xs text-slate-500 mb-0.5">{l.mainActivity.duration} min</p>
                <p>{l.mainActivity.activity}</p>
                {l.mainActivity.coreCompetencies && toArray(l.mainActivity.coreCompetencies).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {toArray(l.mainActivity.coreCompetencies).map((c, i) => (
                      <span key={i} className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">{c}</span>
                    ))}
                  </div>
                )}
              </SectionBlock>
            )}
            {l.practiceActivity && (
              <SectionBlock label="Practice">
                <p className="text-xs text-slate-500 mb-0.5">{l.practiceActivity.duration} min</p>
                <p>{l.practiceActivity.activity}</p>
              </SectionBlock>
            )}
            {l.conclusion && (
              <SectionBlock label="Conclusion">
                <p className="text-xs text-slate-500 mb-0.5">{l.conclusion.duration} min</p>
                <p>{l.conclusion.activity}</p>
              </SectionBlock>
            )}
          </>
        )}

        {/* ── Learning Resources ── */}
        {resources.length > 0 && (
          <SectionBlock label="Resources">
            <ul className="list-disc list-inside space-y-0.5">
              {resources.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </SectionBlock>
        )}

        {/* ── Assessment ── */}
        {l.assessment && (
          <SectionBlock label="Assessment">
            <p>{l.assessment}</p>
          </SectionBlock>
        )}

        {/* ── Extended Activities (KICD) / Legacy fields ── */}
        {(l.extendedActivities || l.homework) && (
          <SectionBlock label={l.extendedActivities ? 'Extended Activities' : 'Homework'}>
            <p>{l.extendedActivities || l.homework}</p>
          </SectionBlock>
        )}

        {/* ── Differentiation (legacy) ── */}
        {l.differentiation && (
          <SectionBlock label="Differentiation">
            {l.differentiation.support && <p className="mb-0.5"><span className="font-medium">Support:</span> {l.differentiation.support}</p>}
            {l.differentiation.extension && <p><span className="font-medium">Extension:</span> {l.differentiation.extension}</p>}
          </SectionBlock>
        )}

        {/* ── Reflection ── */}
        {(l.reflection || l.teacherReflection) && (
          <SectionBlock label="Teacher Reflection">
            <p className="italic text-slate-500">{l.reflection || l.teacherReflection}</p>
          </SectionBlock>
        )}
      </div>
    </div>
  )
}
