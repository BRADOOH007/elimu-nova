'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Presentation, Calendar, Edit, Share2, Download, Trash2 } from 'lucide-react'

interface SavedPresentation {
  id: string
  title: string
  subject: string
  grade: string
  topic: string
  slideCount: number
  duration: number
  difficulty: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

interface SavedPresentationsListProps {
  savedPresentations: SavedPresentation[]
  loadingPresentations: boolean
  isGenerating: boolean
  onEdit: (id: string) => void
  onShare: (presentation: SavedPresentation) => void
  onDownload: (id: string, title: string) => void
  onDelete: (id: string) => void
}

export function SavedPresentationsList({
  savedPresentations, loadingPresentations, isGenerating,
  onEdit, onShare, onDownload, onDelete,
}: SavedPresentationsListProps) {
  return (
    <CardContent className="border-t bg-gray-50">
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Saved Presentations</h3>

        {loadingPresentations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading presentations...</span>
          </div>
        ) : savedPresentations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Presentation className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No presentations saved yet</p>
            <p className="text-sm">Create your first AI presentation to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPresentations.map((presentation) => (
              <Card key={presentation.id} className="bg-white border shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 truncate">{presentation.title}</h4>
                      <p className="text-sm text-gray-600">{presentation.subject} &bull; {presentation.grade}</p>
                      <p className="text-xs text-gray-500">{presentation.slideCount} slides &bull; {presentation.duration} min</p>
                    </div>

                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>Updated {new Date(presentation.updatedAt).toLocaleDateString()}</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => onEdit(presentation.id)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isGenerating}
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={() => onShare(presentation)}
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:text-blue-700"
                        disabled={isGenerating}
                      >
                        <Share2 className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => onDownload(presentation.id, presentation.title)}
                        size="sm"
                        variant="outline"
                        disabled={isGenerating}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        onClick={() => onDelete(presentation.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={isGenerating}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CardContent>
  )
}
