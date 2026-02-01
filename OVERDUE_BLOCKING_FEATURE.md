# Overdue Books Blocking Feature - Implementation Guide

## Overview
This feature blocks users with overdue books from accessing the library system when they login. They must submit a return request for all overdue books before proceeding to the main library interface.

## What Was Implemented

### 1. **OverdueModal Component** (`src/components/OverdueModal.jsx`)
A blocking modal that displays:
- All overdue books for the user
- Number of days overdue (with color-coded severity)
- Book details (title, due date, book ID)
- Book condition selector (good, damaged, lost)
- "Request Return" button for each book
- Status tracking (submitted/pending requests)
- Automatic close when all books have return requests submitted

**Features:**
- Fully responsive design
- Beautiful red theme indicating urgency
- Smooth animations and transitions
- Prevents user from dismissing the modal
- Shows confirmation once all requests are submitted

### 2. **OverdueModal Styles** (`src/components/OverdueModal.css`)
Complete styling including:
- Fixed overlay that covers entire screen (z-index: 10000)
- Modal container with animations
- Color-coded severity badges for overdue days
- Responsive design for mobile/tablet/desktop
- Button states (normal, hover, disabled, requested)
- Smooth transitions and animations

### 3. **Login.js Integration** (`src/pages/Login.js`)
Modified to:
- Import the OverdueModal component
- Add state for overdue modal visibility and data
- Create `checkForOverdueBooks()` function that:
  - Fetches overdue books via API after successful login
  - Shows modal only to regular users (not admin/librarian)
  - Stores user data in localStorage
  - Navigates to user-home if no overdues
  - Shows modal if overdues exist
- Create `handleOverdueModalClose()` to navigate after handling overdues
- Disable login form inputs while modal is displayed
- Disable submit button while modal is displayed

### 4. **Backend API Update** (`backend/routes/transactionRoutes.js`)
Enhanced the `/overdue/user/:email` endpoint to return:
- Transaction ID (`_id`)
- Book ID (`bookId`)
- Book title
- End date (due date)
- Start date
- Days overdue (calculated)
- Reminder sent status

## Data Flow

```
1. User submits login credentials
   ↓
2. Backend validates and returns user data
   ↓
3. Frontend checks user role:
   - Admin/Librarian → Redirect to dashboard (skip overdue check)
   - Regular User → Continue to step 4
   ↓
4. Frontend calls GET /api/transactions/overdue/user/:email
   ↓
5. Backend returns array of overdue transactions
   ↓
6. If overdues exist:
   - Show OverdueModal (blocking)
   - User selects book condition
   - User clicks "Request Return"
   ↓
7. Frontend calls POST /api/transactions/request-return/:transactionId
   - Sends condition (good/damaged/lost)
   - Sends notes about the request
   ↓
8. Backend creates ReturnRequest and updates logs
   ↓
9. Frontend marks book as "Requested"
   - User can request other overdues
   - Button becomes disabled
   ↓
10. All overdues requested:
    - Modal shows success message
    - "Proceed to Library" button appears
    - User can click to go to user-home
    ↓
11. User navigates to user-home
    - Admin/Librarian reviews return requests
    - Once approved, user can borrow again
```

## User Experience

### Login Flow
1. **User logs in** with overdue books
2. **Modal appears** - Cannot be dismissed or minimized
3. **Shows all overdues** with:
   - Number of days overdue
   - Due date
   - Book condition selector
4. **User selects condition** and clicks "Request Return"
5. **Confirmation** - Button changes to "✓ Request Returned"
6. **Repeat** for all overdue books
7. **Success message** appears when all submitted
8. **Click "Proceed to Library"** to access system

### For Admins/Librarians
- Skip the overdue check entirely
- Proceed directly to dashboard
- Can view and approve return requests from the dashboard

## Admin/Librarian Workflow

### Reviewing Return Requests
1. Navigate to Return Requests section
2. See list of pending requests with:
   - User email
   - Book title
   - Book condition reported
   - Request date
3. Options:
   - **Approve**: Marks book as returned, increments stock
   - **Reject**: Requires rejection reason

### Approving Return Request
- Sets transaction status to 'completed'
- Sets book's `returnDate` to current date
- Increments book's `availableStock`
- Clears `borrowedBy` and `borrowedAt`
- Creates log entry
- User can now borrow again

## API Endpoints Used

### 1. Login
```
POST /api/auth/login
Body: { email, password }
Response: { user, message }
```

### 2. Get Overdue Books
```
GET /api/transactions/overdue/user/:email
Response: {
  message: string,
  count: number,
  overdue: [
    {
      _id: string,
      bookId: string,
      bookTitle: string,
      endDate: date,
      daysOverdue: number,
      ...
    }
  ]
}
```

### 3. Request Return
```
POST /api/transactions/request-return/:transactionId
Body: {
  condition: 'good' | 'damaged' | 'lost',
  notes: string
}
Response: {
  message: string,
  returnRequest: {...}
}
```

### 4. Approve Return (Admin/Librarian)
```
PUT /api/transactions/return-requests/:requestId/approve
Body: { approvedBy: string }
Response: {
  message: string,
  returnRequest: {...},
  transaction: {...}
}
```

## Testing the Feature

### Test Case 1: User with Overdue Books
1. Create a test user
2. Manually create an active borrow transaction with past `endDate`
3. Login with that user
4. Verify modal appears
5. Select condition and request return
6. Verify success message
7. Click "Proceed to Library"
8. Verify navigation to user-home

### Test Case 2: User without Overdue Books
1. Create a test user with no active borrows
2. Login with that user
3. Verify NO modal appears
4. Verify direct navigation to user-home

### Test Case 3: Admin Login
1. Login with admin account
2. Verify NO modal appears (even if admin has overdues)
3. Verify direct navigation to admin-dashboard

### Test Case 4: Multiple Overdue Books
1. Create test user with 3 overdue books
2. Login
3. Verify all 3 books displayed
4. Request return for books 1 and 3
5. Verify success message appears
6. Request return for book 2
7. Verify "Proceed to Library" appears

## Technical Implementation Details

### Modal Block Behavior
- Z-index: 10000 (above all other content)
- Backdrop filter: blur(2px)
- Cannot click outside modal
- Cannot press Escape
- Form inputs disabled
- Back button doesn't work (due to navigation flow)

### State Management
```javascript
// In Login.js
const [showOverdueModal, setShowOverdueModal] = useState(false);
const [overdueBooks, setOverdueBooks] = useState([]);
const [currentUser, setCurrentUser] = useState(null);
```

### Modal Integration
```javascript
{showOverdueModal && (
  <OverdueModal 
    overdueBooks={overdueBooks} 
    userEmail={currentUser?.email}
    onClose={handleOverdueModalClose}
  />
)}
```

## Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full responsive support

## Performance Considerations
- Modal only fetches overdue data when needed
- Return requests submitted one at a time
- No unnecessary re-renders
- Optimized CSS with efficient selectors

## Security Considerations
1. **URL Parameter Validation**: Email in URL is validated server-side
2. **Authentication**: Only authenticated users can submit return requests
3. **Authorization**: Users can only see their own overdue books
4. **Admin Approval**: Return requests require admin/librarian approval before credit

## Future Enhancements

### Optional Improvements
1. **Email Notifications**: Send confirmation email when return request submitted
2. **Fine Calculation**: Calculate late fees for overdue books
3. **Bulk Return**: Allow users to submit multiple returns at once
4. **Reminder Emails**: Automated emails before reaching overdue
5. **Partial Returns**: Allow returning some books while keeping others
6. **Photo Upload**: Allow users to upload photos of book condition
7. **Chat Support**: Live chat with librarian about overdue books

## Troubleshooting

### Modal Not Appearing
1. Check browser console for errors
2. Verify API endpoint is accessible
3. Check if user has active overdue borrows
4. Verify backend is running

### "Request Return" Button Not Working
1. Check network tab for API errors
2. Verify transaction ID is correct
3. Check backend logs for errors
4. Verify database connection

### Modal Not Blocking
1. Check z-index value (should be 10000)
2. Verify CSS file is imported
3. Check if modal is being rendered
4. Verify React is rendering the component

## Files Modified/Created

### Created Files
- `src/components/OverdueModal.jsx` - Modal component
- `src/components/OverdueModal.css` - Modal styles

### Modified Files
- `src/pages/Login.js` - Added modal integration
- `backend/routes/transactionRoutes.js` - Enhanced API response

## Support

For issues or questions:
1. Check browser console for errors
2. Check backend logs
3. Verify API endpoints are working
4. Test with known overdue transaction data
5. Check database for ReturnRequest collection

---

**Status**: ✅ Feature Complete and Tested
**Date Implemented**: 2026-02-02
**Version**: 1.0
