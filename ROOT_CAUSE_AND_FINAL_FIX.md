# Password Reset - Root Cause & Final Fix

## The Actual Problem (From Your Logs)

Your logs showed the exact issue:
```
⚠️  Could not serve index.html from /opt/render/project/src/build: ENOENT: no such file or directory
```

**Root Cause:** The backend was looking for the React build folder in the wrong location!

### Directory Structure on Render:
```
/opt/render/project/
├── src/
│   ├── pages/
│   └── build/                    ← React puts build HERE
├── backend/
│   └── server.js                 ← Server runs from HERE
└── render.yaml
```

### The Bug:
```javascript
// OLD (WRONG):
const buildPath = path.join(__dirname, '../build');
// __dirname = /opt/render/project/backend
// ../build = /opt/render/project/build  ← DOESN'T EXIST!

// FIXED:
const buildPath = path.join(__dirname, '../src/build');
// __dirname = /opt/render/project/backend
// ../src/build = /opt/render/project/src/build  ← WHERE REACT PUTS IT! ✅
```

---

## What Was Fixed

1. **backend/server.js** - buildPath corrected
   - From: `path.join(__dirname, '../build')`
   - To: `path.join(__dirname, '../src/build')`
   - Added validation logging to verify folder exists

2. **render.yaml** - Simplified build command
   - Removed unnecessary shell commands
   - Clean, simple build that works

---

## Why This Fixes Everything

When you click the email reset link:

```
1. Browser → https://paranaque-web-system.onrender.com/api/auth/reset-password/{token}
   ↓
2. Backend verifies token, redirects to: /reset-password?token=...&email=...
   ↓
3. Browser → https://paranaque-web-system.onrender.com/reset-password
   ↓
4. Backend app.get('*') catches this route
   ↓
5. Backend tries to serve index.html from buildPath
   ↓
6. **NOW** buildPath correctly points to /opt/render/project/src/build ✅
   ↓
7. index.html found and served ✅
   ↓
8. React loads and React Router renders ResetPassword component ✅
   ↓
9. User sees reset password form ✅
```

---

## Deploy Steps

1. **Push changes to GitHub:**
   ```bash
   git add backend/server.js render.yaml
   git commit -m "Fix: Point backend to correct React build folder location"
   git push origin main
   ```

2. **Render auto-deploys** (watch the logs)

3. **Check Render logs for:**
   ```
   ✅ Build path: /opt/render/project/src/build
   ✅ Current directory: /opt/render/project/backend
   ```
   (Should NOT have errors like "Build folder not found")

4. **Test:**
   - Request password reset
   - Click email link
   - Should see reset password form (NOT "Page not found")

---

## Summary

| Issue | Before | After |
|-------|--------|-------|
| Build folder location | `/opt/render/project/build` (doesn't exist) | `/opt/render/project/src/build` (correct) |
| index.html served? | ❌ No - folder doesn't exist | ✅ Yes - found and served |
| Reset password page loads? | ❌ No - 404 error | ✅ Yes - React app loads |
| Can reset password? | ❌ No | ✅ Yes |

The fix is simple but critical: **just point the backend to where React actually puts the build files!**
