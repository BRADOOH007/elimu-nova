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
    <div className="h-[calc(100dvh-112px)] max-w-7xl mx-auto flex flex-col overflow-hidden">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">AI Tools</h1>
        <p className="text-gray-600 mt-1">All AI-powered teaching tools in one place</p>
      </div>

      <Tabs defaultValue="hope" className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
        <TabsList className="flex flex-wrap gap-1 h-auto mb-6 bg-gray-100 p-1 rounded-xl flex-shrink-0">
          <TabsTrigger value="hope">
            <Brain className="w-4 h-4 mr-2" />Hope AI
          </TabsTrigger>
          <TabsTrigger value="powerpoint">
            <MonitorPlay className="w-4 h-4 mr-2" />PowerPoint
          </TabsTrigger>
          <TabsTrigger value="exams">
            <BookOpen className="w-4 h-4 mr-2" />Exams
          </TabsTrigger>
          <TabsTrigger value="blooms">
            <GraduationCap className="w-4 h-4 mr-2" />Bloom's Quiz
          </TabsTrigger>
          <TabsTrigger value="diagrams">
            <Microscope className="w-4 h-4 mr-2" />Diagrams
          </TabsTrigger>
          <TabsTrigger value="images">
            <Image className="w-4 h-4 mr-2" />Images
          </TabsTrigger>
          <TabsTrigger value="gallery">
            <Images className="w-4 h-4 mr-2" />Gallery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hope" className="flex-1 flex flex-col overflow-hidden min-h-0"><HopeAITab /></TabsContent>
        <TabsContent value="powerpoint" className="flex-1 flex flex-col overflow-hidden min-h-0"><PowerPtTab /></TabsContent>
        <TabsContent value="exams" className="flex-1 flex flex-col overflow-hidden min-h-0"><AIExamGenerator /></TabsContent>
        <TabsContent value="blooms" className="flex-1 flex flex-col overflow-hidden min-h-0"><BloomsTab /></TabsContent>
        <TabsContent value="diagrams" className="flex-1 flex flex-col overflow-hidden min-h-0"><DiagramGenerator /></TabsContent>
        <TabsContent value="images" className="flex-1 flex flex-col overflow-hidden min-h-0"><ImageGenerator /></TabsContent>
        <TabsContent value="gallery" className="flex-1 flex flex-col overflow-hidden min-h-0"><ImageGallery /></TabsContent>
      </Tabs>
    </div>
  )
}
