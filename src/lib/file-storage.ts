import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export class FileStorageService {
  private static readonly STORAGE_DIR = process.env.NODE_ENV === 'production'
    ? '/tmp/ai-presentations'
    : path.join(process.cwd(), 'public', 'ai-presentations')

  static async initializeStorage() {
    try {
      if (!fs.existsSync(this.STORAGE_DIR)) {
        fs.mkdirSync(this.STORAGE_DIR, { recursive: true })
      }
    } catch (error) {
      throw error
    }
  }

  static async savePresentationFile(
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    try {
      await this.initializeStorage()

      const uniqueId = randomUUID()
      const sanitizedFilename = filename.replace(/[^a-z0-9]/gi, '_')
      const finalFilename = `${uniqueId}_${sanitizedFilename}.pptx`
      const filePath = path.join(this.STORAGE_DIR, finalFilename)

      fs.writeFileSync(filePath, buffer)

      const publicUrl = process.env.NODE_ENV === 'production'
        ? `${process.env.NEXTAUTH_URL}/api/files/presentations/${finalFilename}`
        : `/ai-presentations/${finalFilename}`

      return publicUrl
    } catch (error) {
      throw error
    }
  }

  static async deletePresentationFile(url: string): Promise<void> {
    try {
      const filename = path.basename(url)
      const filePath = path.join(this.STORAGE_DIR, filename)

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      // non-critical
    }
  }

  static generateShareToken(): string {
    return randomUUID() + randomUUID().replace(/-/g, '')
  }
}

export class CloudFileStorageService {
  static async uploadToCloud(
    buffer: Buffer,
    filename: string
  ): Promise<string> {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME
    const apiKey = process.env.CLOUDINARY_API_KEY
    const apiSecret = process.env.CLOUDINARY_API_SECRET

    if (cloudName && apiKey && apiSecret) {
      try {
        const result = await new Promise<any>((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'presentations',
              public_id: `${randomUUID()}_${filename.replace(/[^a-z0-9]/gi, '_')}`,
              resource_type: 'raw',
              format: 'pptx',
            },
            (err, result) => {
              if (err) reject(err)
              else resolve(result)
            }
          )
          uploadStream.end(buffer)
        })
        return result.secure_url
      } catch (error) {
        // fallback to local
      }
    }

    return FileStorageService.savePresentationFile(buffer, filename)
  }
}
