#!/bin/bash
# Debug script to check password reset flow
# Run this after deployment to Render to verify the fix

echo "===== PARANAQUE PASSWORD RESET DEBUG ====="
echo ""
echo "1. Checking backend health..."
curl -s https://paranaque-web-system.onrender.com/health | jq . || curl https://paranaque-web-system.onrender.com/health
echo ""

echo "2. Checking if React build is being served..."
curl -s -I https://paranaque-web-system.onrender.com/ | head -10
echo ""

echo "3. Checking if /reset-password route loads the app..."
curl -s -I https://paranaque-web-system.onrender.com/reset-password | head -10
echo ""

echo "4. Checking build path on Render..."
curl -s https://paranaque-web-system.onrender.com/test | jq . || curl https://paranaque-web-system.onrender.com/test
echo ""

echo "✅ If all checks show 200 status, the app is serving correctly!"
echo ""
echo "Next steps:"
echo "1. Test password reset from frontend"
echo "2. Check browser console (F12) for any JavaScript errors"
echo "3. Check Render logs for any errors"
