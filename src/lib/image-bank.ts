import { prisma } from '@/lib/prisma'
import { CloudinaryStorage } from '@/lib/cloudinary-storage'

export interface ImageBankEntry {
  id: string
  url: string
  thumbnailUrl: string
  prompt: string
  topic: string
  subject?: string
  grade?: string
  type: string
  teacherName?: string
  usageCount: number
  createdAt: Date
}

export interface ImageBankFilters {
  subject?: string
  grade?: string
  topic?: string
  prompt?: string
  schoolId?: string
  teacherId?: string
  limit?: number
  offset?: number
}

export interface ContextInfo {
  type: 'lesson_plan' | 'scheme_of_work' | 'presentation' | 'standalone'
  id?: string
}

export class ImageBank {
  /**
   * Find existing images that match the given prompt/subject/grade.
   * Search order: exact prompt → topic+subject+grade → partial prompt.
   */
  static async findMatching(options: {
    prompt: string
    subject?: string
    grade?: string
    topic?: string
    schoolId?: string
  }): Promise<ImageBankEntry | null> {
    const { prompt, subject, grade, topic, schoolId } = options

    const buildWhere = (promptFilter?: string, topicFilter?: string) => {
      const where: any = {}
      if (promptFilter) where.prompt = { equals: promptFilter }
      if (topicFilter) where.topic = { contains: topicFilter, mode: 'insensitive' }
      if (subject || grade) {
        const conditions: any[] = []
        if (subject) conditions.push({ metadata: { contains: `"subject":"${subject}"` } })
        if (grade) conditions.push({ metadata: { contains: `"grade":"${grade}"` } })
        if (conditions.length > 0) where.AND = conditions
      }
      if (schoolId) where.schoolId = schoolId
      return where
    }

    const results = await prisma.aIGeneratedImage.findMany({
      where: buildWhere(prompt),
      orderBy: { createdAt: 'desc' },
      take: 1,
      include: {
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { usageHistory: true } },
      },
    })

    if (results.length > 0) return this.toEntry(results[0])

    if (topic) {
      const topicResults = await prisma.aIGeneratedImage.findMany({
        where: buildWhere(undefined, topic),
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: {
          teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { usageHistory: true } },
        },
      })
      if (topicResults.length > 0) return this.toEntry(topicResults[0])
    }

    return null
  }

  /**
   * Save a newly generated image to the bank with full metadata.
   */
  static async save(options: {
    imageUrl: string
    prompt: string
    topic: string
    subject?: string
    grade?: string
    type: string
    size: string
    quality: string
    userId: string
    teacherId?: string
    schoolId?: string
    classId?: string
    provider?: string
  }): Promise<ImageBankEntry> {
    const metadata: any = {
      subject: options.subject || null,
      grade: options.grade || null,
      provider: options.provider || 'unknown',
      source: 'image-bank',
      generatedAt: new Date().toISOString(),
    }

    const savedImage = await CloudinaryStorage.saveAIImage({
      imageUrl: options.imageUrl,
      topic: options.topic || options.prompt.slice(0, 50),
      prompt: options.prompt,
      type: (options.type as any) || 'GENERAL',
      size: (options.size as any) || 'MEDIUM_1024',
      quality: (options.quality as any) || 'standard',
      userId: options.userId,
      teacherId: options.teacherId,
      schoolId: options.schoolId,
      classId: options.classId,
      metadata,
    })

    const record = await prisma.aIGeneratedImage.findUnique({
      where: { id: savedImage.id },
      include: {
        teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
        _count: { select: { usageHistory: true } },
      },
    })

    return this.toEntry(record!)
  }

  /**
   * Track image usage in a specific context (lesson plan, scheme, etc.)
   */
  static async trackUsage(options: {
    imageId: string
    contextType: 'lesson_plan' | 'scheme_of_work' | 'presentation' | 'standalone'
    contextId?: string
    userId: string
  }): Promise<void> {
    try {
      await prisma.aIImageUsage.create({
        data: {
          imageId: options.imageId,
          userId: options.userId,
          usageType: options.contextType,
          context: options.contextId || null,
        },
      })
    } catch (error) {
      console.warn('[ImageBank] Failed to track usage:', error)
    }
  }

  /**
   * Search the shared image bank with filters.
   */
  static async search(filters: ImageBankFilters): Promise<{
    images: ImageBankEntry[]
    total: number
    hasMore: boolean
  }> {
    const { subject, grade, topic, prompt, schoolId, teacherId, limit = 20, offset = 0 } = filters

    const where: any = {}

    if (subject || grade) {
      const conditions: any[] = []
      if (subject) conditions.push({ metadata: { contains: `"subject":"${subject}"` } })
      if (grade) conditions.push({ metadata: { contains: `"grade":"${grade}"` } })
      where.AND = conditions
    }

    if (topic) where.topic = { contains: topic, mode: 'insensitive' }
    if (prompt) where.prompt = { contains: prompt, mode: 'insensitive' }
    if (schoolId) where.schoolId = schoolId
    if (teacherId) where.teacherId = teacherId

    const [records, total] = await Promise.all([
      prisma.aIGeneratedImage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
          _count: { select: { usageHistory: true } },
        },
      }),
      prisma.aIGeneratedImage.count({ where }),
    ])

    return {
      images: records.map(r => this.toEntry(r)),
      total,
      hasMore: offset + limit < total,
    }
  }

  /**
   * Get images used in a specific context (e.g. all images for a lesson plan).
   */
  static async getContextImages(contextType: string, contextId: string): Promise<ImageBankEntry[]> {
    const usages = await prisma.aIImageUsage.findMany({
      where: { usageType: contextType, context: contextId },
      include: {
        image: {
          include: {
            teacher: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
            _count: { select: { usageHistory: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return usages.map(u => this.toEntry(u.image))
  }

  /**
   * Get usage stats for an image.
   */
  static async getStats(imageId: string): Promise<{
    totalUsage: number
    contextBreakdown: Record<string, number>
  }> {
    const usages = await prisma.aIImageUsage.findMany({
      where: { imageId },
    })
    const breakdown: Record<string, number> = {}
    for (const u of usages) {
      breakdown[u.usageType] = (breakdown[u.usageType] || 0) + 1
    }
    return {
      totalUsage: usages.length,
      contextBreakdown: breakdown,
    }
  }

  /**
   * Get distinct subjects and grades available in the bank.
   */
  static async getFacets(schoolId?: string): Promise<{
    subjects: string[]
    grades: string[]
  }> {
    const where: any = {}
    if (schoolId) where.schoolId = schoolId

    const images = await prisma.aIGeneratedImage.findMany({
      where,
      select: { metadata: true },
      take: 500,
    })

    const subjects = new Set<string>()
    const grades = new Set<string>()

    for (const img of images) {
      if (!img.metadata) continue
      try {
        const meta = JSON.parse(img.metadata)
        if (meta.subject) subjects.add(meta.subject)
        if (meta.grade) grades.add(meta.grade)
      } catch (e) { console.warn('[ImageBank] Failed to parse metadata:', e) }
    }

    return {
      subjects: Array.from(subjects).sort(),
      grades: Array.from(grades).sort(),
    }
  }

  private static toEntry(record: any): ImageBankEntry {
    const meta = record.metadata ? tryParseJSON(record.metadata) : {}
    const name = record.teacher?.user
      ? `${record.teacher.user.firstName} ${record.teacher.user.lastName}`
      : undefined
    return {
      id: record.id,
      url: record.storedUrl,
      thumbnailUrl: record.storedUrl,
      prompt: record.prompt,
      topic: record.topic,
      subject: meta?.subject || undefined,
      grade: meta?.grade || undefined,
      type: record.type,
      teacherName: name,
      usageCount: record._count?.usageHistory ?? 0,
      createdAt: record.createdAt,
    }
  }
}

function tryParseJSON(s: string): any {
  try { return JSON.parse(s) } catch (e) { console.warn('[ImageBank] tryParseJSON failed:', e); return {} }
}
