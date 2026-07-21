'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Image as ImageIcon, Download, Loader2, Sparkles, Database, BookOpen, GraduationCap } from 'lucide-react'
import { toast } from 'sonner'
import { safeApiRequest } from '@/lib/api-utils'
import ImagePicker from './image-picker'

export default function ImageGenerator() {
  const { data: session, status } = useSession()

  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('educational')
  const [provider, setProvider] = useState('auto')
  const [size, setSize] = useState('1024x1024')
  const [quality, setQuality] = useState('standard')
  const [subject, setSubject] = useState('')
  const [grade, setGrade] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imageMetadata, setImageMetadata] = useState<any>(null)
  const [fromBank, setFromBank] = useState(false)
  const [bankOpen, setBankOpen] = useState(false)

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
    setFromBank(false)

    try {
      const result = await safeApiRequest('/api/ai/generate-image', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          style,
          provider,
          size,
          quality,
          subject: subject || undefined,
          grade: grade || undefined,
          topic: prompt.substring(0, 100),
        }),
        errorMessage: 'Failed to generate image',
      })

      if (result.success && result.data) {
        const data = result.data
        if (data.success && data.imageUrl) {
          setGeneratedImage(data.imageUrl)
          setFromBank(data.fromBank || false)
          setImageMetadata({
            source: data.fromBank ? 'image-bank' : data.source,
            message: data.message,
            generatedAt: new Date().toISOString(),
            savedImage: data.saved_image,
            bankEntry: data.bankEntry,
          })

          if (data.fromBank) {
            toast.success('Found matching image in shared bank!')
          } else if (data.source === 'placeholder') {
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

  const handleBankSelect = (img: any) => {
    setGeneratedImage(img.url)
    setFromBank(true)
    setImageMetadata({
      source: 'image-bank',
      generatedAt: new Date().toISOString(),
      bankEntry: img,
      message: `Reused from bank (${img.usageCount} previous uses) — no AI call needed.`,
    })
    setBankOpen(false)
    toast.success('Image selected from shared bank!')
  }

  const quickPrompts = [
    'A colorful diagram showing the water cycle',
    'An educational illustration of the solar system',
    'A simple diagram of plant photosynthesis',
    'A visual representation of mathematical fractions',
    'An illustration of the human digestive system',
    'A diagram showing the layers of Earth',
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

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
                  <Label>Subject (optional)</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Mathematics"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      disabled={isGenerating}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Grade (optional)</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="e.g. Grade 6"
                      value={grade}
                      onChange={e => setGrade(e.target.value)}
                      disabled={isGenerating}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size & Cost</Label>
                  <Select value={size} onValueChange={setSize} disabled={isGenerating}>
                    <SelectTrigger id="size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512x512">Small (512×512)</SelectItem>
                      <SelectItem value="1024x1024">Square (1024×1024)</SelectItem>
                      <SelectItem value="1536x1024">Landscape (1536×1024)</SelectItem>
                      <SelectItem value="1024x1536">Portrait (1024×1536)</SelectItem>
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

              <div className="flex gap-3">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1"
                  size="lg"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                  ) : (
                    <><ImageIcon className="w-4 h-4 mr-2" /> Generate Image</>
                  )}
                </Button>
                <Button
                  onClick={() => setBankOpen(true)}
                  variant="outline"
                  size="lg"
                  className="px-4"
                  title="Browse shared image bank"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Bank
                </Button>
              </div>

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
                    <div className="text-sm text-gray-600 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {imageMetadata.source === 'image-bank' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-700">
                            <Database className="h-3 w-3" /> Image Bank — reused
                          </span>
                        )}
                        {imageMetadata.source === 'openai-dalle-3' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-700">
                            DALL-E 3
                          </span>
                        )}
                        {imageMetadata.source === 'stability-ai' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-100 text-green-700">
                            Stable Diffusion
                          </span>
                        )}
                        {imageMetadata.source === 'placeholder' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
                            Placeholder
                          </span>
                        )}
                      </div>
                      {imageMetadata.message && (
                        <p className="text-emerald-600 italic text-xs">{imageMetadata.message}</p>
                      )}
                      {imageMetadata.bankEntry && (
                        <div className="flex gap-4 text-xs text-slate-400">
                          <span>{imageMetadata.bankEntry.usageCount} total uses</span>
                          {imageMetadata.bankEntry.subject && <span>Subject: {imageMetadata.bankEntry.subject}</span>}
                          {imageMetadata.bankEntry.grade && <span>Grade: {imageMetadata.bankEntry.grade}</span>}
                        </div>
                      )}
                      <p className="text-xs text-slate-400">Generated: {new Date(imageMetadata.generatedAt).toLocaleString()}</p>
                    </div>
                  )}

                  <Button onClick={handleDownload} variant="outline" className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Image
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <ImagePicker
        open={bankOpen}
        onClose={() => setBankOpen(false)}
        onSelect={handleBankSelect}
        subject={subject || undefined}
        grade={grade || undefined}
      />
    </div>
  )
}
