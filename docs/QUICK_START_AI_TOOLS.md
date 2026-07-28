# Quick Start: AI Image & Presentation Tools

Get started with AI-powered image generation and presentations in 5 minutes!

## 🚀 Quick Setup (3 Steps)

### Step 1: Get Your API Keys (Choose One or More)

#### Option A: OpenAI (DALL-E 3) - Recommended for Quality
1. Go to https://platform.openai.com/signup
2. Navigate to API Keys: https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Copy the key (starts with `sk-...`)

#### Option B: Replicate - Recommended for Cost
1. Go to https://replicate.com/signin
2. Navigate to API Tokens: https://replicate.com/account/api-tokens
3. Copy your token (starts with `r8_...`)

#### Option C: Stability AI - Alternative
1. Go to https://platform.stability.ai/
2. Navigate to API Keys: https://platform.stability.ai/account/keys
3. Create and copy your key

### Step 2: Add Keys to .env File

Open your `.env` file and add:

```env
# Add at least ONE of these (or all three for auto-fallback)
OPENAI_DALLE_API_KEY="sk-your-openai-key-here"
REPLICATE_API_TOKEN="r8_your-replicate-token-here"
STABILITY_API_KEY="sk-your-stability-key-here"
```

**💡 Tip:** You only need ONE key to get started. The system will auto-fallback if you have multiple.

### Step 3: Restart Server

```bash
npm run dev
```

## ✅ You're Ready!

### For Teachers
Visit: **http://localhost:3000/teacher/ai-tools**

### For Students
Visit: **http://localhost:3000/student/ai-tools**

---

## 🎨 Using the Image Generator

### Basic Usage
1. Enter a description: "A diagram of the water cycle"
2. Click "Generate Image"
3. Wait 5-30 seconds
4. Download your image!

### Pro Tips
- **Educational Style**: Best for classroom diagrams
- **Diagram Style**: Perfect for technical illustrations
- **Natural Style**: Realistic photos
- **Vivid Style**: Colorful, engaging images

### Example Prompts
```
✅ "A colorful diagram showing the water cycle with labels"
✅ "An educational illustration of the solar system"
✅ "A simple diagram of plant photosynthesis process"
✅ "A visual representation of fractions: 1/2, 1/4, 3/4"
✅ "An illustration of the human heart with labeled parts"
```

---

## 📊 Using the Presentation Generator

### Quick Presentation (3 Steps)
1. **Enter Title**: "Introduction to Photosynthesis"
2. **Add Slides**: Click "Add Slide" and fill in content
3. **Generate**: Click "Generate & Download Presentation"

### With AI Images (4 Steps)
1. Enter title and add slides
2. **Toggle "Generate AI Images"** to ON
3. Choose slide layout: "Split" or "Image"
4. (Optional) Add custom image prompts
5. Generate and wait 1-2 minutes per slide

### Slide Layouts
- **Content Only**: Text-based slides
- **Full Image**: Large image with title
- **Split**: Content on left, image on right

### Example Slide Structure
```
Slide 1: "What is Photosynthesis?"
- Process plants use to make food
- Requires sunlight, water, and CO2
- Produces oxygen and glucose
Layout: Split (content + image)
Image Prompt: "A diagram showing photosynthesis process in a leaf"

Slide 2: "Key Components"
- Chloroplasts contain chlorophyll
- Stomata allow gas exchange
- Roots absorb water
Layout: Content Only
```

---

## 💰 Cost Comparison

| Provider | Cost per Image | Best For |
|----------|---------------|----------|
| **DALL-E 3** | $0.04-0.08 | High quality, important images |
| **Replicate** | $0.002-0.01 | Bulk generation, testing |
| **Stability AI** | $0.002-0.01 | Direct API control |

**💡 Recommendation:** Start with Replicate for testing, use DALL-E for final presentations.

---

## 🎯 Common Use Cases

### For Teachers
1. **Lesson Illustrations**: Generate diagrams for lesson plans
2. **Presentation Slides**: Create visual presentations quickly
3. **Worksheet Images**: Add images to assignments
4. **Study Materials**: Create visual study guides

### For Students
1. **Project Presentations**: Create professional slides
2. **Report Images**: Add relevant illustrations
3. **Study Aids**: Generate visual learning materials
4. **Creative Projects**: Bring ideas to life

---

## 🔧 Troubleshooting

### "API key not configured"
**Solution:** Add at least one API key to `.env` and restart server

### "Failed to generate image"
**Solutions:**
- Check API key is valid
- Verify you have credits remaining
- Try a different provider (if you have multiple keys)
- Simplify your prompt

### Images not in presentation
**Solutions:**
- Make sure "Generate AI Images" toggle is ON
- Use "Image" or "Split" layout for slides
- Test image generation separately first

### Generation is slow
**Normal:** 
- Images: 5-30 seconds each
- Presentations with images: 1-2 minutes per slide

**Speed Tips:**
- Use "standard" quality instead of "hd"
- Generate images separately first
- Use Replicate for faster generation

---

## 📱 Navigation

### Teacher Dashboard
Look for **"AI Tools (Images & PPT)"** in the sidebar

### Student Dashboard
Look for **"AI Tools (Images & PPT)"** in the sidebar

---

## 🎓 Best Practices

### Image Generation
1. ✅ Be specific in prompts
2. ✅ Use "educational" style for classroom content
3. ✅ Test with one image before bulk generation
4. ✅ Save good prompts for reuse
5. ✅ Download and organize generated images

### Presentations
1. ✅ Plan your slides before generating
2. ✅ Use consistent layouts
3. ✅ Write clear, concise content points
4. ✅ Test without images first
5. ✅ Add custom image prompts for better results

---

## 📊 Example Workflow

### Creating a Science Presentation

**Step 1: Plan** (2 minutes)
- Title: "The Water Cycle"
- 5 slides: Intro, Evaporation, Condensation, Precipitation, Collection

**Step 2: Build** (5 minutes)
- Add title and slides
- Write 3-4 bullet points per slide
- Choose "Split" layout for visual slides

**Step 3: Generate** (5-10 minutes)
- Toggle "Generate AI Images" ON
- Select "Educational" style
- Click generate
- Wait for completion

**Step 4: Download & Use**
- Download PowerPoint file
- Open and review
- Make any final edits
- Present to class!

**Total Time: ~15 minutes** (vs. hours manually)

---

## 🆘 Need Help?

### Check These First
1. API keys are in `.env` file
2. Server has been restarted
3. You have API credits remaining
4. Prompts are clear and specific

### Still Having Issues?
- Check browser console for errors
- Review server logs
- Test API keys directly on provider websites
- Try a different provider

---

## 🎉 Success Checklist

- [ ] API key(s) added to `.env`
- [ ] Server restarted
- [ ] Can access `/teacher/ai-tools` or `/student/ai-tools`
- [ ] Generated first test image
- [ ] Created first test presentation
- [ ] Navigation links visible in sidebar

**All checked?** You're ready to create amazing educational content! 🚀

---

**Need the full setup guide?** See `AI_IMAGE_SETUP.md`
