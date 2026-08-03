'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Sparkles, Plus, Trash2, X, Search } from 'lucide-react'
import StockImagePicker from '@/components/ai/stock-image-picker'

interface Slide {
  id?: string
  title: string
  content: string[]
  imagePrompt?: string
  imageDescription?: string
  image?: string
  layout: 'title' | 'content' | 'image' | 'split'
  order?: number
}

interface SlideCardProps {
  slide: Slide
  slideIndex: number
  totalSlides: number
  isGenerating: boolean
  generateImagesEnabled: boolean
  onUpdateSlide: (index: number, field: keyof Slide, value: any) => void
  onRemoveSlide: (index: number) => void
  onAddContentPoint: (index: number) => void
  onUpdateContentPoint: (index: number, pointIndex: number, value: string) => void
  onRemoveContentPoint: (index: number, pointIndex: number) => void
  onGenerateImage: (index: number) => void
}

export function SlideCard({
  slide, slideIndex, totalSlides, isGenerating, generateImagesEnabled,
  onUpdateSlide, onRemoveSlide, onAddContentPoint,
  onUpdateContentPoint, onRemoveContentPoint, onGenerateImage,
}: SlideCardProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <Card className="bg-gradient-to-br from-gray-50 to-white border-0 shadow-md">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Slide {slideIndex + 1}</h4>
          {totalSlides > 1 && (
            <Button
              onClick={() => onRemoveSlide(slideIndex)}
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700"
              disabled={isGenerating}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <Label>Slide Title</Label>
          <Input
            value={slide.title}
            onChange={(e) => onUpdateSlide(slideIndex, 'title', e.target.value)}
            placeholder="Enter slide title"
            disabled={isGenerating}
          />
        </div>

        <div className="space-y-2">
          <Label>Layout</Label>
          <Select
            value={slide.layout}
            onValueChange={(value) => onUpdateSlide(slideIndex, 'layout', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title Slide</SelectItem>
              <SelectItem value="content">Content</SelectItem>
              <SelectItem value="image">Image Focus</SelectItem>
              <SelectItem value="split">Split (Text + Image)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Content Points</Label>
            <Button
              onClick={() => onAddContentPoint(slideIndex)}
              variant="ghost"
              size="sm"
              disabled={isGenerating}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Point
            </Button>
          </div>
          {slide.content.map((point, pointIndex) => (
            <div key={pointIndex} className="flex items-center space-x-2">
              <Input
                value={point}
                onChange={(e) => onUpdateContentPoint(slideIndex, pointIndex, e.target.value)}
                placeholder={`Content point ${pointIndex + 1}`}
                disabled={isGenerating}
              />
              {slide.content.length > 1 && (
                <Button
                  onClick={() => onRemoveContentPoint(slideIndex, pointIndex)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={isGenerating}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {generateImagesEnabled && (slide.layout === 'image' || slide.layout === 'split') && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Image Prompt</Label>
              <Textarea
                value={slide.imagePrompt || slide.imageDescription || ''}
                onChange={(e) => onUpdateSlide(slideIndex, 'imagePrompt', e.target.value)}
                placeholder="Describe the image you want to generate..."
                disabled={isGenerating}
                className="min-h-[80px]"
              />
              <div className="flex items-start space-x-2 text-xs text-gray-500">
                <Sparkles className="w-3 h-3 mt-0.5 text-purple-500" />
                <div>
                  <p className="font-medium">AI Image Generation Tips:</p>
                  <ul className="list-disc list-inside space-y-1 mt-1">
                    <li>Be specific about colors, objects, and style</li>
                    <li>Include educational context (e.g., &ldquo;for grade 5 students&rdquo;)</li>
                    <li>Mention if you want diagrams, illustrations, or photos</li>
                    <li>Leave empty to auto-generate from slide title</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Generated Image</Label>
                <Button
                  onClick={() => onGenerateImage(slideIndex)}
                  size="sm"
                  variant="outline"
                  disabled={isGenerating || !slide.imagePrompt?.trim() && !slide.imageDescription?.trim()}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Generate Image
                </Button>
              </div>

              {slide.image ? (
                <div className="relative">
                  <img
                    src={slide.image}
                    alt={`Generated image for ${slide.title}`}
                    className="w-full max-w-md h-48 object-cover rounded-lg border shadow-sm"
                  />
                  <Button
                    onClick={() => onUpdateSlide(slideIndex, 'image', '')}
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="w-full max-w-md border-2 border-dashed border-gray-300 rounded-lg">
                  <div className="h-32 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No image generated yet</p>
                      <p className="text-xs">Click &ldquo;Generate Image&rdquo; to create one</p>
                    </div>
                  </div>
                  {(slide.imagePrompt || slide.imageDescription) && (
                    <div className="px-3 pb-3">
                      <Button
                        onClick={() => setPickerOpen(true)}
                        size="sm"
                        variant="outline"
                        className="w-full text-rose-600 border-rose-200 hover:bg-rose-50"
                      >
                        <Search className="w-3 h-3 mr-1" />
                        Search Real Images
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>

      <StockImagePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        initialQuery={slide.imagePrompt || slide.imageDescription || ''}
        onSelect={(url) => {
          onUpdateSlide(slideIndex, 'image', url)
          setPickerOpen(false)
        }}
      />
    </Card>
  )
}
