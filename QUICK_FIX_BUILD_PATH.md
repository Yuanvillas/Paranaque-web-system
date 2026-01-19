# Quick Fix - Correct Build Path

## Issue
The build path was pointing to `/opt/render/project/src/src/build` (double src!) instead of `/opt/render/project/build`.

## Root Cause
When running `npm run build` from the project root directory, React creates:
```
/opt/render/project/build/
```

NOT:
```
/opt/render/project/src/build/
```

## The Fix
Changed buildPath in `backend/server.js`:
```javascript
// BEFORE (WRONG):
const buildPath = path.join(__dirname, '../src/build');

// AFTER (CORRECT):
const buildPath = path.join(__dirname, '../build');
```

## Deploy
```bash
git add backend/server.js
git commit -m "Fix: Correct buildPath to point to root /build folder"
git push origin main
```

## Expected Result
After redeployment:
- Render should show: `📁 Build path: /opt/render/project/build`
- Reset password page should load
- No more "Page not found" error
