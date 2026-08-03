'use client'

import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageGenerator from '@/components/ai/image-generator'
import DiagramGenerator from '@/components/ai/diagram-generator'
import ImageGallery from '@/components/ai/image-gallery'
import { AIExamGenerator } from '@/components/ai/exam-generator'
import { Image, Microscope, Images, BookOpen, Brain, Loader2, MonitorPlay, GraduationCap } from 'lucide-react'

const HopeAITab    = dynamic(() => import('@/app/teacher/hope-ai/page'),           { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const PowerPtTab   = dynamic(() => import('@/app/teacher/powerpoint/page'),      { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })
const BloomsTab    = dynamic(() => import('@/components/ai/blooms-quiz-generator'), { ssr: false, loading: () => <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-blue-500" /></div> })

export default function AIToolsPage() {
  return (
    <div className="h-full max-w-7xl mx-auto flex flex-col overflow-hidden">
      <Tabs defaultValue="hope" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
        <div className="flex-shrink-0 bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2 py-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900">AI Tools</h1>
            </div>
          </div>
          <TabsList className="w-full justify-start gap-2 h-12 bg-slate-100/80 p-1.5 rounded-xl border-0 mx-1">
            <TabsTrigger value="hope" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <Brain className="w-4 h-4 mr-2" />Hope AI
            </TabsTrigger>
            <TabsTrigger value="powerpoint" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <MonitorPlay className="w-4 h-4 mr-2" />PowerPoint
            </TabsTrigger>
            <TabsTrigger value="exams" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <BookOpen className="w-4 h-4 mr-2" />Exams
            </TabsTrigger>
            <TabsTrigger value="blooms" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <GraduationCap className="w-4 h-4 mr-2" />Bloom's
            </TabsTrigger>
            <TabsTrigger value="diagrams" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <Microscope className="w-4 h-4 mr-2" />Diagrams
            </TabsTrigger>
            <TabsTrigger value="images" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <Image className="w-4 h-4 mr-2" />Images
            </TabsTrigger>
            <TabsTrigger value="gallery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-700 rounded-lg px-5 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-white/60 transition-all">
              <Images className="w-4 h-4 mr-2" />Gallery
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="hope" className="flex-1 flex flex-col overflow-hidden min-h-0 mt-0 pt-4"><HopeAITab /></TabsContent>
        <TabsContent value="powerpoint" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><PowerPtTab /></TabsContent>
        <TabsContent value="exams" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><AIExamGenerator /></TabsContent>
        <TabsContent value="blooms" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><BloomsTab /></TabsContent>
        <TabsContent value="diagrams" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><DiagramGenerator /></TabsContent>
        <TabsContent value="images" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><ImageGenerator /></TabsContent>
        <TabsContent value="gallery" className="flex-1 flex flex-col overflow-y-auto min-h-0 mt-0 pt-4"><ImageGallery /></TabsContent>
      </Tabs>
    </div>
  )
}