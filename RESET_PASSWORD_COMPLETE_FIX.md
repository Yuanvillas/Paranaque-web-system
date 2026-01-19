# Password Reset Link - Complete Debugging & Fix Guide

## Problem Summary
When clicking the password reset email link, you get: `"Page not found"` error with `buildPath": "/opt/render/project/src/build"`

This happens because:
1. React frontend is being built to `/src/build` instead of `/build` (root level)
2. Backend can't find the React build files, so it can't serve `index.html`
3. Without `index.html`, React Router can't load the reset password page

## The Three Issues Found

### Issue 1: ❌ Wrong Build Directory Path
**File:** `render.yaml`
**Problem:** Build command creates build folder in wrong location
```yaml
# OLD (WRONG):
buildCommand: npm install && npm run build && cd backend && npm install
# Build goes to: /opt/render/project/src/build
```

**Solution:** Move build folder to correct location
```yaml
# NEW (FIXED):
buildCommand: npm install && npm run build && mv build ../build && cd backend && npm install
# Build goes to: /opt/render/project/build
```

### Issue 2: ❌ Wrong Package Proxy
**File:** `package.json`
**Problem:** Proxy pointed to backend API instead of dev server
```json
// OLD (WRONG):
"proxy": "https://paranaque-web-system.onrender.com"
```

**Solution:** Remove proxy (not needed for production build)
```json
// NEW (FIXED):
// Remove the proxy line entirely
```

### Issue 3: ❌ Missing Environment Variables in Render
**File:** `render.yaml`
**Problem:** BACKEND_URL and FRONTEND_URL weren't set in Render dashboard

**Solution:** Added to render.yaml
```yaml
envVars:
  - key: BACKEND_URL
    value: https://paranaque-web-system.onrender.com
  - key: FRONTEND_URL
    value: https://paranaque-web-system.onrender.com
```

## How the Password Reset Link Flow Works (Now Fixed)

```
1. User clicks email link
   ↓
2. URL: https://paranaque-web-system.onrender.com/api/auth/reset-password/{token}
   ↓
3. Backend verifies token using BACKEND_URL
   ↓
4. Backend redirects to: {FRONTEND_URL}/reset-password?token={token}&email={email}
   ↓
5. Browser requests: https://paranaque-web-system.onrender.com/reset-password?...
   ↓
6. Backend serves index.html from /build folder (NOT /src/build)
   ↓
7. React Router loads ResetPassword component
   ↓
8. User sees reset password form ✅
```

## Files Modified

1. **render.yaml**
   - Fixed build command to move build folder to root
   - Added BACKEND_URL environment variable
   - Added FRONTEND_URL environment variable

2. **package.json**
   - Removed incorrect proxy setting

3. **backend/routes/authRoutes.js** (already fixed in previous step)
   - Using BACKEND_URL and FRONTEND_URL environment variables
   - All redirects now use environment variables

## Step-by-Step Fix Instructions

### Step 1: Verify Local Changes
Check these files are updated:
- ✅ `render.yaml` - has `mv build ../build` in buildCommand
- ✅ `render.yaml` - has BACKEND_URL and FRONTEND_URL env vars
- ✅ `package.json` - no "proxy" line
- ✅ `backend/routes/authRoutes.js` - uses BACKEND_URL and FRONTEND_URL

### Step 2: Push to GitHub
```bash
git add render.yaml package.json backend/routes/authRoutes.js
git commit -m "Fix password reset link - correct build path and env variables"
git push origin main
```

### Step 3: Verify Render Environment (DO NOT SKIP!)
1. Go to Render Dashboard: https://dashboard.render.com
2. Click on **paranaque-web-system** service
3. Go to **Settings** → **Environment**
4. Verify these variables exist:
   - `BACKEND_URL`: `https://paranaque-web-system.onrender.com`
   - `FRONTEND_URL`: `https://paranaque-web-system.onrender.com`
   - If they're not there, Render's environment will override the yaml file

### Step 4: Redeploy
1. After pushing changes, Render should auto-deploy
2. Or manually trigger:
   - Render Dashboard → paranaque-web-system → Manual Deploy
3. Wait for deployment to finish (watch logs)

### Step 5: Test Password Reset Flow
1. Go to login page: `https://paranaque-web-system.onrender.com`
2. Click "Forgot Password"
3. Enter test email
4. Check your email for reset link
5. Click the link in email
   - Should redirect to: `https://paranaque-web-system.onrender.com/reset-password?token=...`
   - Should see the reset password form ✅
6. Enter new password and submit
7. Should redirect to login page

## Troubleshooting

### Still Getting "Page not found" Error?

**Check 1: Build Path**
- Deploy logs should show: `/opt/render/project/build` (NOT `/opt/render/project/src/build`)
- View Render logs:
  - Dashboard → paranaque-web-system → Logs
  - Look for: `Build path: /opt/render/project/build`

**Check 2: Environment Variables**
- Render Dashboard → Settings → Environment
- Verify BACKEND_URL and FRONTEND_URL are set
- If using render.yaml only (not dashboard), they should be auto-set

**Check 3: Static File Serving**
- Backend server.js should serve React build
- Check if build folder exists after deployment
- Render logs should show: `📁 Build path: /opt/render/project/build`

**Check 4: CORS Issue**
- If you see CORS error, it's not the main issue (your link is a GET redirect, not CORS)
- But can verify in backend logs

### Email Link Has Wrong Domain?

If email shows wrong domain:
- Old emails were sent before the fix
- Request a NEW password reset after deployment
- New emails will use correct BACKEND_URL

### Can't See Reset Password Form But No Error?

Possible causes:
1. React component failed to load - check browser console (F12)
2. Token in URL is invalid - token expires in 1 hour
3. Email wasn't saved to database - check backend logs

## Key Changes Summary

| File | Problem | Fix |
|------|---------|-----|
| render.yaml | Build in wrong folder | Add `mv build ../build` |
| render.yaml | Missing env vars | Add BACKEND_URL & FRONTEND_URL |
| package.json | Wrong proxy config | Remove proxy line |
| authRoutes.js | Hardcoded URLs | Use env variables (✅ already done) |

## Testing Checklist

- [ ] render.yaml has correct buildCommand with `mv build ../build`
- [ ] render.yaml has BACKEND_URL and FRONTEND_URL
- [ ] package.json does NOT have "proxy" line
- [ ] Changes pushed to GitHub
- [ ] Render deployment completed successfully
- [ ] Backend logs show correct build path
- [ ] Can access login page
- [ ] Can request password reset email
- [ ] Email contains correct link with BACKEND_URL
- [ ] Clicking email link redirects to reset-password page
- [ ] Can see reset password form
- [ ] Can submit new password
- [ ] Can log in with new password

## Questions to Check If Still Having Issues

1. **What error do you see?** (Screenshot helps)
2. **What does the email link look like?** (Should start with `https://paranaque-web-system.onrender.com/api/auth/reset-password/`)
3. **What does the Render deployment log show?** (Look for build path and any errors)
4. **Is your Render environment variables UI showing BACKEND_URL/FRONTEND_URL?** (Or are you using render.yaml only?)
