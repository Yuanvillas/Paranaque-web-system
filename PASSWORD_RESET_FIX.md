# Password Reset Email Link Fix

## Problem
The password reset email link was hardcoded to `https://paranaque-web-system.onrender.com`, which prevented the reset password page from loading if:
- The frontend is deployed on a different domain
- The backend is deployed on a different domain  
- Environment variables don't match the actual deployment URLs

## Solution
Updated the backend to use dynamic environment variables instead of hardcoded URLs. This allows proper configuration for different deployment environments (local, staging, production).

## Environment Variables Required

Add these to your `.env` file or Render environment variables:

```env
# Backend Configuration
BACKEND_URL=https://paranaque-web-system.onrender.com

# Frontend Configuration - CRITICAL FIX
FRONTEND_URL=https://paranaque-web-system.onrender.com
```

### For Render Deployment:
1. Go to your Render project dashboard
2. Go to **Settings** → **Environment**
3. Add/update these variables:
   - `BACKEND_URL`: Your backend API URL (e.g., `https://your-backend.onrender.com`)
   - `FRONTEND_URL`: Your frontend URL (e.g., `https://your-frontend.onrender.com`)

**⚠️ IMPORTANT:** If your frontend is served from a different domain than the backend, `FRONTEND_URL` MUST point to the frontend domain.

### For Local Development:
```env
BACKEND_URL=http://localhost:5050
FRONTEND_URL=http://localhost:3000
```

## What Was Fixed

### 1. **Email Verification Links**
- ✅ Now uses `${BACKEND_URL}` instead of hardcoded URL
- Verification emails will redirect to correct backend

### 2. **Password Reset Email Links**
- ✅ Now uses `${BACKEND_URL}` instead of hardcoded URL
- Email contains clickable reset link with correct domain

### 3. **Password Reset Redirect**
- ✅ Backend `/api/auth/reset-password/:token` route now redirects to `${FRONTEND_URL}/reset-password`
- Allows frontend to be on different domain than backend

### 4. **Error Redirects**
- ✅ All error redirects use `${FRONTEND_URL}`
- Token errors, server errors now redirect to correct frontend

## Password Reset Flow (Now Fixed)

1. **User requests reset** → Frontend sends email to backend
2. **Backend sends email** → Email contains link to `${BACKEND_URL}/api/auth/reset-password/{token}`
3. **User clicks email link** → Browser navigates to backend URL
4. **Backend validates token** → Redirects to `${FRONTEND_URL}/reset-password?token={token}&email={email}`
5. **Frontend loads reset form** → User enters new password
6. **Frontend submits** → Backend updates password
7. **Success** → User redirected to login page

## Testing the Fix

### Step 1: Verify Environment Variables
Check your Render dashboard or local `.env`:
```
BACKEND_URL=<your-backend-domain>
FRONTEND_URL=<your-frontend-domain>
```

### Step 2: Request Password Reset
1. Go to login page
2. Click "Forgot Password"
3. Enter your email
4. Check your email for reset link

### Step 3: Click Email Link
- Link should be in format: `{BACKEND_URL}/api/auth/reset-password/{token}`
- Should redirect to: `{FRONTEND_URL}/reset-password?token={token}&email={email}`

### Step 4: Reset Password
1. Page should load with your email displayed
2. Enter new password (min 8 chars, uppercase, lowercase, number, special char)
3. Confirm password
4. Click "Reset Password"
5. Should redirect to login page

## Files Modified

- `backend/routes/authRoutes.js`
  - Added `BACKEND_URL` and `FRONTEND_URL` constants
  - Updated `/register` verification email
  - Updated `/verify/:token` redirect
  - Updated `/forgot-password` reset email
  - Updated `/reset-password/:token` redirect

## Troubleshooting

### "Invalid Token" Error
- Token may have expired (1 hour limit)
- Try requesting a new password reset

### Can't Access Reset Password Page
- Check if `FRONTEND_URL` is correct in environment variables
- Browser should redirect to `{FRONTEND_URL}/reset-password`

### Email Not Received
- Check spam/junk folder
- Verify `RESEND_API_KEY` is set
- Check backend logs for email send errors

### Wrong Domain in Email Link
- Verify `BACKEND_URL` in environment variables
- Redeploy after updating environment variables
- Check Render environment settings were saved

## Next Steps

1. **Update Environment Variables**
   - Render: Settings → Environment → Add `FRONTEND_URL`
   - Local: Update `.env` file

2. **Redeploy**
   - Push changes to trigger Render redeploy
   - Or manually redeploy in Render dashboard

3. **Test Password Reset Flow**
   - Follow "Testing the Fix" steps above

4. **Verify in Production**
   - Request a test password reset
   - Click email link and complete reset
