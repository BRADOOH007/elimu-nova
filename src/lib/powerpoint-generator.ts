import PptxGenJS from 'pptxgenjs';
import { createCanvas } from 'canvas';

export interface SlideData {
  id: string;
  title: string;
  content: string;
  slideType: 'title' | 'content' | 'image' | 'chart' | 'video' | 'interactive' | 'summary';
  speakerNotes: string;
  visualSuggestions: string[];
  order: number;
}

export interface PowerPointData {
  title: string;
  subject: string;
  grade: string;
  topic: string;
  duration: number;
  slides: SlideData[];
  metadata: {
    objectives: string[];
    difficulty: string;
    format: string;
  };
}

// Canva-like color schemes
const colorSchemes = {
  professional: {
    primary: '#2563eb',
    secondary: '#1e40af',
    accent: '#3b82f6',
    background: '#f8fafc',
    text: '#1e293b',
    light: '#e2e8f0'
  },
  creative: {
    primary: '#7c3aed',
    secondary: '#5b21b6',
    accent: '#8b5cf6',
    background: '#faf5ff',
    text: '#2d1b69',
    light: '#e9d5ff'
  },
  nature: {
    primary: '#059669',
    secondary: '#047857',
    accent: '#10b981',
    background: '#f0fdf4',
    text: '#064e3b',
    light: '#d1fae5'
  },
  sunset: {
    primary: '#ea580c',
    secondary: '#c2410c',
    accent: '#f97316',
    background: '#fff7ed',
    text: '#9a3412',
    light: '#fed7aa'
  }
};

export class PowerPointGenerator {
  private pptx: PptxGenJS;
  private colorScheme: any;

  constructor(colorScheme: keyof typeof colorSchemes = 'professional') {
    this.pptx = new PptxGenJS();
    this.colorScheme = colorSchemes[colorScheme];
  }

  async generatePowerPoint(data: PowerPointData): Promise<Buffer> {
    // Set presentation properties
    this.pptx.defineLayout({ name: 'WIDE', width: 13.33, height: 7.5 });
    this.pptx.layout = 'WIDE';
    this.pptx.author = 'EduGenius AI';
    this.pptx.company = 'EduGenius';
    this.pptx.subject = data.subject;
    this.pptx.title = data.title;

    // Add slides
    for (const slideData of data.slides) {
      await this.addSlide(slideData, data);
    }

    // Generate the PowerPoint file
    const buffer = await (this.pptx as any).write('nodebuffer');
    return buffer as Buffer;
  }

  private async addSlide(slideData: SlideData, presentationData: PowerPointData) {
    const slide = this.pptx.addSlide();

    // Set slide background
    slide.background = { color: this.colorScheme.background };

    switch (slideData.slideType) {
      case 'title':
        await this.addTitleSlide(slide, slideData, presentationData);
        break;
      case 'content':
        await this.addContentSlide(slide, slideData);
        break;
      case 'image':
        await this.addImageSlide(slide, slideData);
        break;
      case 'chart':
        await this.addChartSlide(slide, slideData);
        break;
      case 'video':
        await this.addVideoSlide(slide, slideData);
        break;
      case 'interactive':
        await this.addInteractiveSlide(slide, slideData);
        break;
      case 'summary':
        await this.addSummarySlide(slide, slideData, presentationData);
        break;
      default:
        await this.addContentSlide(slide, slideData);
    }

    // Add slide number
    slide.addText(`Slide ${slideData.order}`, {
      x: 12.5,
      y: 6.8,
      fontSize: 10,
      color: this.colorScheme.text,
      align: 'right'
    });
  }

  private async addTitleSlide(slide: any, slideData: SlideData, presentationData: PowerPointData) {
    // Main title
    slide.addText(slideData.title || presentationData.title, {
      x: 1,
      y: 2,
      w: 11.33,
      h: 1.5,
      fontSize: 48,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center',
      valign: 'middle'
    });

    // Subtitle
    slide.addText(presentationData.topic, {
      x: 1,
      y: 3.8,
      w: 11.33,
      h: 0.8,
      fontSize: 24,
      color: this.colorScheme.secondary,
      align: 'center',
      valign: 'middle'
    });

    // Subject and Grade info
    slide.addText(`${presentationData.subject} • ${presentationData.grade}`, {
      x: 1,
      y: 4.8,
      w: 11.33,
      h: 0.5,
      fontSize: 16,
      color: this.colorScheme.text,
      align: 'center',
      valign: 'middle'
    });

    // Duration info
    slide.addText(`${presentationData.duration} minutes`, {
      x: 1,
      y: 5.5,
      w: 11.33,
      h: 0.5,
      fontSize: 14,
      color: this.colorScheme.accent,
      align: 'center',
      valign: 'middle'
    });

    // Add decorative elements
    slide.addShape('rect', {
      x: 0.5,
      y: 1.5,
      w: 12.33,
      h: 0.1,
      fill: { color: this.colorScheme.primary },
      line: { color: this.colorScheme.primary }
    });

    slide.addShape('rect', {
      x: 0.5,
      y: 6,
      w: 12.33,
      h: 0.1,
      fill: { color: this.colorScheme.primary },
      line: { color: this.colorScheme.primary }
    });
  }

  private async addContentSlide(slide: any, slideData: SlideData) {
    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'left'
    });

    // Content
    const contentLines = slideData.content.split('\n').filter(line => line.trim());
    let yPosition = 1.5;
    
    for (const line of contentLines) {
      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        // Bullet point
        slide.addText('• ' + line.trim().substring(1), {
          x: 0.8,
          y: yPosition,
          w: 11.8,
          h: 0.4,
          fontSize: 18,
          color: this.colorScheme.text,
          align: 'left'
        });
        yPosition += 0.5;
      } else if (line.trim().startsWith('#')) {
        // Heading
        slide.addText(line.trim().substring(1), {
          x: 0.5,
          y: yPosition,
          w: 12.33,
          h: 0.6,
          fontSize: 22,
          bold: true,
          color: this.colorScheme.secondary,
          align: 'left'
        });
        yPosition += 0.7;
      } else if (line.trim()) {
        // Regular text
        slide.addText(line.trim(), {
          x: 0.5,
          y: yPosition,
          w: 12.33,
          h: 0.4,
          fontSize: 16,
          color: this.colorScheme.text,
          align: 'left'
        });
        yPosition += 0.5;
      }
    }

    // Add visual elements if suggested
    if (slideData.visualSuggestions.length > 0) {
      await this.addVisualElements(slide, slideData.visualSuggestions);
    }
  }

  private async addImageSlide(slide: any, slideData: SlideData) {
    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center'
    });

    // Generate placeholder image
    const imageBuffer = await this.generatePlaceholderImage(slideData.title, slideData.visualSuggestions[0] || 'Educational content');
    
    slide.addImage({
      data: imageBuffer,
      x: 2,
      y: 1.5,
      w: 9.33,
      h: 4,
      sizing: { type: 'contain', w: 9.33, h: 4 }
    });

    // Content below image
    if (slideData.content) {
      slide.addText(slideData.content, {
        x: 0.5,
        y: 5.8,
        w: 12.33,
        h: 1,
        fontSize: 16,
        color: this.colorScheme.text,
        align: 'center'
      });
    }
  }

  private async addChartSlide(slide: any, slideData: SlideData) {
    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center'
    });

    // Generate sample chart data based on content
    const chartData = this.generateChartData(slideData.content);
    
    slide.addChart('bar', {
      x: 1,
      y: 1.5,
      w: 10.33,
      h: 4,
      data: chartData,
      options: {
        showTitle: false,
        showLegend: true,
        colors: [this.colorScheme.primary, this.colorScheme.secondary, this.colorScheme.accent]
      }
    });
  }

  private async addVideoSlide(slide: any, slideData: SlideData) {
    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center'
    });

    // Video placeholder
    slide.addShape('rect', {
      x: 2,
      y: 1.5,
      w: 9.33,
      h: 4,
      fill: { color: this.colorScheme.light },
      line: { color: this.colorScheme.primary, width: 2 }
    });

    // Play button
    slide.addShape('circle', {
      x: 5.5,
      y: 3,
      w: 2,
      h: 2,
      fill: { color: this.colorScheme.primary },
      line: { color: this.colorScheme.primary }
    });

    slide.addText('▶', {
      x: 5.5,
      y: 3,
      w: 2,
      h: 2,
      fontSize: 24,
      color: 'white',
      align: 'center',
      valign: 'middle'
    });

    // Video description
    slide.addText(slideData.content || 'Video content will be displayed here', {
      x: 0.5,
      y: 5.8,
      w: 12.33,
      h: 1,
      fontSize: 16,
      color: this.colorScheme.text,
      align: 'center'
    });
  }

  private async addInteractiveSlide(slide: any, slideData: SlideData) {
    // Title
    slide.addText(slideData.title, {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center'
    });

    // Interactive content box
    slide.addShape('rect', {
      x: 1,
      y: 1.5,
      w: 11.33,
      h: 4,
      fill: { color: this.colorScheme.background },
      line: { color: this.colorScheme.primary, width: 2 }
    });

    slide.addText('Interactive Activity', {
      x: 1,
      y: 2,
      w: 11.33,
      h: 0.8,
      fontSize: 20,
      bold: true,
      color: this.colorScheme.secondary,
      align: 'center'
    });

    slide.addText(slideData.content || 'Interactive content will be displayed here', {
      x: 1.5,
      y: 3,
      w: 10.33,
      h: 2,
      fontSize: 16,
      color: this.colorScheme.text,
      align: 'center',
      valign: 'middle'
    });

    // Add interactive elements
    slide.addShape('rect', {
      x: 2,
      y: 5.2,
      w: 3,
      h: 0.8,
      fill: { color: this.colorScheme.primary },
      line: { color: this.colorScheme.primary }
    });

    slide.addText('Option A', {
      x: 2,
      y: 5.2,
      w: 3,
      h: 0.8,
      fontSize: 14,
      color: 'white',
      align: 'center',
      valign: 'middle'
    });

    slide.addShape('rect', {
      x: 5,
      y: 5.2,
      w: 3,
      h: 0.8,
      fill: { color: this.colorScheme.secondary },
      line: { color: this.colorScheme.secondary }
    });

    slide.addText('Option B', {
      x: 5,
      y: 5.2,
      w: 3,
      h: 0.8,
      fontSize: 14,
      color: 'white',
      align: 'center',
      valign: 'middle'
    });

    slide.addShape('rect', {
      x: 8,
      y: 5.2,
      w: 3,
      h: 0.8,
      fill: { color: this.colorScheme.accent },
      line: { color: this.colorScheme.accent }
    });

    slide.addText('Option C', {
      x: 8,
      y: 5.2,
      w: 3,
      h: 0.8,
      fontSize: 14,
      color: 'white',
      align: 'center',
      valign: 'middle'
    });
  }

  private async addSummarySlide(slide: any, slideData: SlideData, presentationData: PowerPointData) {
    // Title
    slide.addText(slideData.title || 'Summary', {
      x: 0.5,
      y: 0.5,
      w: 12.33,
      h: 0.8,
      fontSize: 28,
      bold: true,
      color: this.colorScheme.primary,
      align: 'center'
    });

    // Key points
    const keyPoints = slideData.content.split('\n').filter(line => line.trim());
    let yPosition = 1.5;
    
    for (let i = 0; i < keyPoints.length && i < 6; i++) {
      const point = keyPoints[i].trim();
      if (point) {
        slide.addText(`• ${point}`, {
          x: 1,
          y: yPosition,
          w: 11.33,
          h: 0.4,
          fontSize: 18,
          color: this.colorScheme.text,
          align: 'left'
        });
        yPosition += 0.5;
      }
    }

    // Thank you message
    slide.addText('Thank you for your attention!', {
      x: 0.5,
      y: 5.5,
      w: 12.33,
      h: 0.8,
      fontSize: 24,
      bold: true,
      color: this.colorScheme.secondary,
      align: 'center'
    });

    // Contact info
    slide.addText('Questions? Contact: teacher@school.edu', {
      x: 0.5,
      y: 6.5,
      w: 12.33,
      h: 0.5,
      fontSize: 14,
      color: this.colorScheme.accent,
      align: 'center'
    });
  }

  private async addVisualElements(slide: any, suggestions: string[]) {
    // Add decorative shapes based on suggestions
    suggestions.forEach((suggestion, index) => {
      if (suggestion.toLowerCase().includes('chart') || suggestion.toLowerCase().includes('graph')) {
        slide.addShape('rect', {
          x: 9 + (index * 0.5),
          y: 6,
          w: 0.3,
          h: 0.8,
          fill: { color: this.colorScheme.accent }
        });
      } else if (suggestion.toLowerCase().includes('icon') || suggestion.toLowerCase().includes('symbol')) {
        slide.addShape('circle', {
          x: 9 + (index * 0.5),
          y: 6.2,
          w: 0.3,
          h: 0.3,
          fill: { color: this.colorScheme.primary }
        });
      }
    });
  }

  private async generatePlaceholderImage(title: string, description: string): Promise<Buffer> {
    const canvas = createCanvas(800, 600);
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, this.colorScheme.background);
    gradient.addColorStop(1, this.colorScheme.light);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Title
    ctx.fillStyle = this.colorScheme.primary;
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(title, 400, 200);

    // Description
    ctx.fillStyle = this.colorScheme.text;
    ctx.font = '24px Arial';
    ctx.fillText(description, 400, 300);

    // Decorative elements
    ctx.fillStyle = this.colorScheme.accent;
    ctx.beginPath();
    ctx.arc(200, 150, 50, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = this.colorScheme.secondary;
    ctx.beginPath();
    ctx.arc(600, 450, 30, 0, 2 * Math.PI);
    ctx.fill();

    return canvas.toBuffer('image/png');
  }

  private generateChartData(content: string): any {
    // Extract numbers or create sample data based on content
    const numbers = content.match(/\d+/g);
    const sampleData = numbers ? numbers.slice(0, 5).map(Number) : [10, 20, 15, 25, 30];
    
    return [
      { name: 'Category 1', values: [sampleData[0] || 10] },
      { name: 'Category 2', values: [sampleData[1] || 20] },
      { name: 'Category 3', values: [sampleData[2] || 15] },
      { name: 'Category 4', values: [sampleData[3] || 25] },
      { name: 'Category 5', values: [sampleData[4] || 30] }
    ];
  }
}

export async function generateRealPowerPoint(data: PowerPointData): Promise<Buffer> {
  const generator = new PowerPointGenerator('professional');
  return await generator.generatePowerPoint(data);
}
