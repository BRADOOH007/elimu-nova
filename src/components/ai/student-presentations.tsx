'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Presentation, Download, Loader2, Calendar, User, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface SharedPresentation {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  slideCount: number
  duration: number
  teacherName: string
  sharedAt: string
  createdAt: string
}

export default function StudentPresentations() {
  const [sharedPresentations, setSharedPresentations] = useState<SharedPresentation[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    loadSharedPresentations()
  }, [])

  const loadSharedPresentations = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/student/shared-presentations')
      if (response.ok) {
        const data = await response.json()
        setSharedPresentations(data.presentations || [])
      } else {
        console.error('Failed to load shared presentations')
      }
    } catch (error) {
      console.error('Error loading shared presentations:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadPresentation = async (presentationId: string, title: string) => {
    try {
      setDownloading(presentationId)
      const response = await fetch(`/api/presentations/${presentationId}/download`)
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${title.replace(/[^a-z0-9]/gi, '_')}.pptx`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        toast.success('Presentation downloaded successfully!')
      } else {
        toast.error('Failed to download presentation')
      }
    } catch (error) {
      console.error('Error downloading presentation:', error)
      toast.error('Failed to download presentation')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Presentation className="w-5 h-5 text-blue-600" />
            <span>Shared Presentations</span>
          </CardTitle>
          <CardDescription>
            Presentations shared with you by your teachers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading presentations...</span>
            </div>
          ) : sharedPresentations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Presentation className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No presentations shared yet</h3>
              <p className="text-sm">Your teachers haven't shared any presentations with you yet.</p>
              <p className="text-sm">Check back later or ask your teacher to share some presentations!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sharedPresentations.map((presentation) => (
                <Card key={presentation.id} className="bg-gradient-to-br from-white to-blue-50 border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg mb-2">{presentation.title}</h4>
                        <div className="space-y-1">
                          <p className="text-sm text-blue-600 font-medium">
                            {presentation.subject} • {presentation.grade}
                          </p>
                          <p className="text-sm text-gray-600">{presentation.topic}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{presentation.slideCount} slides</span>
                        <span>{presentation.duration} min</span>
                      </div>

                      {/* Teacher info */}
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>By {presentation.teacherName}</span>
                      </div>

                      {/* Shared date */}
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>Shared {new Date(presentation.sharedAt).toLocaleDateString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex space-x-2 pt-2">
                        <Button
                          onClick={() => downloadPresentation(presentation.id, presentation.title)}
                          disabled={downloading === presentation.id}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {downloading === presentation.id ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Downloading...
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}