# 🎯 Overdue Email Notification System - Implementation Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    OVERDUE NOTIFICATION SYSTEM                       │
└─────────────────────────────────────────────────────────────────────┘

                            User Actions
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
            Manual Trigger   Dashboard     Cron Job
            (API POST)        Button       (Daily)
                    │            │            │
                    └────────────┼────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Overdue Notification   │
                    │  Scheduler Module       │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Check Transactions     │
                    │  (status=active,       │
                    │   type=borrow,         │
                    │   endDate < today)     │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Group by User Email    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Send Notifications     │
                    │  ├─ 1 book: single      │
                    │  └─ 2+ books: bulk      │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Update Database        │
                    │  (reminderSent = true)  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  Log Activity           │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    Email Delivered to User
```

---

## 📊 Data Flow

```
Transaction Collection
├─ bookId: ObjectId
├─ userEmail: string ◄────────┐
├─ type: "borrow"             │
├─ status: "active"           │  1. Check for
├─ startDate: Date            │     overdue
├─ endDate: Date ◄──┐         │
│  (Due Date)       │ Compare │
├─ returnDate: null│ with     ├──► checkAndNotifyOverdue()
├─ reminderSent: false        │     ├─ Calculate days overdue
│                  ▲          │     ├─ Group by user
└─ ...             │          │     ├─ Send email
                   └──────────┘     └─ Update reminderSent
                                         │
                                         ▼
                                    Email Service
                                    ├─ sendOverdueNotificationEmail()
                                    └─ sendOverdueReminderEmail()
                                         │
                                         ▼
                                    Resend API
                                         │
                                         ▼
                                    User Email Inbox
```

---

## 🔌 API Endpoints Map

```
GET /api/transactions/overdue/all
└─ Returns: All overdue books with users
   └─ Used by: Admin dashboard, reports

GET /api/transactions/overdue/user/:email
└─ Returns: Overdue books for specific user
   └─ Used by: User profile, personal dashboard

POST /api/transactions/overdue/notify/:email
├─ Input: { sendEmail, markReminderSent }
├─ Actions: Send email, update database, log
└─ Used by: Admin action, single user notification

POST /api/transactions/overdue/notify-all
├─ Input: { sendEmails, markReminderSent, daysOverdueMinimum }
├─ Actions: Batch process all users, send bulk emails
└─ Used by: Scheduled jobs, mass campaigns
```

---

## 📧 Email Flow

```
┌─────────────────────────────────────────┐
│  Overdue Book Detected                  │
│  (endDate < today, status=active)       │
└────────────┬────────────────────────────┘
             │
             ├─ 1 Overdue Book
             │     │
             │     ▼
             │  sendOverdueNotificationEmail()
             │  ├─ Subject: "📚 Overdue Book Notification"
             │  ├─ Body:
             │  │  ├─ Book Title
             │  │  ├─ Due Date
             │  │  ├─ Days Overdue
             │  │  └─ Return Instructions
             │  └─ Send via Resend API
             │
             ├─ 2+ Overdue Books
             │     │
             │     ▼
             │  sendOverdueReminderEmail()
             │  ├─ Subject: "⚠️ Multiple Books Overdue"
             │  ├─ Body:
             │  │  ├─ Table of all books
             │  │  ├─ Days overdue for each
             │  │  ├─ Warning about suspension
             │  │  └─ Contact information
             │  └─ Send via Resend API
             │
             └─ User Receives Email
                 └─ Takes action (return book)
```

---

## 🗂️ File Structure

```
Paranaque-web-system-1/
│
├── backend/
│   ├── utils/
│   │   ├── emailService.js [MODIFIED]
│   │   │   ├─ sendReservationApprovedEmail()    [EXISTING]
│   │   │   ├─ sendReservationRejectedEmail()    [EXISTING]
│   │   │   ├─ sendReservationReminderEmail()    [EXISTING]
│   │   │   ├─ sendOverdueNotificationEmail()    [NEW] ◄─── Single book
│   │   │   └─ sendOverdueReminderEmail()        [NEW] ◄─── Multiple books
│   │   │
│   │   └─ overdueNotificationScheduler.js [NEW]
│   │       ├─ checkAndNotifyOverdue()       ◄─── Main function
│   │       └─ getOverdueStatistics()        ◄─── Stats function
│   │
│   └── routes/
│       └── transactionRoutes.js [MODIFIED]
│           ├─ GET /overdue/all              [NEW]
│           ├─ GET /overdue/user/:email      [NEW]
│           ├─ POST /overdue/notify/:email   [NEW]
│           └─ POST /overdue/notify-all      [NEW]
│
├── OVERDUE_NOTIFICATION_GUIDE.md            [NEW]
│   └─ Complete feature documentation
│
├── OVERDUE_EMAIL_NOTIFICATION_SUMMARY.md    [NEW]
│   └─ What was created & how to use
│
├── OVERDUE_NOTIFICATION_QUICK_REFERENCE.md  [NEW]
│   └─ Quick start & cheat sheet
│
└── backend/OVERDUE_NOTIFICATION_EXAMPLES.js [NEW]
    └─ 6 implementation options with code

Legend:
[EXISTING] = File already in your system
[MODIFIED] = File updated with new code
[NEW]      = File created by this implementation
```

---

## 🔄 Implementation Options

```
Option A: Automatic Daily (RECOMMENDED)
┌──────────────────┐
│  Cron Schedule   │
│  (Every day 9 AM)│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│ checkAndNotifyOverdue()          │
│ ├─ sendEmails: true              │
│ ├─ markReminderSent: true        │
│ ├─ daysOverdueMinimum: 1         │
│ └─ excludePreviouslySent: true   │
└────────┬─────────────────────────┘
         │
         ▼
    Send Emails


Option B: Manual Admin Button
┌──────────────────┐
│  Admin clicks    │
│  "Send Overdue"  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────┐
│  POST /notify-all                │
│  Body: { sendEmails: true }      │
└────────┬─────────────────────────┘
         │
         ▼
    Send Emails


Option C: Command Line
┌────────────────────────────────────┐
│  $ npm run overdue:send             │
│  or                                │
│  $ node scripts/send-overdue.js     │
└────────┬────────────────────────────┘
         │
         ▼
    Send Emails
```

---

## 📈 Usage Statistics

```
After implementation, you can track:

┌─────────────────────────────────────┐
│  Overdue Statistics                 │
├─────────────────────────────────────┤
│  Total Overdue Books:      47       │
│  ├─ 1-7 days:              12       │
│  ├─ 8-14 days:             18       │
│  └─ 15+ days:              17       │
│                                     │
│  By User:                           │
│  ├─ 1-2 books overdue:     35 users │
│  └─ 3+ books overdue:       8 users │
│                                     │
│  Notification Status:               │
│  ├─ Notified:               25      │
│  └─ Pending notification:   22      │
└─────────────────────────────────────┘
```

---

## 🔐 Data Safety

```
┌──────────────────────────────────────────┐
│  Transaction Processing                  │
├──────────────────────────────────────────┤
│                                          │
│  INPUT VALIDATION                        │
│  ├─ Check endDate < today                │
│  ├─ Check status = 'active'              │
│  ├─ Check type = 'borrow'                │
│  └─ Calculate daysOverdue                │
│                                          │
│  ERROR HANDLING                          │
│  ├─ Email failures don't crash system    │
│  ├─ All errors logged                    │
│  ├─ Continues processing other users     │
│  └─ Returns detailed error report        │
│                                          │
│  AUDIT TRAIL                             │
│  ├─ All notifications logged             │
│  ├─ Success/failure tracked              │
│  ├─ Timestamps recorded                  │
│  └─ User actions documented              │
│                                          │
│  DATABASE INTEGRITY                      │
│  ├─ No data loss on failures             │
│  ├─ reminderSent flag tracking           │
│  ├─ Transaction immutable history        │
│  └─ Rollback safe operations             │
│                                          │
└──────────────────────────────────────────┘
```

---

## 📱 Email Template Comparison

```
┌────────────────────────────────────────────────────────┐
│              SINGLE BOOK NOTIFICATION                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📚 Book Return Reminder                              │
│  ─────────────────────────────────                    │
│                                                        │
│  Book Title: The Great Gatsby                         │
│  Due Date: January 23, 2026                           │
│  Days Overdue: 7                                      │
│                                                        │
│  ✓ Return instructions                                │
│  ✓ Renewal option                                     │
│  ✓ Library contact info                               │
│                                                        │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│              MULTIPLE BOOKS NOTIFICATION               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ⚠️ Multiple Books Overdue                             │
│  ────────────────────────────────────────             │
│  You have 3 overdue book(s)                           │
│                                                        │
│  Book 1          | Due Date    | Overdue              │
│  ─────────────────────────────────────                │
│  The Great Gatsby| Jan 23      | 7 days               │
│  1984            | Jan 20      | 10 days              │
│  To Kill a Bird  | Jan 18      | 12 days              │
│                                                        │
│  ⚠️ Account suspension warning                         │
│  ✓ Contact for assistance                             │
│  ✓ Library phone & hours                              │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## ✅ Quality Checklist

```
FUNCTIONALITY
[✓] Detects overdue books correctly
[✓] Groups multiple books per user
[✓] Sends professional emails
[✓] Updates reminderSent flag
[✓] Logs all activities
[✓] Handles errors gracefully

FEATURES
[✓] Single user notifications
[✓] Batch user notifications
[✓] Dry-run mode for testing
[✓] Customizable rules
[✓] Statistics tracking
[✓] Date calculations

DOCUMENTATION
[✓] Complete setup guide
[✓] API endpoint documentation
[✓] Code examples
[✓] Implementation options
[✓] Quick reference
[✓] Troubleshooting guide

TESTING
[✓] API endpoints work
[✓] Email templates render
[✓] Database updates correct
[✓] Error handling tested
[✓] Dry-run functionality
[✓] Batch processing
```

---

## 🚀 Ready to Deploy

```
SETUP COMPLETE ✓
├─ Email service extended
├─ API endpoints created
├─ Scheduler module added
├─ Documentation complete
└─ Examples provided

TESTING DONE ✓
├─ Endpoints verified
├─ Email templates working
├─ Database updates correct
└─ Error handling confirmed

DEPLOYMENT READY ✓
├─ No database migration needed
├─ No breaking changes
├─ Backward compatible
└─ Production ready

NEXT STEP ►
Pick an implementation option and deploy!
```

---

## 📞 Quick Support

**Issue: Emails not sending?**
→ Check `.env` for `RESEND_API_KEY`

**Issue: Can't find overdue books?**
→ Verify transaction `status='active'` and `type='borrow'`

**Issue: Want to test without sending?**
→ Use `sendEmails: false` for dry-run

**Issue: Need help choosing implementation?**
→ See `backend/OVERDUE_NOTIFICATION_EXAMPLES.js`

---

Generated: January 30, 2026 | Status: ✅ Complete & Ready to Deploy
