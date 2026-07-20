# Image Generation API Setup Guide

This guide will help you set up API keys for image generation in your ElimuNova AI application.

---

## Option 1: OpenAI DALL-E (Recommended for Quality)

### Features:
- High-quality, realistic images
- Good understanding of complex prompts
- Best for educational illustrations

### Pricing:
- DALL-E 3: $0.040 per image (1024×1024)
- DALL-E 2: $0.020 per image (1024×1024)

### Setup Steps:

1. **Create OpenAI Account**
   - Go to https://platform.openai.com/signup
   - Sign up with your email

2. **Add Payment Method**
   - Go to https://platform.openai.com/account/billing
   - Add a credit card (required for API access)
   - Set usage limits to control costs

3. **Generate API Key**
   - Go to https://platform.openai.com/api-keys
   - Click "Create new secret key"
   - Name it: "ElimuNova-Image-Generation"
   - Copy the key (starts with `sk-...`)
   - **IMPORTANT**: Save it immediately - you won't see it again!

4. **Add to .env**
   ```env
   OPENAI_DALLE_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
   ```

5. **Test the API**
   - Run the test script (see below)

### Cost Management:
- Set monthly budget limits in OpenAI dashboard
- Monitor usage at https://platform.openai.com/usage
- Start with $5-10 monthly limit for testing

---

## Option 2: Stability AI (Good Balance)

### Features:
- Fast generation
- Multiple models (Stable Diffusion)
- Good for artistic/creative images
- More affordable than DALL-E

### Pricing:
- Free tier: 25 credits (25 images)
- Paid: $10/month for 1,000 credits

### Setup Steps:

1. **Create Account**
   - Go to https://platform.stability.ai/
   - Sign up with email or Google

2. **Get API Key**
   - Go to https://platform.stability.ai/account/keys
   - Click "Create API Key"
   - Name it: "ElimuNova"
   - Copy the key (starts with `sk-...`)

3. **Add to .env**
   ```env
   STABILITY_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxx"
   ```

4. **Choose a Plan** (Optional)
   - Free tier: 25 credits to start
   - Professional: $10/month for 1,000 credits
   - Go to https://platform.stability.ai/account/billing

---

## Option 3: Replicate (Most Affordable)

### Features:
- Pay-per-use (no subscription)
- Access to multiple AI models
- Very affordable
- Good for high-volume usage

### Pricing:
- ~$0.0023 per image (Stable Diffusion)
- ~$0.01 per image (SDXL)
- Only pay for what you use

### Setup Steps:

1. **Create Account**
   - Go to https://replicate.com/signin
   - Sign up with GitHub or email

2. **Add Payment Method**
   - Go to https://replicate.com/account/billing
   - Add credit card
   - No minimum charge - pay only for usage

3. **Get API Token**
   - Go to https://replicate.com/account/api-tokens
   - Copy your default token (starts with `r8_...`)
   - Or create a new token

4. **Add to .env**
   ```env
   REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxxxxxxx"
   ```

---

## Recommended Setup for Different Budgets

### Budget: Free/Testing
```env
# Use Stability AI free tier (25 images)
STABILITY_API_KEY="your-stability-key"
```

### Budget: Low ($5-10/month)
```env
# Use Replicate (most affordable)
REPLICATE_API_TOKEN="your-replicate-token"
```

### Budget: Medium ($20-50/month)
```env
# Use Stability AI Professional
STABILITY_API_KEY="your-stability-key"
# Backup with Replicate
REPLICATE_API_TOKEN="your-replicate-token"
```

### Budget: High Quality Needed
```env
# Use OpenAI DALL-E for best quality
OPENAI_DALLE_API_KEY="your-openai-key"
# Backup with Stability AI
STABILITY_API_KEY="your-stability-key"
```

---

## Complete .env Configuration

After getting your API keys, your .env should look like:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/edugenius_ai?schema=public"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="edugenius-ai-secret-key-2024"

# AI Text Generation (OpenRouter)
OPENAI_API_KEY="sk-or-v1-...your-key-here..."

# Image Generation APIs (Choose at least one)
OPENAI_DALLE_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxx"
STABILITY_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxx"
REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxxxxxxx"
```

---

## Testing Your Setup

### Test Script
Create a test file to verify your API keys work:

```bash
# Run the image generation test
npm run test:image-api
```

Or manually test in the app:
1. Go to Teacher Dashboard
2. Click "AI Tools"
3. Try "Image Generator"
4. Enter a prompt: "A colorful diagram of the solar system"
5. Click "Generate Image"

---

## Security Best Practices

1. **Never commit .env files**
   - Already in .gitignore
   - Double-check before pushing code

2. **Use environment variables in production**
   - Set them in your hosting platform (Vercel, Railway, etc.)
   - Don't hardcode API keys

3. **Rotate keys regularly**
   - Change keys every 3-6 months
   - Immediately rotate if exposed

4. **Set usage limits**
   - Configure spending limits in each platform
   - Monitor usage regularly

5. **Use separate keys for dev/production**
   - Different keys for testing vs production
   - Easier to track and manage

---

## Troubleshooting

### "Invalid API Key" Error
- Check if key is copied correctly (no extra spaces)
- Verify key hasn't expired
- Ensure billing is set up (for paid APIs)

### "Quota Exceeded" Error
- Check your usage limits
- Add more credits or upgrade plan
- Wait for quota reset (usually monthly)

### "Rate Limit" Error
- Too many requests too quickly
- Add delays between requests
- Upgrade to higher tier plan

### Images Not Generating
- Check browser console for errors
- Verify API key is in .env
- Restart development server after adding keys
- Check API service status pages

---

## Cost Optimization Tips

1. **Cache Generated Images**
   - Save images to avoid regenerating
   - Store in database or cloud storage

2. **Use Lower Resolution for Previews**
   - Generate smaller images first
   - Only create high-res when needed

3. **Batch Requests**
   - Generate multiple images at once
   - Some APIs offer batch discounts

4. **Choose Right Provider**
   - DALL-E: Best quality, highest cost
   - Stability AI: Good balance
   - Replicate: Most affordable

5. **Monitor Usage**
   - Set up alerts for spending
   - Review usage weekly
   - Adjust limits as needed

---

## Next Steps

1. Choose your preferred API provider(s)
2. Sign up and get API key(s)
3. Add keys to .env file
4. Restart your development server
5. Test image generation in the app
6. Set up usage monitoring
7. Configure production environment variables

---

## Support Links

- **OpenAI**: https://help.openai.com/
- **Stability AI**: https://platform.stability.ai/docs
- **Replicate**: https://replicate.com/docs

---

## Quick Start (Recommended)

For fastest setup with free tier:

1. Go to https://platform.stability.ai/
2. Sign up (free)
3. Get API key from https://platform.stability.ai/account/keys
4. Add to .env: `STABILITY_API_KEY="your-key"`
5. Restart server: Stop and run `npm run dev`
6. Test in app: Teacher Dashboard → AI Tools → Image Generator

You'll get 25 free images to start!
