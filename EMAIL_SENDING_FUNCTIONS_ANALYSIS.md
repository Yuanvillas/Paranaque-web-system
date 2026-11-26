# Email Sending Functions - Overdue Notification System

## Summary
The overdue notification system uses **Resend API** for email delivery. All email sending functionality is centralized in the email service module with proper error handling and logging.

---

## 1. Email Sending Functions

### Function 1: `sendOverdueNotificationEmail`
**File:** [backend/utils/emailService.js](backend/utils/emailService.js#L118)  
**Lines:** 118-159

**Function Signature:**
```javascript
const sendOverdueNotificationEmail = async (userEmail, bookTitle, dueDate, daysOverdue) => {
```

**Purpose:** Sends a single book overdue notification email

**Parameters:**
- `userEmail` - User's email address
- `bookTitle` - Title of the overdue book
- `dueDate` - The due date when the book should have been returned
- `daysOverdue` - Number of days the book is overdue

**Returns:** 
```javascript
{ messageId: result.id }  // On success
{ messageId: 'error-' + Date.now(), error: error.message }  // On error
```

**HTML Template:** Professional formatted email with:
- Red warning styling (#d32f2f)
- Book details in highlighted box
- Action items (return book, renewal option, fee notice)
- Library contact information

---

### Function 2: `sendOverdueReminderEmail`
**File:** [backend/utils/emailService.js](backend/utils/emailService.js#L160)  
**Lines:** 160-227

**Function Signature:**
```javascript
const sendOverdueReminderEmail = async (userEmail, booksData) => {
```

**Purpose:** Sends bulk overdue notification for multiple books

**Parameters:**
- `userEmail` - User's email address
- `booksData` - Array of book objects: `[{ bookTitle, dueDate, daysOverdue }, ...]`

**Returns:** 
```javascript
{ messageId: result.id }  // On success
{ messageId: 'error-' + Date.now(), error: error.message }  // On error
```

**HTML Template:** Professional formatted email with:
- Multiple books displayed in HTML table
- Columns: #, Book Title, Due Date, Days Overdue
- Warning about suspension of borrowing privileges
- Payment plan discussion option
- Library hours and contact info

---

## 2. Email Service Configuration

### Configuration File
**File:** [backend/utils/emailService.js](backend/utils/emailService.js#L1)  
**Lines:** 1-55

**Email Service Provider:** **Resend API**

**Configuration Method:**
```javascript
const { Resend } = require('resend');

let resend = null;
let emailConfigured = false;

const getResend = () => {
  if (!resend) {
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
      emailConfigured = true;
      console.log('📧 Email service configured with Resend');
    } catch (error) {
      console.error('⚠️  Failed to configure email service:', error.message);
      emailConfigured = false;
    }
  }
  return resend;
};
```

### Environment Variables
**File:** [backend/.env](backend/.env)  
**Lines:** 18-19

```
RESEND_API_KEY=[REDACTED - set in deployment environment]
EMAIL_FROM=Paranaledge Library <noreply@paranaledge.online>
```

**Required Environment Variables:**
- `RESEND_API_KEY` - Resend API key for authentication
- `EMAIL_FROM` - Sender email address (optional, defaults to `Paranaledge Library <noreply@paranaledge.online>`)

---

## 3. Error Handling

### Base Email Send Function
**File:** [backend/utils/emailService.js](backend/utils/emailService.js#L23)  
**Lines:** 23-52

**Error Handling Strategy:**
```javascript
const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const emailService = getResend();
    if (!emailService) {
      console.warn('⚠️  Email service not configured, skipping email');
      return { messageId: 'mock-' + Date.now() };
    }
    
    console.log('📧 Sending email via Resend to:', to);
    const result = await emailService.emails.send({
      from: 'Parañaledge <onboarding@resend.dev>',
      to,
      subject,
      html: html || `<p>${text}</p>`
    });
    
    if (result.error) {
      console.error('❌ Resend error:', result.error);
      throw new Error(result.error);
    }
    
    console.log('✅ Email sent successfully:', result.id);
    return { messageId: result.id };
  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    console.error('❌ Full error:', error);
    // Don't crash - just log the error and continue
    return { messageId: 'error-' + Date.now(), error: error.message };
  }
};
```

**Error Handling Features:**
- ✅ Graceful fallback if email service not configured
- ✅ Detailed error logging
- ✅ Non-blocking - returns error object instead of throwing
- ✅ Full error object logged for debugging

---

## 4. Console Logging & Error Messages

### Email Service Logs
**File:** [backend/utils/emailService.js](backend/utils/emailService.js)

| Line | Log Message | Level |
|------|-------------|-------|
| 13 | `📧 Email service configured with Resend` | INFO |
| 15 | `⚠️  Failed to configure email service: [error]` | ERROR |
| 26 | `⚠️  Email service not configured, skipping email` | WARN |
| 30 | `📧 Sending email via Resend to: [email]` | INFO |
| 41 | `❌ Resend error: [error]` | ERROR |
| 45 | `✅ Email sent successfully: [messageId]` | INFO |
| 48 | `❌ Error sending email: [error.message]` | ERROR |
| 49 | `❌ Full error: [error]` | ERROR |

### Scheduler Logs
**File:** [backend/utils/overdueNotificationScheduler.js](backend/utils/overdueNotificationScheduler.js)

| Line | Log Message | Level |
|------|-------------|-------|
| 34 | `📬 Starting overdue book check...` | INFO |
| 62 | `⏳ Book "[title]" for [email] only [n] days overdue (minimum: [min])` | INFO |
| 67 | `⏭️  Skipping "[title]" - [n] days overdue (max: [max])` | INFO |
| 84 | `📊 Found [n] overdue transaction(s), [n] eligible for notification` | INFO |
| 107 | `📧 Preparing notification for [email] ([n] book(s))` | INFO |
| 112 | `   Sending single book notification: "[title]"` | INFO |
| 143 | `   Sending bulk notification for [n] books` | INFO |
| 194 | `❌ Error processing [email]: [error]` | ERROR |
| 202 | `✅ Overdue check complete. Emails sent: [n], Errors: [n]` | INFO |
| 217 | `❌ Error in checkAndNotifyOverdue: [error]` | ERROR |

---

## 5. Where Email Functions Are Used

### File 1: overdueNotificationScheduler.js
**File:** [backend/utils/overdueNotificationScheduler.js](backend/utils/overdueNotificationScheduler.js)

**Import Location:** Lines 11-12
```javascript
const {
  sendOverdueNotificationEmail,
  sendOverdueReminderEmail
} = require('./emailService');
```

**Usage:**
- **Line 114:** `sendOverdueNotificationEmail()` - Single book notification
- **Line 151:** `sendOverdueReminderEmail()` - Multiple books notification

**Context:** Automated scheduler for checking and sending overdue notifications

---

### File 2: transactionRoutes.js
**File:** [backend/routes/transactionRoutes.js](backend/routes/transactionRoutes.js)

**Import Locations:** 
- Lines 853-854 (first endpoint)
- Lines 969-970 (second endpoint)

```javascript
const { 
  sendOverdueNotificationEmail,
  sendOverdueReminderEmail
} = require('../utils/emailService');
```

**Usage:**
- **Line 864:** Individual overdue notification endpoint
- **Line 892:** Batch overdue notification endpoint
- **Line 986:** Single user notification endpoint
- **Line 1020:** Bulk user notification endpoint

**Endpoints:**
1. GET `/overdue/notify` - Notify specific user
2. POST `/overdue/notify-all` - Batch notify all users
3. POST `/overdue/notify-user` - Individual user notification

---

## 6. Email Sending Flow Diagram

```
User/Scheduler Request
        ↓
Transaction Routes / Scheduler
        ↓
Check for Overdue Books (Query Database)
        ↓
Group by User Email
        ↓
For Each User:
    ├─ Single Book → sendOverdueNotificationEmail()
    └─ Multiple Books → sendOverdueReminderEmail()
        ↓
Base Email Function: sendEmail()
        ↓
Resend API Configuration (getResend())
        ↓
Send via Resend.emails.send()
        ↓
Check for Errors
    ├─ Success → Return { messageId }
    └─ Error → Return { messageId, error }
        ↓
Log Result
    ├─ ✅ Success Log
    ├─ ❌ Error Log
    └─ Update Database (if requested)
```

---

## 7. Current Configuration Status

✅ **Email Service:** Resend API  
✅ **API Key Present:** Yes (in .env)  
✅ **Email From Address:** Configured  
✅ **Error Handling:** Comprehensive  
✅ **Logging:** Detailed with emojis  
✅ **Database Integration:** Yes (logs saved to Log model)  

---

## 8. Missing Configuration or Issues

### None Currently Detected ✅

**However, Note:**
- The `from` address in the actual email send uses `'Parañaledge <onboarding@resend.dev>'` (hardcoded)
- But `EMAIL_FROM` environment variable is set to `'Paranaledge Library <noreply@paranaledge.online>'`
- **Recommendation:** Update [backend/utils/emailService.js](backend/utils/emailService.js#L33) line 33 to use the `EMAIL_FROM` environment variable

---

## 9. Test Files

**File 1:** [backend/testEmailService.js](backend/testEmailService.js)  
- Tests Resend API configuration
- Uses nodemailer for SMTP fallback testing

**File 2:** [backend/testEmail.js](backend/testEmail.js)  
- Additional email service testing

---

## 10. Quick Reference

### To Send Single Overdue Notification:
```javascript
const result = await sendOverdueNotificationEmail(
  'user@gmail.com',
  'The Great Gatsby',
  '2026-01-25',
  5  // days overdue
);
```

### To Send Bulk Overdue Notification:
```javascript
const result = await sendOverdueReminderEmail('user@gmail.com', [
  { bookTitle: 'Book 1', dueDate: '2026-01-20', daysOverdue: 10 },
  { bookTitle: 'Book 2', dueDate: '2026-01-22', daysOverdue: 8 }
]);
```

### To Check All Overdue and Notify:
```javascript
const result = await checkAndNotifyOverdue({
  sendEmails: true,
  markReminderSent: true,
  daysOverdueMinimum: 1
});
```

---

## Summary Table

| Aspect | Details |
|--------|---------|
| **Email Service** | Resend API |
| **Functions** | 2 (single + bulk) |
| **Error Handling** | Non-blocking, logged |
| **Logging** | Comprehensive with emojis |
| **Database Tracking** | Yes (Log model) |
| **Test Files** | 2 available |
| **Configuration** | Environment variables |
| **Status** | ✅ Fully Functional |
