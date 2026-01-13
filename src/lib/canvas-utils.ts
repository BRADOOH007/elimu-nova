/**
 * Canvas utilities for educational diagram labeling
 * Browser-based image processing for label overlay
 */

export interface LabelPosition {
  x: number
  y: number
  width: number
  height: number
  text: string
  fontSize: number
}

export class CanvasUtils {
  /**
   * Create a labeled diagram by overlaying labels on an image
   */
  static async createLabeledDiagram(
    imageUrl: string,
    labels: string[],
    requestedWidth: number = 1024,
    requestedHeight: number = 1024
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      canvas.width = requestedWidth
      canvas.height = requestedHeight

      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        try {
          // Draw the base image, resizing if necessary
          ctx.drawImage(img, 0, 0, requestedWidth, requestedHeight)

          // Calculate label positions based on requested size
          const labelPositions = this.calculateLabelPositions(labels, requestedWidth, requestedHeight)

          // Draw labels
          this.drawLabels(ctx, labelPositions)

          // Convert to data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0)
          resolve(dataUrl)
        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = imageUrl
    })
  }

  /**
   * Calculate optimal positions for labels around the diagram
   */
  static calculateLabelPositions(
    labels: string[],
    canvasWidth: number,
    canvasHeight: number
  ): LabelPosition[] {
    const positions: LabelPosition[] = []
    const margin = 50
    const labelHeight = 40
    const labelSpacing = 60
    const labelWidth = 200

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
        fontSize: 24
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
        fontSize: 24
      })
    }

    return positions
  }

  /**
   * Draw labels with professional styling
   */
  static drawLabels(ctx: CanvasRenderingContext2D, positions: LabelPosition[]): void {
    positions.forEach((pos, index) => {
      // Draw label background (white with border)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.strokeStyle = '#333333'
      ctx.lineWidth = 2
      
      // Rounded rectangle
      this.drawRoundedRect(ctx, pos.x, pos.y, pos.width, pos.height, 8)
      ctx.fill()
      ctx.stroke()

      // Draw text
      ctx.fillStyle = '#000000'
      ctx.font = `bold ${pos.fontSize}px Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      
      // Center text in label
      const textX = pos.x + pos.width / 2
      const textY = pos.y + pos.height / 2
      
      // Handle long text by wrapping or truncating
      const maxWidth = pos.width - 20
      const text = this.fitTextToWidth(ctx, pos.text, maxWidth)
      ctx.fillText(text, textX, textY)

      // Draw pointer line to diagram center area
      this.drawPointerLine(ctx, pos, index)
    })
  }

  /**
   * Draw a pointer line from label to diagram
   */
  static drawPointerLine(ctx: CanvasRenderingContext2D, pos: LabelPosition, index: number): void {
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    
    const canvasWidth = ctx.canvas.width
    const canvasHeight = ctx.canvas.height
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2
    
    // Start point (edge of label box)
    const startX = pos.x + (pos.x < centerX ? pos.width : 0)
    const startY = pos.y + pos.height / 2
    
    // End point (somewhere in the center area with some randomization)
    const angle = (index / 10) * Math.PI * 2 // Distribute around center
    const radius = Math.min(canvasWidth, canvasHeight) * 0.2
    const endX = centerX + Math.cos(angle) * radius
    const endY = centerY + Math.sin(angle) * radius
    
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
    ctx.setLineDash([])
  }

  /**
   * Draw rounded rectangle
   */
  static drawRoundedRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  /**
   * Fit text to specified width by truncating if necessary
   */
  static fitTextToWidth(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
    const metrics = ctx.measureText(text)
    if (metrics.width <= maxWidth) {
      return text
    }

    // Truncate and add ellipsis
    let truncated = text
    while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1)
    }
    
    return truncated + '...'
  }

  /**
   * Download canvas as PNG file
   */
  static downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    }, 'image/png', 1.0)
  }

  /**
   * Create a preview overlay for labels (for UI display)
   */
  static createLabelPreview(labels: string[], containerWidth: number, containerHeight: number) {
    const positions = this.calculateLabelPositions(labels, 1536, 1024)
    
    return positions.map((pos, index) => {
      const scaleX = containerWidth / 1536
      const scaleY = containerHeight / 1024
      
      return {
        ...pos,
        x: pos.x * scaleX,
        y: pos.y * scaleY,
        width: pos.width * scaleX,
        height: pos.height * scaleY,
        fontSize: pos.fontSize * Math.min(scaleX, scaleY)
      }
    })
  }
}

export default CanvasUtils