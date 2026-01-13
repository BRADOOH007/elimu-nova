'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ImageGenerator from '@/components/ai/image-generator'
import StudentPresentations from '@/components/ai/student-presentations'
import DiagramGenerator from '@/components/ai/diagram-generator'
import ImageGallery from '@/components/ai/image-gallery'
import { Image, Presentation, Microscope, Images } from 'lucide-react'

export default function StudentAIToolsPage() {
  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Learning Tools</h1>
        <p className="text-gray-600 mt-2">
          Create diagrams, images and presentations for your projects, and manage your gallery
        </p>
      </div>

      <Tabs defaultValue="diagrams" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
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

        <TabsContent value="diagrams" className="mt-6">
          <DiagramGenerator />
        </TabsContent>

        <TabsContent value="images" className="mt-6">
          <ImageGenerator />
        </TabsContent>

        <TabsContent value="presentations" className="mt-6">
          <StudentPresentations />
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <ImageGallery />
        </TabsContent>
      </Tabs>
    </div>
  )
}
