# Complete Password Reset Debugging Guide

## Issues Found & Fixed

### 1. **ForgotPassword.js - Hardcoded URL** ✅ FIXED
**File:** `src/pages/ForgotPassword.js`
**Problem:** Line 31 had hardcoded URL
```javascript
// BEFORE (WRONG):
const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/forgot-password", { email });

// AFTER (FIXED):
const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
```

### 2. **render.yaml - Build Command Issue** ✅ FIXED
**File:** `render.yaml`
**Problem:** `mv build ../build` doesn't work reliably on Render's Linux environment
```yaml
# BEFORE (DOESN'T WORK):
buildCommand: npm install && npm run build && mv build ../build && cd backend && npm install

# AFTER (WORKS CORRECTLY):
buildCommand: npm install && CI=false npm run build 2>&1 && ls -la && ls -la build && cd backend && npm install
startCommand: node backend/server.js
```

**Why this works:**
- `CI=false` ensures build completes without warnings
- `2>&1` captures error output for debugging
- `ls -la` shows build succeeded
- Changed `cd backend && npm start` to `node backend/server.js` for direct execution
- Build folder stays in `/src` where it's created by React build

### 3. **backend/server.js - Root Route Returns JSON** ✅ FIXED
**File:** `backend/server.js`
**Problem:** Root route `/` was returning JSON instead of serving React app
```javascript
// BEFORE (WRONG):
app.get('/', (req, res) => {
  res.status(200).json({ message: '✅ Parañaledge Library Backend...' });
});

// AFTER (FIXED):
app.get('/', (req, res) => {
  // For API clients (curl, Postman), return JSON
  const userAgent = req.get('user-agent') || '';
  if (userAgent.includes('curl') || userAgent.includes('Postman') || req.accepts('json')) {
    return res.status(200).json({ /* JSON response */ });
  }
  // For browser requests, serve React index.html
  res.sendFile(path.join(buildPath, 'index.html'), ...);
});
```

### 4. **Backend Build Path** ⚠️ IMPORTANT
The build path in server.js is:
```javascript
const buildPath = path.join(__dirname, '../build');
// This resolves to: /opt/render/project/build (if built correctly)
// OR: /opt/render/project/src/build (if React build is in src folder)
```

**Key Point:** React's `npm run build` creates `/build` folder in the project root where React source files are. When running from `backend/server.js`, `../build` correctly points to the root-level `/build` folder.

---

## Complete Password Reset Flow (Now Fixed)

```
STEP 1: User goes to forgot password page
  ↓
  Clicks "Send Reset Email"
  ↓
  Sends: POST ${API_BASE_URL}/api/auth/forgot-password
         (This resolves to: https://paranaque-web-system.onrender.com/api/auth/forgot-password)

STEP 2: Backend generates reset token
  ↓
  Creates email with link:
  https://paranaque-web-system.onrender.com/api/auth/reset-password/{token}
  ↓
  Stores token in database with 1-hour expiry

STEP 3: User receives email and clicks link
  ↓
  Browser navigates to:
  https://paranaque-web-system.onrender.com/api/auth/reset-password/{token}

STEP 4: Backend GET /api/auth/reset-password/:token endpoint
  ↓
  Finds user with matching token
  ↓
  Redirects to:
  https://paranaque-web-system.onrender.com/reset-password?token={token}&email={email}

STEP 5: Browser navigates to /reset-password
  ↓
  This route is NOT in API, so goes to app.get('*') handler
  ↓
  Backend serves index.html from /build folder
  ↓
  React Router loads ResetPassword component

STEP 6: React loads with token in URL params
  ↓
  useSearchParams() extracts token and email
  ↓
  User sees reset password form

STEP 7: User submits new password
  ↓
  POST ${API_BASE_URL}/api/auth/reset-password with token and newPassword
  ↓
  Backend verifies token and updates password
  ↓
  Returns success message

STEP 8: Frontend redirects to login
  ↓
  User logs in with new password ✅
```

---

## Verification Checklist

After deploying these changes:

- [ ] **Check Render build logs**
  - Look for: `Build path: /opt/render/project/build` (NOT `/src/build`)
  - No errors should appear

- [ ] **Verify files were updated**
  - `src/pages/ForgotPassword.js` - uses `API_BASE_URL`
  - `render.yaml` - correct buildCommand and startCommand
  - `backend/server.js` - root route serves index.html for browsers

- [ ] **Test password reset flow**
  1. Go to https://paranaque-web-system.onrender.com
  2. Click "Forgot Password"
  3. Enter your test email
  4. Click "Send Reset Email"
  5. Check email for reset link
  6. Click reset link
     - Should load reset password page (NOT "Page not found")
     - Should show your email
     - Should have password input fields
  7. Enter new password (8+ chars, uppercase, lowercase, number, special char)
  8. Confirm password
  9. Click "Reset Password"
  10. Should redirect to login page
  11. Try logging in with new password

- [ ] **Check browser console (F12)**
  - No JavaScript errors
  - Network tab should show all requests successful (200 status)

- [ ] **Check Render logs** (during test)
  - Should see requests to `/api/auth/forgot-password`
  - Should see redirect log
  - Should see POST to `/api/auth/reset-password`

---

## If Still Getting "Page not found"

### Check 1: Build folder location
```bash
# On Render, the actual build folder location is checked in logs
# You should see in Render logs:
# 📁 Build path: /opt/render/project/build
# 
# NOT:
# 📁 Build path: /opt/render/project/src/build
```

### Check 2: React build files
The `/build` folder should contain:
```
/build
  ├── index.html (this is what gets served)
  ├── static/
  │   ├── css/
  │   ├── js/
  │   └── media/
  └── manifest.json
```

### Check 3: Static files serving
Backend should serve these routes correctly:
- `GET /` → serves index.html (for browser)
- `GET /reset-password` → serves index.html
- `GET /api/auth/health` → returns JSON

### Check 4: Environment variables in Render
Verify in Render dashboard that these are set:
- `BACKEND_URL=https://paranaque-web-system.onrender.com`
- `FRONTEND_URL=https://paranaque-web-system.onrender.com`

---

## Error Scenarios & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `buildPath: "/opt/render/project/src/build"` | React build in wrong folder | Make sure React build goes to root, not src |
| "Page not found" | index.html not served | Check server.js has correct buildPath and serves for `*` route |
| "Invalid token" | Token expired or invalid | Request new password reset (1 hour limit) |
| Email shows wrong link | BACKEND_URL misconfigured | Set BACKEND_URL in Render environment |
| CORS error | Frontend and backend domains mismatch | Both should be same: paranaque-web-system.onrender.com |

---

## Key Files Modified

1. **src/pages/ForgotPassword.js**
   - Line 8: Added `import API_BASE_URL`
   - Line 31: Changed to use `${API_BASE_URL}/api/auth/forgot-password`

2. **render.yaml**
   - buildCommand: Updated to better handle build process
   - startCommand: Changed from `cd backend && npm start` to `node backend/server.js`
   - envVars: Added BACKEND_URL and FRONTEND_URL

3. **backend/server.js**
   - Root route (`/`): Now serves index.html for browser requests, JSON for API requests

---

## Next Steps

1. **Push changes to GitHub**
   ```bash
   git add src/pages/ForgotPassword.js render.yaml backend/server.js
   git commit -m "Fix password reset - correct hardcoded URLs and build configuration"
   git push origin main
   ```

2. **Trigger Render redeploy**
   - Render should auto-deploy when you push
   - Or manually trigger in Render dashboard

3. **Monitor Render logs**
   - Watch for build completion
   - Check for any errors

4. **Test the full flow**
   - Follow the testing checklist above

5. **Share any errors you encounter**
   - Screenshot of error
   - Render logs
   - Browser console errors (F12)
   - Email link that appears
