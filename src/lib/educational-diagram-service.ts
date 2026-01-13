/**
 * Professional Educational Diagram Pipeline for ElimuNova AI
 * Two-step process: Generate artwork (no text) + Add labels programmatically
 * Browser-based implementation with cost-effective sizing
 */

import { OpenAIService } from './openai-service'

export interface DiagramRequest {
  topic: string
  grade: string
  curriculum: 'CBC' | 'IGCSE' | 'KCSE'
  type: 'biology' | 'geography' | 'physics' | 'chemistry' | 'mathematics' | 'general'
  size?: '512x512' | '1024x1024' | '1536x1024' | '1024x1536'
  quality?: 'standard' | 'hd'
}

export interface DiagramResponse {
  image_url: string
  labels: string[]
  metadata: {
    topic: string
    grade: string
    curriculum: string
    type: string
    dimensions: { width: number; height: number }
    size: string
    quality: string
    cost_tier: 'economy' | 'standard' | 'premium' | 'poster'
  }
}

export interface LabelPosition {
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
}

export class EducationalDiagramService {
  private static readonly MAX_LABELS = 10
  private static readonly FONT_SIZE_BASE = 24
  private static readonly FONT_SIZE_LARGE = 32

  // Size configurations for cost optimization
  private static readonly SIZE_CONFIGS = {
    '512x512': { width: 512, height: 512, cost_tier: 'economy' as const },
    '1024x1024': { width: 1024, height: 1024, cost_tier: 'standard' as const },
    '1536x1024': { width: 1536, height: 1024, cost_tier: 'premium' as const },
    '1024x1536': { width: 1024, height: 1536, cost_tier: 'poster' as const }
  }

  /**
   * Generate a complete educational diagram with labels
   */
  static async generateDiagram(request: DiagramRequest): Promise<DiagramResponse> {
    try {
      // Default to cost-effective size for previews and general use
      const size = request.size || '1024x1024'
      const quality = request.quality || 'standard'
      
      // Calculate canvas dimensions based on requested size
      const dimensions = this.getSizeDimensions(size)

      // Step 1: Generate artwork (no text)
      const artworkPrompt = this.createArtworkPrompt(request)
      const artworkImage = await OpenAIService.generateImage({
        prompt: artworkPrompt,
        size,
        quality,
        style: 'natural'
      })

      // Step 2: Generate labels
      const labelsPrompt = this.createLabelsPrompt(request)
      const labelsResponse = await OpenAIService.generateText([
        {
          role: 'system',
          content: 'You are an educational content expert. Generate clear, accurate labels for educational diagrams. Return only a JSON array of strings with 6-10 labels maximum.'
        },
        {
          role: 'user',
          content: labelsPrompt
        }
      ])

      // Parse labels
      let labels: string[] = []
      try {
        labels = JSON.parse(labelsResponse)
        if (!Array.isArray(labels)) {
          throw new Error('Labels must be an array')
        }
        // Limit to max labels
        labels = labels.slice(0, this.MAX_LABELS)
      } catch (error) {
        // Fallback: extract labels from text response
        labels = this.extractLabelsFromText(labelsResponse, request)
      }

      // Return the image URL and labels for client-side processing
      return {
        image_url: artworkImage.url,
        labels,
        metadata: {
          topic: request.topic,
          grade: request.grade,
          curriculum: request.curriculum,
          type: request.type,
          dimensions,
          size,
          quality,
          cost_tier: this.getCostTier(size)
        }
      }
    } catch (error) {
      console.error('Error generating educational diagram:', error)
      throw error
    }
  }

  /**
   * Get dimensions for a given size
   */
  private static getSizeDimensions(size: string): { width: number; height: number } {
    const config = this.SIZE_CONFIGS[size as keyof typeof this.SIZE_CONFIGS]
    return config ? { width: config.width, height: config.height } : { width: 1024, height: 1024 }
  }

  /**
   * Get cost tier for a given size
   */
  private static getCostTier(size: string): 'economy' | 'standard' | 'premium' | 'poster' {
    const config = this.SIZE_CONFIGS[size as keyof typeof this.SIZE_CONFIGS]
    return config ? config.cost_tier : 'standard'
  }

  /**
   * Create artwork prompt (Step 1) - NO TEXT
   */
  private static createArtworkPrompt(request: DiagramRequest): string {
    const basePrompt = `Create a clean vector diagram of ${request.topic} for ${request.grade} ${request.curriculum} curriculum.`
    
    const styleRequirements = [
      'NO TEXT OR WORDS anywhere in the image',
      'empty label boxes or blank spaces for labels',
      'white background',
      'thick black outlines',
      'high resolution vector style',
      'educational poster quality',
      'clear distinct parts that can be labeled',
      'professional textbook illustration style',
      'crisp graphics with high contrast'
    ]

    const subjectSpecific = this.getSubjectSpecificRequirements(request.type)
    
    return `${basePrompt} Requirements: ${[...styleRequirements, ...subjectSpecific].join(', ')}.`
  }

  /**
   * Create labels prompt (Step 2)
   */
  private static createLabelsPrompt(request: DiagramRequest): string {
    return `Generate 6-10 important labels for a ${request.topic} diagram for ${request.grade} students following ${request.curriculum} curriculum in ${request.type}.

Requirements:
- Return ONLY a JSON array of strings
- Each label should be 1-3 words maximum
- Use terminology appropriate for ${request.grade} level
- Focus on the most important parts students need to learn
- Ensure spelling is 100% correct
- Use proper scientific/academic terminology

Example format: ["Heart", "Aorta", "Left Ventricle", "Right Atrium", "Pulmonary Artery"]

Topic: ${request.topic}`
  }

  /**
   * Get subject-specific requirements for artwork
   */
  private static getSubjectSpecificRequirements(type: string): string[] {
    const requirements: Record<string, string[]> = {
      biology: [
        'anatomical accuracy',
        'clear organ boundaries',
        'proper proportions',
        'cross-sectional views where appropriate'
      ],
      chemistry: [
        'molecular structure accuracy',
        'proper chemical bonds representation',
        'clear atomic arrangements',
        'standard chemical diagram conventions'
      ],
      physics: [
        'accurate physical relationships',
        'proper force directions',
        'clear component separation',
        'standard physics diagram symbols'
      ],
      geography: [
        'accurate geographical features',
        'proper scale representation',
        'clear topographical details',
        'standard map conventions'
      ],
      mathematics: [
        'precise geometric shapes',
        'accurate measurements',
        'clear mathematical relationships',
        'standard mathematical notation spaces'
      ],
      general: [
        'clear visual hierarchy',
        'logical component arrangement',
        'educational clarity'
      ]
    }

    return requirements[type] || requirements.general
  }

  /**
   * Extract labels from text response (fallback)
   */
  private static extractLabelsFromText(text: string, request: DiagramRequest): string[] {
    // Try to extract labels from various formats
    const lines = text.split('\n').filter(line => line.trim())
    const labels: string[] = []

    for (const line of lines) {
      // Remove numbers, bullets, dashes
      const cleaned = line.replace(/^\d+\.?\s*/, '').replace(/^[-•*]\s*/, '').trim()
      if (cleaned && cleaned.length < 50 && !cleaned.includes(':')) {
        labels.push(cleaned)
      }
    }

    // If no labels found, generate basic ones
    if (labels.length === 0) {
      return this.generateFallbackLabels(request)
    }

    return labels.slice(0, this.MAX_LABELS)
  }

  /**
   * Generate fallback labels if parsing fails
   */
  private static generateFallbackLabels(request: DiagramRequest): string[] {
    const fallbacks: Record<string, string[]> = {
      biology: ['Structure A', 'Structure B', 'Structure C', 'Structure D', 'Structure E'],
      chemistry: ['Component 1', 'Component 2', 'Component 3', 'Component 4', 'Component 5'],
      physics: ['Part A', 'Part B', 'Part C', 'Part D', 'Part E'],
      geography: ['Feature 1', 'Feature 2', 'Feature 3', 'Feature 4', 'Feature 5'],
      mathematics: ['Element A', 'Element B', 'Element C', 'Element D', 'Element E'],
      general: ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5']
    }

    return fallbacks[request.type] || fallbacks.general
  }

  /**
   * Calculate optimal positions for labels (for client-side use)
   */
  static calculateLabelPositions(
    labels: string[], 
    canvasWidth: number, 
    canvasHeight: number
  ): LabelPosition[] {
    const positions: LabelPosition[] = []
    const margin = Math.max(30, canvasWidth * 0.03) // Responsive margin
    const labelHeight = Math.max(30, canvasHeight * 0.04) // Responsive height
    const labelSpacing = labelHeight + 10
    const labelWidth = Math.max(150, canvasWidth * 0.15) // Responsive width

    // Distribute labels around the edges
    const leftSide = Math.ceil(labels.length / 2)
    const rightSide = labels.length - leftSide

    // Left side labels
    for (let i = 0; i < leftSide; i++) {
      positions.push({
        x: margin,
        y: margin + (i * labelSpacing),
        width: labelWidth,
        height: labelHeight,
        text: labels[i],
        fontSize: Math.max(16, canvasWidth * 0.015) // Responsive font size
      })
    }

    // Right side labels
    for (let i = 0; i < rightSide; i++) {
      positions.push({
        x: canvasWidth - labelWidth - margin,
        y: margin + (i * labelSpacing),
        width: labelWidth,
        height: labelHeight,
        text: labels[leftSide + i],
        fontSize: Math.max(16, canvasWidth * 0.015) // Responsive font size
      })
    }

    return positions
  }

  /**
   * Get size recommendations based on use case
   */
  static getSizeRecommendations() {
    return {
      preview: '512x512',      // 4x cheaper - for previews and quick checks
      worksheet: '1024x1024',  // Standard cost - for worksheets and assignments
      poster: '1536x1024',     // 3x more expensive - for posters and displays
      portrait: '1024x1536'    // 3x more expensive - for portrait posters
    }
  }

  /**
   * Get cost information for different sizes
   */
  static getCostInfo() {
    return {
      '512x512': { relative_cost: 1, description: 'Economy - Perfect for previews and quick diagrams' },
      '1024x1024': { relative_cost: 4, description: 'Standard - Ideal for worksheets and assignments' },
      '1536x1024': { relative_cost: 12, description: 'Premium - High quality for posters and displays' },
      '1024x1536': { relative_cost: 12, description: 'Portrait - High quality for vertical posters' }
    }
  }
}

export default EducationalDiagramService