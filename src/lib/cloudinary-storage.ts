import { v2 as cloudinary } from 'cloudinary'
import { prisma } from '@/lib/prisma'
import { uploadFile as supabaseUpload, BUCKETS } from '@/lib/supabase'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface SaveImageRequest {
  imageUrl: string
  topic: string
  prompt: string
  type: 'DIAGRAM' | 'POSTER' | 'ILLUSTRATION' | 'CHART' | 'INFOGRAPHIC' | 'GENERAL'
  size: 'SMALL_512' | 'MEDIUM_1024' | 'LARGE_1536' | 'PORTRAIT_1024'
  quality: 'standard' | 'hd'
  userId: string
  studentId?: string
  teacherId?: string
  schoolId?: string
  classId?: string
  metadata?: any
}

export interface SaveImageResponse {
  id: string
  filename: string
  storedUrl: string
  fileSize: number
  dimensions: { width: number; height: number }
}

export class CloudinaryStorage {
  static generatePublicId(topic: string, userId: string, type: string): string {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '_')
    const timestamp = Date.now()
    const cleanTopic = topic.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    return `elimunova/ai_images/${dateStr}/${timestamp}_${userId.substring(0, 8)}_${cleanTopic}_${type.toLowerCase()}`
  }

  static async uploadToCloudinary(imageUrl: string, publicId: string): Promise<{
    cloudinaryUrl: string
    fileSize: number
    dimensions: { width: number; height: number }
  }> {
    const result = await cloudinary.uploader.upload(imageUrl, {
      public_id: publicId,
      folder: 'elimunova/ai_images',
      resource_type: 'image',
      format: 'png',
      quality: 'auto',
      fetch_format: 'auto',
    })
    return {
      cloudinaryUrl: result.secure_url,
      fileSize: result.bytes,
      dimensions: { width: result.width, height: result.height },
    }
  }

  static async saveAIImage(request: SaveImageRequest): Promise<SaveImageResponse> {
    const publicId = this.generatePublicId(request.topic, request.userId, request.type)
    const filename = `${publicId.split('/').pop()}.png`

    // Try Supabase first
    let storedUrl: string | null = null
    let fileSize = 0
    let dimensions = { width: 1024, height: 1024 }

    try {
      const response = await fetch(request.imageUrl)
      if (response.ok) {
        const buffer = Buffer.from(await response.arrayBuffer())
        const supabasePath = `ai_images/${publicId.split('/').slice(1).join('/')}.png`
        const result = await supabaseUpload(BUCKETS.AI_IMAGES, supabasePath, buffer, 'image/png')
        if (result) {
          storedUrl = result
          fileSize = buffer.length
        }
      }
    } catch (e) {
      console.warn('[CloudinaryStorage] Supabase upload failed, falling back to Cloudinary:', e)
    }

    // Fall back to Cloudinary
    if (!storedUrl) {
      try {
        const cloudResult = await this.uploadToCloudinary(request.imageUrl, publicId)
        storedUrl = cloudResult.cloudinaryUrl
        fileSize = cloudResult.fileSize
        dimensions = cloudResult.dimensions
      } catch (e) {
        console.error('[CloudinaryStorage] Both Supabase and Cloudinary failed:', e)
        throw e
      }
    }

    const savedImage = await prisma.aIGeneratedImage.create({
      data: {
        filename,
        originalUrl: request.imageUrl,
        storedUrl,
        topic: request.topic,
        prompt: request.prompt,
        type: request.type,
        size: request.size,
        quality: request.quality,
        userId: request.userId,
        studentId: request.studentId,
        teacherId: request.teacherId,
        schoolId: request.schoolId,
        classId: request.classId,
        fileSize,
        dimensions: JSON.stringify(dimensions),
        metadata: request.metadata
          ? JSON.stringify({ ...request.metadata, storedIn: storedUrl.includes('cloudinary') ? 'cloudinary' : 'supabase' })
          : JSON.stringify({ storedIn: storedUrl.includes('cloudinary') ? 'cloudinary' : 'supabase' }),
      },
    })

    return {
      id: savedImage.id,
      filename,
      storedUrl,
      fileSize,
      dimensions,
    }
  }

  static async deleteImage(imageId: string, userId: string): Promise<boolean> {
    const image = await prisma.aIGeneratedImage.findFirst({ where: { id: imageId, userId } })
    if (!image) return false
    await prisma.aIGeneratedImage.delete({ where: { id: imageId } })
    return true
  }

  static async getCloudinaryStats() {
    try {
      const result = await cloudinary.api.usage()
      return {
        credits: result.credits,
        usedPercent: result.used_percent,
        limit: result.limit,
        storage: result.storage,
        provider: 'cloudinary',
      }
    } catch (e) { console.warn('[Cloudinary] Stats fetch failed, using DB fallback:', e)
      const [images, totalSize] = await Promise.all([
        prisma.aIGeneratedImage.count(),
        prisma.aIGeneratedImage.aggregate({ _sum: { fileSize: true } }),
      ])
      return { images, storage: totalSize._sum.fileSize || 0, provider: 'fallback' }
    }
  }

  static async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping()
      return true
    } catch (e) { console.warn('[Cloudinary] Connection test failed:', e)
      return false
    }
  }
}

export default CloudinaryStorage
