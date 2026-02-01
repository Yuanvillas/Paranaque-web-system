# 📧 Overdue Notification System - Quick Reference Card

## 🎯 What You Got

A complete email notification system that sends overdue book reminders to library users.

---

## 🚀 Quick Start (2 minutes)

### Test It Right Now
```bash
# Check what overdue books exist
curl http://localhost:5050/api/transactions/overdue/all

# Send notification to one user
curl -X POST http://localhost:5050/api/transactions/overdue/notify/user@example.com \
  -H "Content-Type: application/json" \
  -d '{"sendEmail": true}'

# Send to ALL overdue users at once
curl -X POST http://localhost:5050/api/transactions/overdue/notify-all \
  -H "Content-Type: application/json" \
  -d '{"sendEmails": true}'
```

---

## 📋 API Endpoints Cheat Sheet

| What | URL | Type |
|------|-----|------|
| **View all overdue** | `/api/transactions/overdue/all` | GET |
| **View one user's overdue** | `/api/transactions/overdue/user/email@test.com` | GET |
| **Notify one user** | `/api/transactions/overdue/notify/email@test.com` | POST |
| **Notify everyone** | `/api/transactions/overdue/notify-all` | POST |

---

## 📧 Email Templates

### Single Book Email
```
Subject: 📚 Overdue Book Notification - Please Return Your Borrowed Book

Shows:
- Book title
- Due date
- Days overdue
- Return instructions
```

### Multiple Books Email
```
Subject: ⚠️ Multiple Books Overdue - Immediate Action Required

Shows:
- Table of all overdue books
- Days overdue for each
- Warning about account suspension
```

---

## 🔧 Make It Automatic (Pick One)

### Option A: Daily Auto-Emails (Recommended)
Add to `server.js`:
```javascript
const cron = require('node-cron');
const { checkAndNotifyOverdue } = require('./utils/overdueNotificationScheduler');

// Every day at 9:00 AM
cron.schedule('0 9 * * *', async () => {
  await checkAndNotifyOverdue({
    sendEmails: true,
    markReminderSent: true,
    daysOverdueMinimum: 1
  });
});
```

### Option B: Manual Button
Add button in admin dashboard that posts to:
```
POST /api/transactions/overdue/notify-all
```

### Option C: Command Line
```bash
node backend/scripts/sendOverdueNotifications.js send
```

---

## 💾 Database Info

**No migration needed!** Uses existing fields:
- `Transaction.endDate` - Due date
- `Transaction.reminderSent` - Track if notified
- `Transaction.status` - Must be 'active'
- `Transaction.type` - Must be 'borrow'

---

## 🧪 Test Checklist

- [ ] `curl /api/transactions/overdue/all` works
- [ ] Can see overdue books listed
- [ ] `POST /api/transactions/overdue/notify/:email` with `sendEmail: false` (dry run)
- [ ] `POST /api/transactions/overdue/notify/:email` with `sendEmail: true` (real)
- [ ] Check email received
- [ ] Check database - `reminderSent` should be updated

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `backend/utils/overdueNotificationScheduler.js` | Reusable scheduler logic |
| `OVERDUE_NOTIFICATION_GUIDE.md` | Complete feature guide |
| `OVERDUE_EMAIL_NOTIFICATION_SUMMARY.md` | This summary |

## 📝 Files Modified

| File | Changes |
|------|---------|
| `backend/utils/emailService.js` | +2 new email functions |
| `backend/routes/transactionRoutes.js` | +4 new endpoints |

---

## ⚡ Key Features

✅ Automatic detection of overdue books  
✅ Professional HTML email templates  
✅ Single or bulk notifications  
✅ Customizable rules  
✅ Dry-run mode for testing  
✅ Activity logging  
✅ Statistics tracking  
✅ Error handling  

---

## 🎨 Customize Emails

Edit in `backend/utils/emailService.js`:

Look for `sendOverdueNotificationEmail()` and `sendOverdueReminderEmail()` functions.

Change:
- Subject lines
- HTML content
- Library name/logo
- Contact information

---

## ❓ Common Tasks

### "Send me a dry-run first"
```json
POST /api/transactions/overdue/notify-all
{
  "sendEmails": false,
  "daysOverdueMinimum": 1
}
```

### "Only notify for 7+ days overdue"
```json
POST /api/transactions/overdue/notify-all
{
  "sendEmails": true,
  "daysOverdueMinimum": 7
}
```

### "Don't notify users I already notified"
```json
POST /api/transactions/overdue/notify/:email
{
  "sendEmail": true,
  "markReminderSent": true
}
```

---

## 📊 Monitor Overdue

Get statistics:
```javascript
const { getOverdueStatistics } = require('./utils/overdueNotificationScheduler');
const stats = await getOverdueStatistics();

// Shows:
// - Total overdue books
// - Books by user
// - Days overdue distribution
// - How many need notification
```

---

## 🔒 Safety Tips

1. Always test with `sendEmails: false` first
2. Start with small user groups
3. Check that Resend API is configured in `.env`
4. Review email logs after first run
5. Monitor user feedback about emails

---

## 📞 Documentation

Full guides available:
- `OVERDUE_NOTIFICATION_GUIDE.md` - Complete reference
- `backend/OVERDUE_NOTIFICATION_EXAMPLES.js` - Code examples

---

## ✅ Ready to Use

Your system is **production-ready**. Just:

1. ✅ Test the API endpoints
2. ✅ Verify emails send
3. ✅ Choose automation method
4. ✅ Customize email branding
5. ✅ Deploy!

**Questions?** Check the complete guide or code comments.

Good luck! 🎉
