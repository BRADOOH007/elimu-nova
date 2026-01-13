/**
 * AI Image Storage Service for ElimuNova
 * Handles saving, indexing, and retrieving AI-generated images
 */

import { promises as fs } from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SaveImageRequest {
  imageUrl: string // OpenAI image URL
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

export class ImageStorageService {
  private static readonly STORAGE_DIR = process.env.NODE_ENV === 'production' 
    ? '/tmp/ai-images' // Vercel temp directory
    : path.join(process.cwd(), 'public', 'ai-images')
  
  private static readonly PUBLIC_URL_PREFIX = '/ai-images'

  /**
   * Initialize storage directory
   */
  static async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.STORAGE_DIR, { recursive: true })
      console.log(`✅ Image storage initialized: ${this.STORAGE_DIR}`)
    } catch (error) {
      console.error('❌ Failed to initialize image storage:', error)
      throw error
    }
  }

  /**
   * Generate unique filename
   */
  static generateFilename(topic: string, userId: string, type: string): string {
    const date = new Date()
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '_')
    const timestamp = Date.now()
    const cleanTopic = topic.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 30)
    
    return `elimu_${dateStr}_${timestamp}_${userId.substring(0, 8)}_${cleanTopic}_${type.toLowerCase()}.png`
  }

  /**
   * Download and save image from OpenAI URL
   */
  static async downloadAndSaveImage(imageUrl: string, filename: string): Promise<{
    filePath: string
    fileSize: number
    dimensions: { width: number; height: number }
  }> {
    try {
      // Download image from OpenAI
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(imageBuffer)
      
      // Save to local storage
      const filePath = path.join(this.STORAGE_DIR, filename)
      await fs.writeFile(filePath, buffer)

      // Get image dimensions (basic implementation)
      const dimensions = await this.getImageDimensions(buffer)

      return {
        filePath,
        fileSize: buffer.length,
        dimensions
      }
    } catch (error) {
      console.error('Error downloading and saving image:', error)
      throw error
    }
  }

  /**
   * Get image dimensions from buffer (basic PNG header parsing)
   */
  static async getImageDimensions(buffer: Buffer): Promise<{ width: number; height: number }> {
    try {
      // For PNG files, dimensions are at bytes 16-23
      if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
        const width = buffer.readUInt32BE(16)
        const height = buffer.readUInt32BE(20)
        return { width, height }
      }
      
      // Default fallback based on size parameter
      return { width: 1024, height: 1024 }
    } catch (error) {
      console.warn('Could not determine image dimensions:', error)
      return { width: 1024, height: 1024 }
    }
  }

  /**
   * Save AI-generated image with full metadata
   */
  static async saveAIImage(request: SaveImageRequest): Promise<SaveImageResponse> {
    try {
      // Initialize storage if needed
      await this.initializeStorage()

      // Generate unique filename
      const filename = this.generateFilename(request.topic, request.userId, request.type)

      // Download and save image
      const { fileSize, dimensions } = await this.downloadAndSaveImage(request.imageUrl, filename)

      // Create public URL
      const storedUrl = `${this.PUBLIC_URL_PREFIX}/${filename}`

      // Save to database
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
          metadata: request.metadata ? JSON.stringify(request.metadata) : null,
        }
      })

      console.log(`✅ Image saved: ${filename} (${fileSize} bytes)`)

      return {
        id: savedImage.id,
        filename,
        storedUrl,
        fileSize,
        dimensions
      }
    } catch (error) {
      console.error('Error saving AI image:', error)
      throw error
    }
  }

  /**
   * Get user's AI images with pagination and filtering
   */
  static async getUserImages(
    userId: string,
    options?: {
      studentId?: string
      type?: string
      topic?: string
      limit?: number
      offset?: number
    }
  ) {
    try {
      const { studentId, type, topic, limit = 20, offset = 0 } = options || {}

      const where: any = { userId }
      
      if (studentId) where.studentId = studentId
      if (type) where.type = type
      if (topic) where.topic = { contains: topic, mode: 'insensitive' }

      const [images, total] = await Promise.all([
        prisma.aIGeneratedImage.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true }
            },
            student: {
              select: { id: true, user: { select: { firstName: true, lastName: true } } }
            },
            teacher: {
              select: { id: true, user: { select: { firstName: true, lastName: true } } }
            },
            school: {
              select: { id: true, name: true }
            },
            class: {
              select: { id: true, name: true, subject: true }
            }
          }
        }),
        prisma.aIGeneratedImage.count({ where })
      ])

      return {
        images: images.map(img => ({
          ...img,
          dimensions: img.dimensions ? JSON.parse(img.dimensions) : null,
          metadata: img.metadata ? JSON.parse(img.metadata) : null
        })),
        total,
        hasMore: offset + limit < total
      }
    } catch (error) {
      console.error('Error getting user images:', error)
      throw error
    }
  }

  /**
   * Track image usage
   */
  static async trackImageUsage(
    imageId: string,
    userId: string,
    usageType: string,
    context?: string
  ): Promise<void> {
    try {
      await prisma.aIImageUsage.create({
        data: {
          imageId,
          userId,
          usageType,
          context
        }
      })
    } catch (error) {
      console.error('Error tracking image usage:', error)
      // Don't throw - usage tracking is not critical
    }
  }

  /**
   * Delete AI image
   */
  static async deleteImage(imageId: string, userId: string): Promise<boolean> {
    try {
      // Get image details
      const image = await prisma.aIGeneratedImage.findFirst({
        where: { id: imageId, userId }
      })

      if (!image) {
        return false
      }

      // Delete file from storage
      try {
        const filePath = path.join(this.STORAGE_DIR, image.filename)
        await fs.unlink(filePath)
      } catch (fileError) {
        console.warn('Could not delete file:', fileError)
        // Continue with database deletion even if file deletion fails
      }

      // Delete from database (cascade will handle usage records)
      await prisma.aIGeneratedImage.delete({
        where: { id: imageId }
      })

      console.log(`✅ Image deleted: ${image.filename}`)
      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  /**
   * Get image statistics
   */
  static async getImageStats(userId: string, schoolId?: string) {
    try {
      const where: any = { userId }
      if (schoolId) where.schoolId = schoolId

      const [totalImages, totalSize, typeStats, recentImages] = await Promise.all([
        prisma.aIGeneratedImage.count({ where }),
        prisma.aIGeneratedImage.aggregate({
          where,
          _sum: { fileSize: true }
        }),
        prisma.aIGeneratedImage.groupBy({
          by: ['type'],
          where,
          _count: { type: true }
        }),
        prisma.aIGeneratedImage.count({
          where: {
            ...where,
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ])

      return {
        totalImages,
        totalSize: totalSize._sum.fileSize || 0,
        typeBreakdown: typeStats.reduce((acc, stat) => {
          acc[stat.type] = stat._count.type
          return acc
        }, {} as Record<string, number>),
        recentImages
      }
    } catch (error) {
      console.error('Error getting image stats:', error)
      throw error
    }
  }

  /**
   * Cleanup old images (for maintenance)
   */
  static async cleanupOldImages(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      
      const oldImages = await prisma.aIGeneratedImage.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true, filename: true }
      })

      let deletedCount = 0
      for (const image of oldImages) {
        try {
          const filePath = path.join(this.STORAGE_DIR, image.filename)
          await fs.unlink(filePath)
          await prisma.aIGeneratedImage.delete({ where: { id: image.id } })
          deletedCount++
        } catch (error) {
          console.warn(`Could not delete old image ${image.filename}:`, error)
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old images`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old images:', error)
      throw error
    }
  }
}

export default ImageStorageService