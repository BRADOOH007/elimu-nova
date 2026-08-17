'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Radio, GraduationCap, Calculator, BookOpen, FlaskConical, Globe, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GED_SUBJECTS } from '@/lib/constants/ged'

const SUBJECT_META: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  'Mathematical Reasoning': { icon: Calculator, color: 'text-blue-600', bg: 'bg-blue-50' },
  'Reasoning Through Language Arts': { icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  'Science': { icon: FlaskConical, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  'Social Studies': { icon: Globe, color: 'text-orange-600', bg: 'bg-orange-50' },
}

export default function SeniorTeacherDashboard() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">
      {/* HERO */}
      <Card className="border-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-green-700 text-white shadow-xl overflow-hidden relative">
        <CardContent className="relative p-6 md:p-8">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="h-4 w-4 text-emerald-200" />
            <span className="text-xs font-medium text-emerald-100 uppercase tracking-wider">Adult Education Instructor</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Welcome to your teaching hub</h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-xl">
            Teach adult learners preparing for the US General Education Diploma (GED) — run live lessons, guide them
            through the four subjects, and help them build computer &amp; AI literacy.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/senior-teacher/live-class">
              <Button size="sm" className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold border-0">
                <Radio className="h-4 w-4 mr-1.5" /> Start Live Lesson
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* GED subjects you teach */}
      <div>
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-3">
          <GraduationCap className="h-5 w-5 text-emerald-600" /> GED subjects you teach
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {GED_SUBJECTS.map((s) => {
            const meta = SUBJECT_META[s] ?? { icon: BookOpen, color: 'text-slate-600', bg: 'bg-slate-50' }
            const Icon = meta.icon
            return (
              <Card key={s} className={`border-0 shadow-sm ${meta.bg}`}>
                <CardContent className="p-4">
                  <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm mb-2">
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                  </div>
                  <p className="text-sm font-semibold text-slate-800 leading-tight">{s}</p>
                  <Link href="/senior-teacher/live-class" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-1.5 hover:underline">
                    Teach live <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
