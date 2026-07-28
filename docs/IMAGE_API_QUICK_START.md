# Image API Quick Start Guide

## 🚀 Fastest Setup (5 minutes)

### Step 1: Choose Your Provider

**Recommended for beginners: Stability AI (Free tier)**

### Step 2: Get API Key

1. Go to: https://platform.stability.ai/
2. Click "Sign Up" (top right)
3. Sign up with email or Google
4. Verify your email
5. Go to: https://platform.stability.ai/account/keys
6. Click "Create API Key"
7. Name it: "ElimuNova"
8. Copy the key (starts with `sk-`)

### Step 3: Add to .env

Open your `.env` file and update:

```env
STABILITY_API_KEY="sk-paste-your-key-here"
```

### Step 4: Restart Server

Stop your dev server (Ctrl+C) and restart:
```bash
npm run dev
```

### Step 5: Test It

Run the test script:
```bash
npm run test:image-api
```

You should see: ✅ Stability AI: Working!

### Step 6: Try in App

1. Login as teacher
2. Go to "AI Tools"
3. Click "Image Generator"
4. Enter: "A colorful diagram of the water cycle"
5. Click "Generate"

---

## 📊 Provider Comparison

| Provider | Free Tier | Cost | Quality | Speed |
|----------|-----------|------|---------|-------|
| **Stability AI** | 25 images | $10/mo for 1000 | Good | Fast |
| **Replicate** | $0 | ~$0.002/image | Good | Fast |
| **OpenAI DALL-E** | No | $0.04/image | Best | Medium |

---

## 💰 Cost Examples

### Light Usage (10 images/day)
- **Stability AI**: Free tier covers 2-3 days, then $10/month
- **Replicate**: ~$0.60/month
- **OpenAI**: ~$12/month

### Medium Usage (50 images/day)
- **Stability AI**: $10-20/month
- **Replicate**: ~$3/month
- **OpenAI**: ~$60/month

### Heavy Usage (200 images/day)
- **Stability AI**: $50-100/month
- **Replicate**: ~$12/month
- **OpenAI**: ~$240/month

---

## 🔑 Where to Get API Keys

### Stability AI (Recommended)
- Website: https://platform.stability.ai/
- Keys: https://platform.stability.ai/account/keys
- Docs: https://platform.stability.ai/docs

### Replicate (Most Affordable)
- Website: https://replicate.com/
- Keys: https://replicate.com/account/api-tokens
- Docs: https://replicate.com/docs

### OpenAI DALL-E (Best Quality)
- Website: https://platform.openai.com/
- Keys: https://platform.openai.com/api-keys
- Docs: https://platform.openai.com/docs/guides/images

---

## ⚠️ Important Notes

1. **Never share your API keys**
2. **Don't commit .env to git** (already in .gitignore)
3. **Set spending limits** in each platform
4. **Monitor usage** regularly
5. **Restart server** after adding keys

---

## 🆘 Troubleshooting

### "API key not found"
- Check .env file has the key
- Restart development server
- No quotes or spaces around the key

### "Invalid API key"
- Copy the full key (including prefix)
- Check for typos
- Verify key hasn't been deleted

### "Quota exceeded"
- Free tier limit reached
- Add payment method
- Wait for monthly reset

### "Images not generating"
- Check browser console for errors
- Run: `npm run test:image-api`
- Verify API service is online

---

## 📞 Need Help?

1. Check IMAGE_API_SETUP_GUIDE.md for detailed instructions
2. Run test script: `npm run test:image-api`
3. Check provider status pages
4. Review error messages in browser console

---

## ✅ Checklist

- [ ] Signed up for API provider
- [ ] Got API key
- [ ] Added key to .env file
- [ ] Restarted development server
- [ ] Ran test script successfully
- [ ] Tested in application
- [ ] Set spending limits
- [ ] Bookmarked usage dashboard
