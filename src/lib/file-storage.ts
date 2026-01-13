import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

export class FileStorageService {
  private static readonly STORAGE_DIR = process.env.NODE_ENV === 'production' 
    ? '/tmp/ai-presentations' // For serverless environments
    : path.join(process.cwd(), 'public', 'ai-presentations')

  /**
   * Initialize storage directory
   */
  static async initializeStorage() {
    try {
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true })
        console.log(`📁 Created storage directory: ${this.STORAGE_DIR}`)
      }
    } catch (error) {
      console.error('❌ Failed to initialize storage:', error)
      throw error
    }
  }

  /**
   * Save PPTX file and return public URL
   */
  static async savePresentationFile(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    try {
      await this.initializeStorage()
      
      // Generate unique filename
      const uniqueId = randomUUID()
      const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_')
      const finalFilename = `${uniqueId}_${sanitizedFilename}.pptx`
      const filePath = path.join(this.STORAGE_DIR, finalFilename)
      
      // Write file
      fs.writeFileSync(filePath, buffer)
      
      // Return public URL
      const publicUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.NEXTAUTH_URL}/api/files/presentations/${finalFilename}`
        : `/ai-presentations/${finalFilename}`
      
      console.log(`💾 Saved presentation file: ${finalFilename}`)
      return publicUrl
      
    } catch (error) {
      console.error('❌ Failed to save presentation file:', error)
      throw error
    }
  }

  /**
   * Delete presentation file
   */
  static async deletePresentationFile(url: string): Promise<void> {
    try {
      const filename = path.basename(url)
      const filePath = path.join(this.STORAGE_DIR, filename)
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`🗑️  Deleted presentation file: ${filename}`)
      }
    } catch (error) {
      console.error('❌ Failed to delete presentation file:', error)
      // Don't throw - file deletion is not critical
    }
  }

  /**
   * Generate secure share token
   */
  static generateShareToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '')
  }
}

// For production, you might want to use cloud storage
export class CloudFileStorageService {
  /**
   * Upload to cloud storage (S3, Cloudinary, etc.)
   * This is a placeholder for production implementation
   */
  static async uploadToCloud(
    buffer: Buffer, 
    filename: string
  ): Promise<string> {
    // TODO: Implement cloud storage upload
    // For now, fall back to local storage
    return FileStorageService.savePresentationFile(buffer, filename)
  }
}