"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Lightbulb, ArrowRight } from "lucide-react"
import Link from "next/link"

interface CommonMistakesProps {
  mistakes: any
  preferredDifficulty: string
}

export default function CommonMistakes({ mistakes, preferredDifficulty }: CommonMistakesProps) {
  const mistakeList: string[] = mistakes ? (Array.isArray(mistakes) ? mistakes : []) : []

  if (mistakeList.length === 0) return null

  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Watch Out For
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-amber-700 font-medium">Common mistakes detected in your learning:</p>
        <ul className="space-y-2">
          {mistakeList.map((mistake: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="text-amber-500 mt-0.5 shrink-0">•</span>
              <span className="text-slate-700">{mistake}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 pt-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span className="text-xs text-slate-500">Difficulty: <span className="font-medium capitalize">{preferredDifficulty}</span></span>
        </div>
        <Link
          href="/student/learn?tab=study"
          className="flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700 font-medium mt-2 group"
        >
          Review these topics
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </CardContent>
    </Card>
  )
}
