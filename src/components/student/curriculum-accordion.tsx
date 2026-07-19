"use client"

import { BookMarked, Layers, Calendar, BookOpen, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface SubStrand {
  name: string
}

interface Strand {
  name: string
  subStrands: SubStrand[]
}

interface LearningArea {
  name: string
  strands: Strand[]
}

interface CurriculumAccordionProps {
  learningAreas: LearningArea[]
  currentTerm: number
}

function getSubjectGradient(name: string) {
  const n = name.toLowerCase()
  if (n.includes("math")) return "from-blue-600 via-blue-500 to-cyan-400"
  if (n.includes("english") || n.includes("language")) return "from-emerald-600 via-green-500 to-teal-400"
  if (n.includes("science") || n.includes("environment")) return "from-purple-600 via-violet-500 to-indigo-400"
  if (n.includes("social") || n.includes("studies")) return "from-orange-600 via-amber-500 to-yellow-400"
  return "from-primary via-primary/80 to-primary/60"
}

export default function CurriculumAccordion({ learningAreas, currentTerm }: CurriculumAccordionProps) {
  const router = useRouter()

  return (
    <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background/95 via-background/90 to-muted/50 backdrop-blur-xl mt-8">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <BookMarked className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          My Learning Areas
        </CardTitle>
        <CardDescription className="text-gray-600">
          Explore your curriculum organized by subject
        </CardDescription>
      </CardHeader>

      <CardContent className="relative">
        <Accordion type="single" collapsible defaultValue="term-1">
          {[1, 2, 3].map((term) => (
            <AccordionItem key={term} value={`term-${term}`} className="border-none">
              <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md ${
                    term === currentTerm
                      ? "bg-gradient-to-br from-blue-500 to-blue-600"
                      : "bg-gradient-to-br from-gray-300 to-gray-400"
                  }`}>
                    <Calendar className="h-5 w-5 text-white" strokeWidth={2.5} />
                  </div>
                  <span>Term {term}</span>
                  {term === currentTerm && (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-300 shadow-sm">Current</Badge>
                  )}
                  <Badge variant="outline" className="bg-gray-100 shadow-sm">
                    {learningAreas.length} Learning Areas
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="grid gap-5">
                  {learningAreas.map((subject) => {
                    const totalAreaStrands = subject.strands.length
                    const totalAreaSubStrands = subject.strands.reduce((acc, s) => acc + s.subStrands.length, 0)

                    return (
                      <Card key={subject.name} className="overflow-hidden border-0 shadow-2xl group">
                        <div className="flex">
                          <div className={`w-4 sm:w-5 bg-gradient-to-b ${getSubjectGradient(subject.name)} flex-shrink-0 rounded-l-lg shadow-inner`}>
                            <div className="h-full bg-gradient-to-r from-black/20 to-transparent" />
                          </div>

                          <div className="flex-1">
                            <div className={`relative h-40 sm:h-48 bg-gradient-to-br ${getSubjectGradient(subject.name)} overflow-hidden`}>
                              <div className="absolute top-2 bottom-2 right-0 w-2 bg-gradient-to-l from-gray-200 via-white to-gray-100 z-30 rounded-r-sm shadow-inner" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 z-20" />

                              <div className="absolute top-4 right-6 z-30 flex flex-col items-end gap-1">
                                <Badge className="bg-white/25 text-white border-white/40 backdrop-blur-md shadow-lg px-3 py-1 font-bold text-xs tracking-wider">
                                  CBC CURRICULUM
                                </Badge>
                              </div>

                              <div className="absolute bottom-0 left-0 right-4 z-30 p-5">
                                <div className="flex items-end gap-4">
                                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30 flex-shrink-0">
                                    <BookOpen className="h-7 w-7 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg leading-tight tracking-tight">{subject.name}</h3>
                                    <div className="flex items-center gap-2 mt-1.5">
                                      <span className="text-white/80 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                                        {totalAreaStrands} Strands
                                      </span>
                                      <span className="text-white/60 text-xs">•</span>
                                      <span className="text-white/80 text-xs font-semibold bg-white/10 px-2 py-0.5 rounded-full">
                                        {totalAreaSubStrands} Sub-strands
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <CardHeader className="pb-3 pt-4 bg-gradient-to-b from-amber-50/50 to-background border-t-2 border-amber-200/30">
                              <CardDescription className="text-slate-700 font-semibold flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-blue-600" strokeWidth={2.5} />
                                Explore strands and sub-strands below
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4 bg-gradient-to-b from-background to-gray-50">
                              {subject.strands.map((strand) => (
                                <div key={strand.name} className="rounded-xl p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-sm">
                                  <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                      <Layers className="h-4 w-4 text-white" strokeWidth={2.5} />
                                    </div>
                                    <h4 className="font-bold text-sm flex-1 text-slate-900">{strand.name}</h4>
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 shadow-sm">
                                      {strand.subStrands.length} Sub-strands
                                    </Badge>
                                  </div>

                                  <div className="grid gap-2">
                                    {strand.subStrands.map((subStrand) => (
                                      <div
                                        key={subStrand.name}
                                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200"
                                      >
                                        <div className="flex items-center gap-3">
                                          <CheckCircle className="h-4 w-4 text-green-600" strokeWidth={2.5} />
                                          <span className="text-sm font-semibold text-slate-800">{subStrand.name}</span>
                                        </div>
                                        <Button
                                          size="sm"
                                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all"
                                          onClick={() => {
                                            sessionStorage.setItem("currentLessonContext", JSON.stringify({
                                              title: subStrand.name,
                                              subject: subject.name,
                                            }))
                                            router.push("/student/learn")
                                          }}
                                        >
                                          Start Learning
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </CardContent>
                          </div>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
