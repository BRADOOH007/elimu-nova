/**
 * Vercel Blob Storage Service for AI Images
 * Handles permanent storage of AI-generated images
 */

import { put, del, list } from '@vercel/blob'
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

export class VercelBlobStorage {
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
   * Download image from OpenAI and upload to Vercel Blob
   */
  static async downloadAndUploadImage(imageUrl: string, filename: string): Promise<{
    blobUrl: string
    fileSize: number
    dimensions: { width: number; height: number }
  }> {
    try {
      console.log(`📥 Downloading image from OpenAI: ${imageUrl.substring(0, 50)}...`)
      
      // Download image from OpenAI
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`)
      }

      const imageBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(imageBuffer)
      
      console.log(`📤 Uploading to Vercel Blob: ${filename} (${buffer.length} bytes)`)
      
      // Upload to Vercel Blob
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'image/png'
      })

      // Get image dimensions (basic PNG header parsing)
      const dimensions = this.getImageDimensions(buffer)

      console.log(`✅ Image uploaded successfully: ${blob.url}`)

      return {
        blobUrl: blob.url,
        fileSize: buffer.length,
        dimensions
      }
    } catch (error) {
      console.error('Error downloading and uploading image:', error)
      throw error
    }
  }

  /**
   * Get image dimensions from buffer (basic PNG header parsing)
   */
  static getImageDimensions(buffer: Buffer): { width: number; height: number } {
    try {
      // For PNG files, dimensions are at bytes 16-23
      if (buffer.length >= 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
        const width = buffer.readUInt32BE(16)
        const height = buffer.readUInt32BE(20)
        return { width, height }
      }
      
      // Default fallback
      return { width: 1024, height: 1024 }
    } catch (error) {
      console.warn('Could not determine image dimensions:', error)
      return { width: 1024, height: 1024 }
    }
  }

  /**
   * Save AI-generated image with Vercel Blob storage
   */
  static async saveAIImage(request: SaveImageRequest): Promise<SaveImageResponse> {
    try {
      // Generate unique filename
      const filename = this.generateFilename(request.topic, request.userId, request.type)

      // Download from OpenAI and upload to Vercel Blob
      const { blobUrl, fileSize, dimensions } = await this.downloadAndUploadImage(request.imageUrl, filename)

      // Save to database
      const savedImage = await prisma.aIGeneratedImage.create({
        data: {
          filename,
          originalUrl: request.imageUrl,
          storedUrl: blobUrl, // Use Vercel Blob URL
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

      console.log(`✅ Image saved with Vercel Blob: ${filename} (${fileSize} bytes)`)

      return {
        id: savedImage.id,
        filename,
        storedUrl: blobUrl,
        fileSize,
        dimensions
      }
    } catch (error) {
      console.error('Error saving AI image to Vercel Blob:', error)
      throw error
    }
  }

  /**
   * Delete image from Vercel Blob
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

      // Delete from Vercel Blob
      try {
        await del(image.storedUrl)
        console.log(`✅ Image deleted from Vercel Blob: ${image.filename}`)
      } catch (blobError) {
        console.warn('Could not delete from Vercel Blob:', blobError)
        // Continue with database deletion even if blob deletion fails
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
   * List all blobs (for maintenance)
   */
  static async listBlobs(prefix?: string) {
    try {
      const { blobs } = await list({
        prefix: prefix || 'elimu_'
      })
      
      return blobs.map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt
      }))
    } catch (error) {
      console.error('Error listing blobs:', error)
      throw error
    }
  }

  /**
   * Cleanup old images from Vercel Blob (for maintenance)
   */
  static async cleanupOldImages(daysOld: number = 90): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000)
      
      const oldImages = await prisma.aIGeneratedImage.findMany({
        where: { createdAt: { lt: cutoffDate } },
        select: { id: true, filename: true, storedUrl: true }
      })

      let deletedCount = 0
      for (const image of oldImages) {
        try {
          // Delete from Vercel Blob
          await del(image.storedUrl)
          
          // Delete from database
          await prisma.aIGeneratedImage.delete({ where: { id: image.id } })
          
          deletedCount++
        } catch (error) {
          console.warn(`Could not delete old image ${image.filename}:`, error)
        }
      }

      console.log(`✅ Cleaned up ${deletedCount} old images from Vercel Blob`)
      return deletedCount
    } catch (error) {
      console.error('Error cleaning up old images:', error)
      throw error
    }
  }
}

export default VercelBlobStorage