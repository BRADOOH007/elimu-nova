'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image as ImageIcon, Download, Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { safeApiRequest } from '@/lib/api-utils'

export default function ImageGenerator() {
  const { data: session, status } = useSession()
  
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('educational')
  const [provider, setProvider] = useState('auto')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('standard')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageMetadata, setImageMetadata] = useState<any>(null)

  const handleGenerate = async () => {
    if (!session) {
      toast.error('Please log in to generate images')
      return
    }
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    setGeneratedImage(null)

    try {
      const result = await safeApiRequest('/api/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style,
          provider,
          size,
          quality
        }),
        errorMessage: 'Failed to generate image'
      })

      if (result.success && result.data) {
        const data = result.data
        if (data.success && data.imageUrl) {
          setGeneratedImage(data.imageUrl)
          setImageMetadata({
            source: data.source,
            message: data.message,
            generatedAt: new Date().toISOString(),
            savedImage: data.saved_image
          })
          
          if (data.source === 'placeholder') {
            toast.success(`Image generated! ${data.message}`)
          } else {
            toast.success('AI image generated successfully!')
          }
        } else {
          throw new Error(data.message || 'No image URL in response')
        }
      } else {
        throw new Error(result.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.href = generatedImage
    link.download = `edugenius-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Image downloaded!')
  }

  const quickPrompts = [
    'A colorful diagram showing the water cycle',
    'An educational illustration of the solar system',
    'A simple diagram of plant photosynthesis',
    'A visual representation of mathematical fractions',
    'An illustration of the human digestive system',
    'A diagram showing the layers of Earth'
  ]

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <span>AI Image Generator</span>
          </CardTitle>
          <CardDescription>
            Generate educational images and diagrams using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Authentication Check */}
          {status === 'loading' && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading...</span>
            </div>
          )}
          
          {status === 'unauthenticated' && (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">Please log in to generate images</p>
              <Button onClick={() => window.location.href = '/auth/signin'}>
                Sign In
              </Button>
            </div>
          )}
          
          {status === 'authenticated' && session && (
            <>
              {/* Prompt Input */}
              <div className="space-y-2">
                <Label htmlFor="prompt">Image Description</Label>
                <Input
                  id="prompt"
                  placeholder="Describe the image you want to generate..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
                />
              </div>

          {/* Quick Prompts */}
          <div className="space-y-2">
            <Label>Quick Prompts</Label>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((quickPrompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt(quickPrompt)}
                  disabled={isGenerating}
                >
                  {quickPrompt}
                </Button>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                <SelectTrigger id="style">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="diagram">Diagram</SelectItem>
                  <SelectItem value="natural">Natural</SelectItem>
                  <SelectItem value="vivid">Vivid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="provider">AI Provider</Label>
              <Select value={provider} onValueChange={setProvider} disabled={isGenerating}>
                <SelectTrigger id="provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Best Available)</SelectItem>
                  <SelectItem value="dalle">DALL-E 3</SelectItem>
                  <SelectItem value="stability">Stable Diffusion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size & Cost</Label>
              <Select value={size} onValueChange={setSize} disabled={isGenerating}>
                <SelectTrigger id="size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="512x512">
                    <div className="flex items-center justify-between w-full">
                      <span>💰 Small (512×512)</span>
                      <span className="text-xs text-green-600 ml-2">Economy</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="1024x1024">
                    <div className="flex items-center justify-between w-full">
                      <span>📄 Square (1024×1024)</span>
                      <span className="text-xs text-blue-600 ml-2">Standard</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="1536x1024">
                    <div className="flex items-center justify-between w-full">
                      <span>🖼️ Landscape (1536×1024)</span>
                      <span className="text-xs text-orange-600 ml-2">Premium</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="1024x1536">
                    <div className="flex items-center justify-between w-full">
                      <span>📋 Portrait (1024×1536)</span>
                      <span className="text-xs text-purple-600 ml-2">Premium</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <Select value={quality} onValueChange={setQuality} disabled={isGenerating}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="hd">HD (Higher Cost)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Image
              </>
            )}
          </Button>

          {/* Generated Image */}
          {generatedImage && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden shadow-lg bg-white p-4">
                <div className="max-w-full max-h-96 mx-auto flex items-center justify-center">
                  <img
                    src={generatedImage}
                    alt="Generated"
                    className="max-w-full max-h-full w-auto h-auto rounded-lg object-contain"
                    style={{ maxHeight: '384px', maxWidth: '100%' }}
                  />
                </div>
              </div>

              {imageMetadata && (
                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center gap-2">
                    {imageMetadata.source === 'stability-ai' && (
                      <>
                        <span className="text-green-600">🎨</span>
                        <span>AI Generated (Stability AI)</span>
                      </>
                    )}
                    {imageMetadata.source === 'openai-dalle' && (
                      <>
                        <span className="text-blue-600">🤖</span>
                        <span>AI Generated (DALL-E)</span>
                      </>
                    )}
                    {imageMetadata.source === 'placeholder' && (
                      <>
                        <span className="text-yellow-600">📋</span>
                        <span>Placeholder Image</span>
                      </>
                    )}
                  </div>
                  <p>Generated: {new Date(imageMetadata.generatedAt).toLocaleString()}</p>
                  {imageMetadata.message && (
                    <p className="text-yellow-600 italic">{imageMetadata.message}</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
