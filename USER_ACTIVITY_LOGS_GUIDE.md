# User Activity Logs Feature - Implementation Guide

## Overview
The User Activity Logs feature allows users to view their complete activity history including:
- **Login/Logout events** with timestamps and IP addresses
- **Transaction history** (Borrow, Reserve, Return)
- **Account activity** (Registration, Profile updates, Password changes)
- **Statistics** showing total logins, borrowings, reservations, etc.

## Features Implemented

### 1. Enhanced Log Model (`backend/models/Log.js`)
The Log model now tracks:
- `userEmail` - Email of the user performing the action
- `action` - Type of action (login, logout, borrow, reserve, return, register, etc.)
- `actionType` - Category (auth, transaction, or account)
- `transactionId` - Reference to transaction (if applicable)
- `bookId` - Reference to book (if applicable)
- `bookTitle` - Title of the book involved
- `description` - Human-readable description
- `status` - Success/Failed/Pending
- `ipAddress` - IP address of the user
- `userAgent` - Browser/device information
- `details` - Additional metadata
- `timestamp` - Date and time of the action
- `formattedDate` - Formatted date string for display

### 2. Enhanced Log Routes (`backend/routes/logRoutes.js`)

#### Endpoints Available:

**POST `/api/logs/add`**
- Adds a new log entry
- Request body: Log object with user details and action information

**GET `/api/logs`**
- Admin endpoint to get all logs sorted by timestamp
- Returns all system logs (no filtering)

**GET `/api/logs/user/:email`**
- User-specific logs with pagination and filtering
- Query parameters:
  - `page` (default: 1) - Page number
  - `pageSize` (default: 20) - Items per page
  - `actionType` (optional) - Filter by: `auth`, `transaction`, or `account`
- Returns paginated logs with formatting

**GET `/api/logs/stats/:email`**
- Statistics endpoint
- Returns:
  - Total logins count
  - Total logouts count
  - Total borrows count
  - Total reserves count
  - Total returns count
  - Last login information with timestamp

### 3. Updated Authentication Routes (`backend/routes/authRoutes.js`)

#### Enhanced Logging:
- **Login endpoint**: Now logs with enhanced details including IP address, browser info, and status
- **Logout endpoint**: Tracks user logout with role and identification info
- **Register endpoint**: Logs user registration with role information

Example log entry for login:
```json
{
  "userEmail": "user@example.com",
  "action": "login",
  "actionType": "auth",
  "status": "success",
  "description": "John Doe logged in successfully",
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "details": {
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2026-02-20T10:30:00.000Z"
}
```

### 4. User Activity Logs Page (`src/pages/UserActivityLogs.js`)

A comprehensive UI component that displays:
- **Statistics Dashboard**: Shows key metrics at the top
  - Total Logins
  - Books Borrowed
  - Reservations
  - Returns
  - Last Login timestamp

- **Filter Options**: Filter logs by action type
  - All Actions
  - Authentication (Login/Logout)
  - Transactions (Borrow/Reserve/Return)
  - Account Actions

- **Activity Table**: Displays logs in a table format with:
  - Date and Time
  - Action type with color-coded badges
  - Description of the action
  - Status indicator (Success/Failed/Pending)
  - Additional details (Book title, IP address)

- **Pagination**: Navigate through logs with 10 items per page

### 5. Navigation Integration (`src/layouts/UserLayout.js` & `src/App.js`)

- Added "Activity Logs" link in the user sidebar navigation
- Uses `faHistory` icon from FontAwesome
- Route: `/user-home/activity-logs`

## How Users Access Activity Logs

1. **Login to the system** as a regular user
2. **Click on "Activity Logs"** in the user sidebar menu
3. **View your activity** with the following information:
   - Complete history of all activities
   - Filterable by action type
   - Paginated for easy navigation
   - Statistics showing key metrics

## Data Collected

### For Authentication Events:
- Login time and date
- IP address and device information
- Login success/failure status
- Failure reason (if failed)

### For Transaction Events:
- Book title and ID
- Transaction type (Borrow/Reserve/Return)
- Timestamp and date
- Transaction status

### For Account Events:
- Action type (Registration, Password change, etc.)
- Timestamp and date
- Status of the action

## Security Features

- **User Data Privacy**: Each user can only see their own logs
- **IP Tracking**: IP addresses logged for security audit trail
- **Device Tracking**: Browser/device information captured
- **Timestamp Verification**: All events timestamped on server
- **Status Tracking**: Failed attempts are recorded for security monitoring

## Backend API Examples

### Get User's Activity Logs:
```bash
curl -X GET "https://paranaque-web-system.onrender.com/api/logs/user/user@example.com?page=1&pageSize=10"
```

### Get User Statistics:
```bash
curl -X GET "https://paranaque-web-system.onrender.com/api/logs/stats/user@example.com"
```

### Filter by Action Type:
```bash
curl -X GET "https://paranaque-web-system.onrender.com/api/logs/user/user@example.com?actionType=auth&page=1"
```

## Response Examples

### User Logs Response:
```json
{
  "logs": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "userEmail": "user@example.com",
      "action": "login",
      "actionType": "auth",
      "status": "success",
      "description": "User logged in successfully",
      "ipAddress": "192.168.1.100",
      "bookTitle": null,
      "timestamp": "2026-02-20T10:30:00.000Z",
      "formattedDate": "Feb 20, 2026, 10:30:00 AM"
    }
  ],
  "totalLogs": 150,
  "totalPages": 15,
  "currentPage": 1,
  "pageSize": 10
}
```

### Statistics Response:
```json
{
  "stats": {
    "totalLogins": 45,
    "totalLogouts": 42,
    "totalBorrows": 12,
    "totalReserves": 8,
    "totalReturns": 10
  },
  "lastLogin": {
    "timestamp": "2026-02-20T10:30:00.000Z",
    "formattedDate": "Feb 20, 2026, 10:30:00 AM"
  }
}
```

## Files Modified

1. **backend/models/Log.js** - Enhanced with detailed fields
2. **backend/routes/logRoutes.js** - Added user-specific endpoints
3. **backend/routes/authRoutes.js** - Enhanced login/logout/register logging
4. **src/pages/UserActivityLogs.js** - New page (created)
5. **src/App.js** - Added route for new page
6. **src/layouts/UserLayout.js** - Added navigation link

## Future Enhancements

- Export logs to CSV/PDF
- Advanced filtering by date range
- Search functionality within logs
- Device management (view active sessions)
- Logout from all devices
- IP allowlisting/blocklisting
- Email notifications for suspicious activities

## Testing the Feature

1. **Test Login Logging**:
   - Login to the system
   - Check Activity Logs page
   - Verify login entry appears

2. **Test Transaction Logging**:
   - Borrow a book
   - Check Activity Logs page
   - Verify transaction appears

3. **Test Filtering**:
   - Use the filter dropdown
   - Select "Authentication"
   - Verify only auth logs appear

4. **Test Pagination**:
   - Generate many logs
   - Test page navigation
   - Verify correct data per page

5. **Test Statistics**:
   - Check stats dashboard
   - Verify counts are accurate
   - Check last login timestamp

## Support & Troubleshooting

### Issue: Activity Logs page shows "No activity logs found"
- **Solution**: Wait for the next action to be logged, then refresh the page

### Issue: IP address shows as "unknown"
- **Solution**: This is normal in development environments. IP will be captured properly in production

### Issue: Statistics don't match expected counts
- **Solution**: Refresh the page or clear browser cache

## Admin Viewing All Logs

Admins can view all system logs (not just their own) at:
- **Route**: `/api/logs` (GET)
- **Note**: This endpoint returns all logs without user filtering

---

**Feature Implementation Date**: February 20, 2026
**Version**: 1.0
**Status**: Active
