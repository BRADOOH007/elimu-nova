'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Download, Image as ImageIcon, Sparkles, BookOpen, Microscope, Globe, Atom, Calculator } from 'lucide-react'
import EducationalDiagramService from '@/lib/educational-diagram-service'
import CanvasUtils from '@/lib/canvas-utils'
import { safeApiRequest } from '@/lib/api-utils'

interface DiagramGeneratorProps {
  onDiagramGenerated?: (diagram: any) => void
}

export default function DiagramGenerator({ onDiagramGenerated }: DiagramGeneratorProps) {
  const [loading, setLoading] = useState(false)
  const [generatedDiagram, setGeneratedDiagram] = useState<any>(null)
  const [formData, setFormData] = useState({
    topic: '',
    grade: '',
    curriculum: 'CBC',
    type: 'biology',
    size: '1024x1024', // Default to standard size
    quality: 'standard'
  })
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleGenerate = async () => {
    if (!formData.topic || !formData.grade) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in topic and grade level",
      })
      return
    }

    setLoading(true)
    try {
      const result = await safeApiRequest('/api/ai/diagram', {
        method: 'POST',
        body: JSON.stringify(formData),
        errorMessage: 'Failed to generate diagram'
      })

      if (result.success && result.data) {
        setGeneratedDiagram(result.data)
        onDiagramGenerated?.(result.data)
        toast({
          title: "Success",
          description: "Educational diagram generated successfully!",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to generate diagram",
        })
      }
    } catch (error) {
      console.error('Error generating diagram:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate diagram",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedDiagram) return

    try {
      // Use the canvas utilities to create the labeled diagram
      const labeledImageDataUrl = await CanvasUtils.createLabeledDiagram(
        generatedDiagram.image_url,
        generatedDiagram.labels,
        generatedDiagram.metadata.dimensions.width,
        generatedDiagram.metadata.dimensions.height
      )

      // Convert data URL to blob and download
      const link = document.createElement('a')
      link.href = labeledImageDataUrl
      link.download = `${formData.topic.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_diagram.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Professional diagram downloaded successfully!",
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download diagram. Please try again.",
      })
    }
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      biology: Microscope,
      chemistry: Atom,
      physics: Atom,
      geography: Globe,
      mathematics: Calculator,
      general: BookOpen
    }
    return icons[type as keyof typeof icons] || BookOpen
  }

  const getTypeColor = (type: string) => {
    const colors = {
      biology: 'bg-green-100 text-green-800',
      chemistry: 'bg-blue-100 text-blue-800',
      physics: 'bg-purple-100 text-purple-800',
      geography: 'bg-orange-100 text-orange-800',
      mathematics: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || colors.general
  }

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card className="bg-gradient-to-br from-white via-blue-50 to-purple-50 border-0">
        <CardHeader>
          <CardTitle className="edugenius-text-gradient-blue flex items-center">
            <Sparkles className="w-5 h-5 mr-2" />
            Professional Diagram Generator
          </CardTitle>
          <CardDescription>
            Generate textbook-quality educational diagrams with perfect labels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={formData.topic}
                onChange={(e) => handleInputChange('topic', e.target.value)}
                placeholder="e.g., Human Heart, Solar System, Water Cycle"
                className="edugenius-glass"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Grade Level *</Label>
              <Input
                id="grade"
                value={formData.grade}
                onChange={(e) => handleInputChange('grade', e.target.value)}
                placeholder="e.g., Grade 6, Form 2, Year 8"
                className="edugenius-glass"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="curriculum">Curriculum</Label>
              <Select value={formData.curriculum} onValueChange={(value) => handleInputChange('curriculum', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CBC">🇰🇪 CBC (Kenya)</SelectItem>
                  <SelectItem value="IGCSE">🌍 IGCSE (International)</SelectItem>
                  <SelectItem value="KCSE">🎓 KCSE (Kenya)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Subject Type</Label>
              <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="biology">🔬 Biology</SelectItem>
                  <SelectItem value="chemistry">⚗️ Chemistry</SelectItem>
                  <SelectItem value="physics">⚡ Physics</SelectItem>
                  <SelectItem value="geography">🌍 Geography</SelectItem>
                  <SelectItem value="mathematics">🔢 Mathematics</SelectItem>
                  <SelectItem value="general">📚 General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Image Size & Cost</Label>
              <Select value={formData.size} onValueChange={(value) => handleInputChange('size', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">
                    <div className="flex items-center justify-between w-full">
                      <span>💰 Small (512×512)</span>
                      <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Economy</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="1024x1024">
                    <div className="flex items-center justify-between w-full">
                      <span>📄 Medium (1024×1024)</span>
                      <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">Standard</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="1536x1024">
                    <div className="flex items-center justify-between w-full">
                      <span>🖼️ Large (1536×1024)</span>
                      <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">Premium</Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="1024x1536">
                    <div className="flex items-center justify-between w-full">
                      <span>📋 Poster (1024×1536)</span>
                      <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">Portrait</Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={formData.quality} onValueChange={(value) => handleInputChange('quality', value)}>
                <SelectTrigger className="edugenius-glass">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Quality</SelectItem>
                  <SelectItem value="hd">HD Quality (+cost)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Cost-Effective Sizing Guide:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-blue-700">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <span><strong>Small (512×512):</strong> Previews, quick checks</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <span><strong>Medium (1024×1024):</strong> Worksheets, assignments</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                <span><strong>Large (1536×1024):</strong> Posters, displays</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                <span><strong>Portrait (1024×1536):</strong> Vertical posters</span>
              </div>
            </div>
            <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-800">
              💡 <strong>Tip:</strong> Use Small for previews (4x cheaper), Medium for worksheets, Large only for final posters
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !formData.topic || !formData.grade}
            className="w-full edugenius-button"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Professional Diagram...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Diagram
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Diagram Display */}
      {generatedDiagram && (
        <Card className="bg-gradient-to-br from-white via-green-50 to-blue-50 border-0">
          <CardHeader>
            <CardTitle className="edugenius-text-gradient-blue flex items-center justify-between">
              <div className="flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                Generated Diagram
              </div>
              <div className="flex items-center space-x-2">
                <Badge className={getTypeColor(formData.type)}>
                  {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                </Badge>
                <Badge variant="outline">
                  {formData.curriculum}
                </Badge>
              </div>
            </CardTitle>
            <CardDescription>
              Professional educational diagram with accurate labels
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Image Display */}
            <div className="relative bg-white rounded-lg border-2 border-gray-200 p-4 overflow-hidden">
              <div className="max-w-full max-h-96 mx-auto flex items-center justify-center">
                <img
                  src={generatedDiagram.image_url}
                  alt={`Educational diagram: ${formData.topic}`}
                  className="max-w-full max-h-full w-auto h-auto rounded-lg shadow-lg object-contain"
                  style={{ maxHeight: '384px', maxWidth: '100%' }}
                />
              </div>
              
              {/* Labels overlay preview */}
              <div className="absolute inset-4 pointer-events-none">
                {generatedDiagram.labels.slice(0, 6).map((label: string, index: number) => {
                  const isLeft = index < Math.ceil(generatedDiagram.labels.length / 2)
                  return (
                    <div
                      key={index}
                      className={`absolute bg-white/95 border-2 border-gray-800 rounded-lg px-2 py-1 text-xs font-bold shadow-lg ${
                        isLeft ? 'left-2' : 'right-2'
                      }`}
                      style={{
                        top: `${20 + (index % 3) * 40}px`,
                        maxWidth: '120px',
                        fontSize: '10px'
                      }}
                    >
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Labels List */}
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Generated Labels:</h4>
              <div className="flex flex-wrap gap-2">
                {generatedDiagram.labels.map((label: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm">
                    {index + 1}. {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Topic</p>
                <p className="font-medium">{generatedDiagram.metadata.topic}</p>
              </div>
              <div>
                <p className="text-gray-500">Grade</p>
                <p className="font-medium">{generatedDiagram.metadata.grade}</p>
              </div>
              <div>
                <p className="text-gray-500">Curriculum</p>
                <p className="font-medium">{generatedDiagram.metadata.curriculum}</p>
              </div>
              <div>
                <p className="text-gray-500">Size & Cost</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{generatedDiagram.metadata.size}</p>
                  <Badge 
                    variant="secondary" 
                    className={
                      generatedDiagram.metadata.cost_tier === 'economy' ? 'bg-green-100 text-green-800' :
                      generatedDiagram.metadata.cost_tier === 'standard' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }
                  >
                    {generatedDiagram.metadata.cost_tier}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleDownload}
                className="edugenius-button"
              >
                <Download className="w-4 h-4 mr-2" />
                Download High-Quality PNG
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}