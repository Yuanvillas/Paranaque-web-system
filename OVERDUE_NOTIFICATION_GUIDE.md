# Overdue Book Notification System - Complete Setup Guide

## Overview
Your library system now has a complete overdue book notification system that automatically sends email notifications to users when their borrowed books are overdue. The system includes:

- ✅ Automatic email notifications for overdue books
- ✅ Support for single and bulk notifications
- ✅ Customizable notification rules
- ✅ Email tracking and reminder flags
- ✅ Batch processing for mass notifications
- ✅ Scheduled task support

---

## Features Implemented

### 1. Email Service Extensions (`backend/utils/emailService.js`)
Two new email functions have been added:

#### `sendOverdueNotificationEmail(userEmail, bookTitle, dueDate, daysOverdue)`
Sends a single overdue book notification with:
- Professional HTML template
- Book title and due date
- Number of days overdue
- Instructions for return and renewal

**Example:**
```javascript
const { sendOverdueNotificationEmail } = require('./utils/emailService');

await sendOverdueNotificationEmail(
  'user@example.com',
  'The Great Gatsby',
  '2026-01-23',
  7
);
```

#### `sendOverdueReminderEmail(userEmail, booksData)`
Sends a bulk notification for multiple overdue books with:
- Table of all overdue books
- Warning about account suspension
- Contact information for assistance

**Example:**
```javascript
const { sendOverdueReminderEmail } = require('./utils/emailService');

await sendOverdueReminderEmail(
  'user@example.com',
  [
    { bookTitle: 'Book 1', dueDate: '2026-01-23', daysOverdue: 7 },
    { bookTitle: 'Book 2', dueDate: '2026-01-20', daysOverdue: 10 }
  ]
);
```

---

### 2. API Endpoints (`backend/routes/transactionRoutes.js`)

#### Check Overdue Books
**GET** `/api/transactions/overdue/all`
- Returns all overdue books in the system
- Shows book title, user email, due date, and days overdue
- Useful for admin dashboard

**Response:**
```json
{
  "message": "Found 5 overdue book(s)",
  "count": 5,
  "overdue": [
    {
      "transactionId": "...",
      "bookTitle": "The Great Gatsby",
      "userEmail": "user@example.com",
      "dueDate": "2026-01-23",
      "daysOverdue": 7,
      "reminderSent": false
    }
  ]
}
```

#### Check Overdue for Specific User
**GET** `/api/transactions/overdue/user/:email`
- Returns all overdue books for a specific user
- Example: `/api/transactions/overdue/user/john@example.com`

**Response:**
```json
{
  "message": "User john@example.com has 2 overdue book(s)",
  "count": 2,
  "overdue": [...]
}
```

#### Send Overdue Notification to User
**POST** `/api/transactions/overdue/notify/:email`
- Sends overdue notification email to a specific user
- Example: `/api/transactions/overdue/notify/john@example.com`

**Request Body (optional):**
```json
{
  "sendEmail": true,
  "markReminderSent": true
}
```

**Response:**
```json
{
  "message": "Overdue notification sent to john@example.com",
  "overdueCount": 2,
  "emailsSent": 1,
  "emailResults": [...],
  "books": [
    { "title": "Book 1", "dueDate": "2026-01-23" },
    { "title": "Book 2", "dueDate": "2026-01-20" }
  ]
}
```

#### Batch Send to All Overdue Users
**POST** `/api/transactions/overdue/notify-all`
- Sends notifications to all users with overdue books
- Most efficient for mass notifications

**Request Body (optional):**
```json
{
  "sendEmails": true,
  "markReminderSent": true,
  "daysOverdueMinimum": 1
}
```

**Response:**
```json
{
  "message": "Sent overdue notifications to 15/15 users",
  "notificationsQueued": 15,
  "userCount": 15,
  "overdueCount": 23,
  "results": [
    {
      "userEmail": "user@example.com",
      "success": true,
      "bookCount": 2,
      "messageId": "..."
    }
  ]
}
```

---

### 3. Scheduled Notification Scheduler (`backend/utils/overdueNotificationScheduler.js`)

A utility module for automated, scheduled notifications.

#### `checkAndNotifyOverdue(options)`
Checks for overdue books and optionally sends notifications.

**Parameters:**
```javascript
{
  sendEmails: false,           // Actually send emails (dry-run if false)
  markReminderSent: false,     // Mark transactions as notified
  daysOverdueMinimum: 1,       // Only notify if X+ days overdue
  daysOverdueMaximum: null,    // Optional: don't notify if too old
  excludePreviouslySent: true  // Skip if already notified
}
```

**Usage Example:**
```javascript
const { checkAndNotifyOverdue } = require('./utils/overdueNotificationScheduler');

// Dry run (preview what would be sent)
const preview = await checkAndNotifyOverdue({
  sendEmails: false,
  daysOverdueMinimum: 1
});
console.log(preview);

// Actually send notifications
const result = await checkAndNotifyOverdue({
  sendEmails: true,
  markReminderSent: true,
  daysOverdueMinimum: 1
});
```

#### `getOverdueStatistics()`
Returns statistics about overdue books.

**Returns:**
```json
{
  "success": true,
  "statistics": {
    "totalOverdue": 23,
    "byDaysOverdue": {
      "7": 5,
      "14": 8,
      "21": 10
    },
    "byUser": {
      "user1@example.com": 2,
      "user2@example.com": 3
    },
    "requiresNotification": 15
  }
}
```

---

## Setup Instructions

### 1. Update Transaction Model (if needed)
The `reminderSent` field already exists in your Transaction model to track which transactions have received notifications.

### 2. Email Configuration
Make sure your `.env` file has:
```
RESEND_API_KEY=your_resend_api_key_here
```

### 3. Test the System
```bash
# Test sending a notification to a specific user
curl -X POST http://localhost:5050/api/transactions/overdue/notify/test@example.com \
  -H "Content-Type: application/json" \
  -d '{"sendEmail": true, "markReminderSent": false}'
```

---

## Usage Scenarios

### Scenario 1: Send Daily Overdue Reminders
Use a cron job to run daily:

```javascript
// In a separate file or as a cron task
const { checkAndNotifyOverdue } = require('./utils/overdueNotificationScheduler');

async function dailyOverdueCheck() {
  const result = await checkAndNotifyOverdue({
    sendEmails: true,
    markReminderSent: true,
    daysOverdueMinimum: 1,
    excludePreviouslySent: true  // Only notify once per overdue book
  });
  
  console.log(`Daily check complete: ${result.emailsSent.length} notifications sent`);
}

// Schedule with node-cron or similar
// Run every day at 9:00 AM
```

### Scenario 2: Manual Notification from Admin Dashboard
```javascript
// User clicks "Send Overdue Notice" button
const response = await fetch('/api/transactions/overdue/notify/user@example.com', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ sendEmail: true, markReminderSent: true })
});
```

### Scenario 3: Check Overdue Statistics for Admin Dashboard
```javascript
const { getOverdueStatistics } = require('./utils/overdueNotificationScheduler');
const stats = await getOverdueStatistics();
// Display in admin dashboard
```

### Scenario 4: Weekly Bulk Notification Campaign
```javascript
// Send to all overdue users once per week
const result = await checkAndNotifyOverdue({
  sendEmails: true,
  markReminderSent: false,  // Keep false to send reminders multiple times
  daysOverdueMinimum: 7,    // Only for 7+ days overdue
  excludePreviouslySent: false  // Send even if already notified
});
```

---

## Email Templates

### Single Book Overdue Email
- Professional layout with red warning
- Book title, due date, days overdue
- Clear instructions for return/renewal
- Library contact information

### Bulk Overdue Email
- Table of all overdue books with due dates
- Warning about account suspension
- Total count of overdue items
- Instructions for bulk return

---

## Database Fields

The system uses these Transaction model fields:
- `endDate` - Due date for the book
- `reminderSent` - Boolean flag tracking if reminder was sent
- `status` - Transaction status (must be 'active' for overdue check)
- `type` - Transaction type (must be 'borrow')
- `userEmail` - User's email for sending notifications

---

## Implementation Checklist

- [x] Email service extended with overdue functions
- [x] API endpoints for checking overdue books
- [x] Single user notification endpoint
- [x] Batch notification endpoint
- [x] Scheduled task utility module
- [x] Logging of all notification attempts
- [x] Professional email templates
- [x] Support for marking reminders as sent
- [x] Statistics and monitoring

---

## Best Practices

1. **Dry Run First**: Always run with `sendEmails: false` to preview what will be sent
2. **Schedule Wisely**: Send notifications during business hours
3. **Avoid Spamming**: Use `excludePreviouslySent: true` for regular checks
4. **Monitor Logs**: Check logs to verify emails were sent successfully
5. **Grace Period**: Consider allowing 1-3 day grace period before first notification
6. **Progressive Escalation**: Send more urgent messages for older overdue books

---

## Troubleshooting

### Emails Not Sending
- Check `RESEND_API_KEY` in `.env`
- Verify user email addresses are valid
- Check server logs for Resend errors
- Use dry-run to test without sending

### Notifications Not Appearing
- Check `reminderSent` flag in database
- Verify transaction `status` is 'active'
- Verify transaction `type` is 'borrow'
- Ensure `endDate` is in the past

### High Email Volume
- Implement rate limiting
- Use batch processing
- Stagger notifications throughout the day
- Consider weekly vs. daily frequency

---

## Next Steps

1. **Add Cron Job**: Integrate with node-cron or similar for automated daily checks
2. **Admin Dashboard**: Create UI for viewing overdue books and sending notifications
3. **Email Templates**: Customize templates with your library branding
4. **Escalation Rules**: Add different messages based on days overdue
5. **SMS Fallback**: Add SMS notifications for long-overdue items

---

## Questions or Issues?

The system is fully documented with:
- JSDoc comments in all functions
- Comprehensive error handling
- Detailed logging throughout
- Example usage patterns

Start with testing individual endpoints, then implement scheduled notifications.
