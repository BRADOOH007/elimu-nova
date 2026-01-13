/**
 * Cloudinary Storage Service for AI Images
 * Handles permanent storage of AI-generated images using Cloudinary
 */

import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

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

export class CloudinaryStorage {
  /**
   * Generate unique public ID for Cloudinary
   */
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

  /**
   * Upload image from OpenAI URL to Cloudinary
   */
  static async uploadToCloudinary(imageUrl: string, publicId: string): Promise<{
    cloudinaryUrl: string
    fileSize: number
    dimensions: { width: number; height: number }
  }> {
    try {
      console.log(`📤 Uploading to Cloudinary: ${publicId}`)
      
      // Upload image to Cloudinary
      const result = await cloudinary.uploader.upload(imageUrl, {
        public_id: publicId,
        folder: 'elimunova/ai_images',
        resource_type: 'image',
        format: 'png',
        quality: 'auto',
        fetch_format: 'auto'
      })

      console.log(`✅ Image uploaded successfully: ${result.secure_url}`)

      return {
        cloudinaryUrl: result.secure_url,
        fileSize: result.bytes,
        dimensions: {
          width: result.width,
          height: result.height
        }
      }
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      throw error
    }
  }

  /**
   * Save AI-generated image with Cloudinary storage
   */
  static async saveAIImage(request: SaveImageRequest): Promise<SaveImageResponse> {
    try {
      // Generate unique public ID
      const publicId = this.generatePublicId(request.topic, request.userId, request.type)
      const filename = `${publicId.split('/').pop()}.png`

      // Upload to Cloudinary
      const { cloudinaryUrl, fileSize, dimensions } = await this.uploadToCloudinary(request.imageUrl, publicId)

      // Save to database
      const savedImage = await prisma.aIGeneratedImage.create({
        data: {
          filename,
          originalUrl: request.imageUrl,
          storedUrl: cloudinaryUrl, // Use Cloudinary URL
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
          metadata: request.metadata ? JSON.stringify({
            ...request.metadata,
            cloudinaryPublicId: publicId
          }) : JSON.stringify({ cloudinaryPublicId: publicId }),
        }
      })

      console.log(`✅ Image saved with Cloudinary: ${filename} (${fileSize} bytes)`)

      return {
        id: savedImage.id,
        filename,
        storedUrl: cloudinaryUrl,
        fileSize,
        dimensions
      }
    } catch (error) {
      console.error('Error saving AI image to Cloudinary:', error)
      throw error
    }
  }

  /**
   * Delete image from Cloudinary
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

      // Extract public ID from metadata
      let publicId = null
      try {
        const metadata = image.metadata ? JSON.parse(image.metadata) : {}
        publicId = metadata.cloudinaryPublicId
      } catch (error) {
        console.warn('Could not parse metadata for public ID:', error)
      }

      // Delete from Cloudinary
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId)
          console.log(`✅ Image deleted from Cloudinary: ${publicId}`)
        } catch (cloudinaryError) {
          console.warn('Could not delete from Cloudinary:', cloudinaryError)
          // Continue with database deletion even if Cloudinary deletion fails
        }
      }

      // Delete from database (cascade will handle usage records)
      await prisma.aIGeneratedImage.delete({
        where: { id: imageId }
      })

      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }

  /**
   * Get Cloudinary usage stats
   */
  static async getCloudinaryStats() {
    try {
      const result = await cloudinary.api.usage()
      return {
        credits: result.credits,
        used_percent: result.used_percent,
        limit: result.limit,
        transformations: result.transformations,
        objects: result.objects,
        bandwidth: result.bandwidth,
        storage: result.storage
      }
    } catch (error) {
      console.error('Error getting Cloudinary stats:', error)
      throw error
    }
  }

  /**
   * List images in Cloudinary folder
   */
  static async listCloudinaryImages(maxResults: number = 50) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: 'elimunova/ai_images',
        max_results: maxResults,
        resource_type: 'image'
      })

      return result.resources.map((resource: any) => ({
        publicId: resource.public_id,
        url: resource.secure_url,
        format: resource.format,
        width: resource.width,
        height: resource.height,
        bytes: resource.bytes,
        createdAt: resource.created_at
      }))
    } catch (error) {
      console.error('Error listing Cloudinary images:', error)
      throw error
    }
  }

  /**
   * Cleanup old images from Cloudinary (for maintenance)
   */
  static async cleanupOldImages(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      
      const oldImages = await prisma.aIGeneratedImage.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true, filename: true, metadata: true }
      })

      let deletedCount = 0
      for (const image of oldImages) {
        try {
          // Extract public ID from metadata
          let publicId = null
          try {
            const metadata = image.metadata ? JSON.parse(image.metadata) : {}
            publicId = metadata.cloudinaryPublicId
          } catch (error) {
            console.warn('Could not parse metadata for cleanup:', error)
          }

          // Delete from Cloudinary
          if (publicId) {
            await cloudinary.uploader.destroy(publicId)
          }
          
          // Delete from database
          await prisma.aIGeneratedImage.delete({ where: { id: image.id } })
          
          deletedCount++
        } catch (error) {
          console.warn(`Could not delete old image ${image.filename}:`, error)
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old images from Cloudinary`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old images:', error)
      throw error
    }
  }

  /**
   * Test Cloudinary connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await cloudinary.api.ping()
      console.log('✅ Cloudinary connection successful')
      return true
    } catch (error) {
      console.error('❌ Cloudinary connection failed:', error)
      return false
    }
  }
}

export default CloudinaryStorage