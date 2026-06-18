'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageGenerator from '@/components/ai/image-generator'
import PresentationGenerator from '@/components/ai/presentation-generator'
import DiagramGenerator from '@/components/ai/diagram-generator'
import ImageGallery from '@/components/ai/image-gallery'
import { AIExamGenerator } from '@/components/ai/exam-generator'
import { AICareerConsultant } from '@/components/ai/career-consultant'
import { Image, Presentation, Microscope, Images, BookOpen, Sparkles } from 'lucide-react'

export default function AIToolsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Content Tools</h1>
        <p className="text-gray-600 mt-2">
          Generate exams, images, presentations, get career guidance, and manage your gallery
        </p>
      </div>

      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full max-w-4xl grid-cols-6">
          <TabsTrigger value="exams" className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4" />
            <span>Exams</span>
          </TabsTrigger>
          <TabsTrigger value="careers" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Career</span>
          </TabsTrigger>
          <TabsTrigger value="diagrams" className="flex items-center space-x-2">
            <Microscope className="w-4 h-4" />
            <span>Diagrams</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center space-x-2">
            <Image className="w-4 h-4" />
            <span>Images</span>
          </TabsTrigger>
          <TabsTrigger value="presentations" className="flex items-center space-x-2">
            <Presentation className="w-4 h-4" />
            <span>Presentations</span>
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center space-x-2">
            <Images className="w-4 h-4" />
            <span>Gallery</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="exams" className="mt-6">
          <AIExamGenerator />
        </TabsContent>
        
        <TabsContent value="careers" className="mt-6">
          <AICareerConsultant />
        </TabsContent>
        
        <TabsContent value="diagrams" className="mt-6">
          <DiagramGenerator />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImageGenerator />
        </TabsContent>

        <TabsContent value="presentations" className="mt-6">
          <PresentationGenerator />
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <ImageGallery />
        </TabsContent>
      </Tabs>
    </div>
  )
}
