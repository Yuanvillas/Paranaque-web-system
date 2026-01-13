# 🚀 Render Environment Variables - Quick Reference

## How to Use This Guide

1. Go to: https://dashboard.render.com
2. Click on your backend service
3. Click "Environment" tab
4. Add/update each variable below
5. Click "Save Changes"
6. Wait 2-5 minutes for redeploy

---

## 📋 Environment Variables to Set

### Copy these EXACTLY:

```
GMAIL_USER=yuanvillas89@gmail.com
GMAIL_PASS=gnae rdti lzej rgdh
MONGO_URI=mongodb+srv://User:Library@cluster0.pteo7.mongodb.net/libraryDB
PORT=5050
EXPO_PUBLIC_SUPABASE_URL=https://rqseuhdpktquhlqojoqg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJxc2V1aGRwa3RxdWhscW9qb3FnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0Mjg3OTYsImV4cCI6MjA3NjAwNDc5Nn0.-4NHkB9A7duUm60V-vT_g0b0CwMfxk0bK5UcoerpDC0
AI_PROVIDER=mock
AI_ENDPOINT=https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent
GOOGLE_API_KEY=your_new_google_api_key_here
```

---

## 🎯 Key Settings Explained

| Variable | Purpose | Current Value |
|----------|---------|----------------|
| **AI_PROVIDER** | Which AI to use | `mock` (no API needed) |
| **GOOGLE_API_KEY** | Google Gemini key | `your_new_google_api_key_here` (placeholder) |
| **MONGO_URI** | Database connection | Your MongoDB cluster |
| **GMAIL_USER/PASS** | Email notifications | Your Gmail credentials |

---

## ✅ What This Fixes

- ✅ Removes leaked API key error
- ✅ AI chatbot works in mock mode
- ✅ Searches real MongoDB database
- ✅ Returns real books from inventory
- ✅ No API setup needed

---

## 🔄 After Saving

1. Render will **auto-redeploy** (2-5 minutes)
2. Watch the **"Deploys"** tab for status
3. Test chatbot at your Vercel URL once done
4. Click 💬 and ask "Find me a book"

---

## 🆘 If You Want Real Google AI Later

Replace `AI_PROVIDER=mock` with:
```
AI_PROVIDER=google
GOOGLE_API_KEY=[your_new_key_from_makersuite.google.com]
```

Then save and redeploy.

---

**Created:** December 18, 2025
**Status:** Ready for deployment
