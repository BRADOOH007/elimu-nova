'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Search, 
  Filter,
  Calendar,
  FileImage,
  Eye,
  MoreHorizontal,
  Presentation,
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { safeApiRequest } from '@/lib/api-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface AIImage {
  id: string
  filename: string
  storedUrl: string
  topic: string
  prompt: string
  type: string
  size: string
  quality: string
  fileSize: number
  dimensions: { width: number; height: number }
  createdAt: string
  user: {
    firstName: string
    lastName: string
    email: string
  }
  student?: {
    id: string
    user: { firstName: string; lastName: string }
  }
  teacher?: {
    id: string
    user: { firstName: string; lastName: string }
  }
  school?: {
    id: string
    name: string
  }
  class?: {
    id: string
    name: string
    subject: string
  }
}

interface ImageStats {
  totalImages: number
  totalSize: number
  typeBreakdown: Record<string, number>
  recentImages: number
}

export default function ImageGallery() {
  const [images, setImages] = useState<AIImage[]>([])
  const [stats, setStats] = useState<ImageStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTopic, setSearchTopic] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedImage, setSelectedImage] = useState<AIImage | null>(null)
  const [showImageModal, setShowImageModal] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadImages()
    loadStats()
  }, [searchTopic, filterType])

  const loadImages = async () => {
    setLoading(true)
    console.log('🔍 Loading images...')
    try {
      const params = new URLSearchParams()
      if (searchTopic) params.append('topic', searchTopic)
      if (filterType && filterType !== 'all') params.append('type', filterType)
      params.append('limit', '50')

      console.log('📡 Making API request to:', `/api/ai/images?${params}`)
      const result = await safeApiRequest(`/api/ai/images?${params}`)
      console.log('📥 API result:', result)
      
      if (result.success && result.data) {
        console.log('✅ Images loaded:', result.data.images?.length || 0)
        setImages(result.data.images)
      } else {
        console.error('❌ API request failed:', result.error)
        toast({
          variant: "destructive",
          title: "Error",
          description: result.error || "Failed to load images",
        })
      }
    } catch (error) {
      console.error('❌ Load images error:', error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load images",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    console.log('📊 Loading stats...')
    try {
      const result = await safeApiRequest('/api/ai/images/stats')
      console.log('📊 Stats result:', result)
      
      if (result.success && result.data) {
        console.log('✅ Stats loaded:', result.data)
        setStats(result.data)
      } else {
        console.error('❌ Stats request failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Load stats error:', error)
    }
  }

  const handleDelete = async (imageId: string) => {
    try {
      const result = await safeApiRequest(`/api/ai/images?id=${imageId}`, {
        method: 'DELETE'
      })

      if (result.success) {
        setImages(images.filter(img => img.id !== imageId))
        toast({
          title: "Success",
          description: "Image deleted successfully",
        })
        loadStats() // Refresh stats
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete image",
      })
    }
  }

  const handleDownload = async (image: AIImage) => {
    try {
      // Track usage
      await safeApiRequest(`/api/ai/images/${image.id}/use`, {
        method: 'POST',
        body: JSON.stringify({
          usageType: 'download',
          context: 'gallery_download'
        })
      })

      // Download the image
      const link = document.createElement('a')
      link.href = image.storedUrl
      link.download = image.filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "Image downloaded successfully",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to download image",
      })
    }
  }

  const handleView = async (image: AIImage) => {
    // Track usage
    await safeApiRequest(`/api/ai/images/${image.id}/use`, {
      method: 'POST',
      body: JSON.stringify({
        usageType: 'view',
        context: 'gallery_view'
      })
    })

    setSelectedImage(image)
    setShowImageModal(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getTypeIcon = (type: string) => {
    const icons = {
      DIAGRAM: Presentation,
      POSTER: FileImage,
      ILLUSTRATION: ImageIcon,
      CHART: FileText,
      INFOGRAPHIC: FileImage,
      GENERAL: ImageIcon
    }
    return icons[type as keyof typeof icons] || ImageIcon
  }

  const getTypeColor = (type: string) => {
    const colors = {
      DIAGRAM: 'bg-blue-100 text-blue-800',
      POSTER: 'bg-green-100 text-green-800',
      ILLUSTRATION: 'bg-purple-100 text-purple-800',
      CHART: 'bg-orange-100 text-orange-800',
      INFOGRAPHIC: 'bg-pink-100 text-pink-800',
      GENERAL: 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || colors.GENERAL
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ImageIcon className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Images</p>
                <p className="text-2xl font-bold">{stats?.totalImages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileImage className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Storage Used</p>
                <p className="text-2xl font-bold">{formatFileSize(stats?.totalSize || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{stats?.recentImages || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Presentation className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Diagrams</p>
                <p className="text-2xl font-bold">{stats?.typeBreakdown?.DIAGRAM || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            My Generated Images
          </CardTitle>
          <CardDescription>
            Browse, search, and manage your AI-generated images
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Search by topic</Label>
              <Input
                id="search"
                placeholder="Search images by topic..."
                value={searchTopic}
                onChange={(e) => setSearchTopic(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="filter">Filter by type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="DIAGRAM">Diagrams</SelectItem>
                  <SelectItem value="POSTER">Posters</SelectItem>
                  <SelectItem value="ILLUSTRATION">Illustrations</SelectItem>
                  <SelectItem value="CHART">Charts</SelectItem>
                  <SelectItem value="INFOGRAPHIC">Infographics</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 aspect-square rounded-lg mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-1"></div>
                  <div className="bg-gray-200 h-3 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : images.length === 0 ? (
            <div className="text-center py-12">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-600">
                {searchTopic || (filterType && filterType !== 'all') 
                  ? "Try adjusting your search or filter criteria"
                  : "Start generating images to see them here"
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image) => {
                const TypeIcon = getTypeIcon(image.type)
                return (
                  <Card key={image.id} className="group hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img
                        src={image.storedUrl}
                        alt={image.topic}
                        className="w-full aspect-square object-cover rounded-t-lg cursor-pointer"
                        onClick={() => handleView(image)}
                      />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(image)}>
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDownload(image)}>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(image.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="absolute top-2 left-2">
                        <Badge className={getTypeColor(image.type)}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {image.type}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm mb-1 line-clamp-2">{image.topic}</h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(image.createdAt).toLocaleDateString()}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{image.dimensions.width}×{image.dimensions.height}</span>
                        <span>{formatFileSize(image.fileSize)}</span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Detail Modal */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.topic}</DialogTitle>
            <DialogDescription>
              Generated on {selectedImage && new Date(selectedImage.createdAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="flex justify-center">
                <img
                  src={selectedImage.storedUrl}
                  alt={selectedImage.topic}
                  className="max-w-full max-h-96 object-contain rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium">{selectedImage.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Size</p>
                  <p className="font-medium">{selectedImage.size}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quality</p>
                  <p className="font-medium">{selectedImage.quality}</p>
                </div>
                <div>
                  <p className="text-gray-600">File Size</p>
                  <p className="font-medium">{formatFileSize(selectedImage.fileSize)}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm">Original Prompt</p>
                <p className="text-sm bg-gray-50 p-2 rounded">{selectedImage.prompt}</p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => handleDownload(selectedImage)}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    handleDelete(selectedImage.id)
                    setShowImageModal(false)
                  }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}