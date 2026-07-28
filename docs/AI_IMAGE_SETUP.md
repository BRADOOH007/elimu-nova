# AI Image & Presentation Generation Setup

This guide will help you set up AI-powered image generation and enhanced presentations in your ElimuNova AI platform.

## Features Added

✅ **Image Generation**
- DALL-E 3 (OpenAI) - High quality educational images
- Stable Diffusion (via Replicate) - Cost-effective alternative
- Stability AI - Direct API integration
- Auto-fallback between providers

✅ **Enhanced Presentations**
- AI-generated slide images
- Multiple layout options (content, image, split)
- Professional themes
- Automatic content parsing

✅ **User Interfaces**
- Teacher dashboard: `/teacher/ai-tools`
- Student dashboard: `/student/ai-tools`
- Easy-to-use image generator
- Interactive presentation builder

## API Keys Required

### 1. OpenAI (for DALL-E 3)
- Sign up at: https://platform.openai.com/
- Get API key from: https://platform.openai.com/api-keys
- Cost: ~$0.04-0.08 per image
- Best for: High-quality educational illustrations

### 2. Replicate (for Stable Diffusion)
- Sign up at: https://replicate.com/
- Get API token from: https://replicate.com/account/api-tokens
- Cost: ~$0.002-0.01 per image
- Best for: Bulk image generation

### 3. Stability AI (Alternative)
- Sign up at: https://platform.stability.ai/
- Get API key from: https://platform.stability.ai/account/keys
- Cost: ~$0.002-0.01 per image
- Best for: Direct API access

## Setup Instructions

### Step 1: Update Environment Variables

Add these keys to your `.env` file:

```env
# Image Generation APIs
OPENAI_DALLE_API_KEY="your-openai-api-key-here"
STABILITY_API_KEY="your-stability-ai-key-here"
REPLICATE_API_TOKEN="your-replicate-token-here"
```

**Note:** You can use any combination of these. The system will auto-fallback if one fails.

### Step 2: Install Dependencies (if needed)

The following packages should already be installed:
- `openai` - For DALL-E 3
- `pptxgenjs` - For PowerPoint generation

If not installed, run:
```bash
npm install openai pptxgenjs
```

### Step 3: Restart Development Server

```bash
npm run dev
```

### Step 4: Access the Tools

**For Teachers:**
Navigate to: `http://localhost:3000/teacher/ai-tools`

**For Students:**
Navigate to: `http://localhost:3000/student/ai-tools`

## Usage Guide

### Image Generator

1. **Enter a prompt**: Describe the image you want
2. **Select style**: Educational, Diagram, Natural, or Vivid
3. **Choose provider**: Auto (recommended), DALL-E, or Stable Diffusion
4. **Set size**: Square, Landscape, or Portrait
5. **Click Generate**: Wait 5-30 seconds
6. **Download**: Save the generated image

**Example Prompts:**
- "A colorful diagram showing the water cycle"
- "An educational illustration of the solar system"
- "A simple diagram of plant photosynthesis"
- "A visual representation of mathematical fractions"

### Presentation Generator

1. **Enter title**: Name your presentation
2. **Choose theme**: Education, Modern, or Professional
3. **Enable AI images**: Toggle to generate images for slides
4. **Add slides**: Create multiple slides with content
5. **Set layouts**: Choose content, image, or split layout
6. **Generate**: Click to create and download PowerPoint

**Features:**
- Multiple slide layouts
- AI-generated images per slide
- Custom image prompts
- Professional themes
- Automatic formatting

## Cost Estimates

### DALL-E 3 (OpenAI)
- Standard quality: $0.040 per image
- HD quality: $0.080 per image
- Best for: High-quality, important images

### Stable Diffusion (Replicate)
- ~$0.002-0.01 per image
- Best for: Bulk generation, testing

### Stability AI
- ~$0.002-0.01 per image
- Best for: Direct API control

## API Endpoints Created

### Image Generation
```
POST /api/ai/generate-image
Body: {
  prompt: string
  style?: 'educational' | 'diagram' | 'natural' | 'vivid'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  provider?: 'dalle' | 'stability' | 'auto'
}
```

### Presentation Generation
```
POST /api/ai/generate-presentation
Body: {
  title: string
  slides: Array<{
    title: string
    content: string[]
    imagePrompt?: string
    layout: 'title' | 'content' | 'image' | 'split'
  }>
  generateImages?: boolean
  imageStyle?: string
  theme?: 'education' | 'modern' | 'professional'
}
```

## Files Created

### Core Services
- `src/lib/image-generation.ts` - Image generation service
- `src/lib/presentation-generator.ts` - Enhanced presentation service

### API Routes
- `src/app/api/ai/generate-image/route.ts` - Image generation endpoint
- `src/app/api/ai/generate-presentation/route.ts` - Presentation endpoint

### UI Components
- `src/components/ai/image-generator.tsx` - Image generator UI
- `src/components/ai/presentation-generator.tsx` - Presentation builder UI

### Pages
- `src/app/teacher/ai-tools/page.tsx` - Teacher tools page
- `src/app/student/ai-tools/page.tsx` - Student tools page

## Troubleshooting

### "API key not configured"
- Make sure you've added the API keys to `.env`
- Restart the development server after adding keys

### "Failed to generate image"
- Check your API key is valid
- Verify you have credits/quota remaining
- Try a different provider

### Images not appearing in presentations
- Ensure `generateImages` is set to `true`
- Check that slides have `layout: 'image'` or `layout: 'split'`
- Verify image generation is working independently first

### Slow generation
- Image generation takes 5-30 seconds per image
- Presentations with images can take 1-2 minutes per slide
- Consider using "standard" quality instead of "hd"

## Best Practices

1. **Start with Auto provider**: Let the system choose the best available
2. **Use educational style**: Best for classroom content
3. **Test with one image first**: Before generating full presentations
4. **Monitor costs**: Track API usage in provider dashboards
5. **Cache images**: Save generated images for reuse

## Next Steps

1. Add API keys to `.env`
2. Test image generation with a simple prompt
3. Create a test presentation
4. Add navigation links to teacher/student dashboards
5. Train users on the new features

## Support

For issues or questions:
- Check API provider status pages
- Review console logs for errors
- Verify API keys are correct
- Ensure sufficient API credits

---

**Generated by ElimuNova AI Setup**
