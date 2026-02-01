import React, { useState } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import './OverdueModal.css';

/**
 * OverdueModal Component
 * 
 * Displays overdue books to users upon login and blocks access
 * until they submit a return request for all overdue books.
 * 
 * Features:
 * - Shows all overdue books with details
 * - Blocks access to the rest of the application
 * - Allows users to request return of overdue books
 * - Communicates with admin/librarian for approval
 */

const OverdueModal = ({ overdueBooks, userEmail, onClose }) => {
  const navigate = useNavigate();
  const [submittingBook, setSubmittingBook] = useState(null);
  const [requestedBooks, setRequestedBooks] = useState(new Set());
  const [bookConditions, setBookConditions] = useState({});

  const handleLogout = async () => {
    const confirmed = await Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout? Another user can then login with their account.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      cancelButtonColor: '#666',
      confirmButtonText: 'Yes, Logout',
      cancelButtonText: 'Cancel',
      didOpen: () => {
        // Ensure the dialog appears on top
        const swalContainer = document.querySelector('.swal2-container');
        if (swalContainer) {
          swalContainer.style.zIndex = '99999';
        }
      }
    });

    if (confirmed.isConfirmed) {
      // Clear all session data
      localStorage.removeItem('userEmail');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Redirect to login immediately
      navigate('/', { replace: true });
      
      // Show success message (non-blocking)
      Swal.fire({
        title: 'Logged Out',
        text: 'You have been successfully logged out.',
        icon: 'success',
        confirmButtonText: 'OK',
        timer: 2000,
        timerProgressBar: true
      });
    }
  };

  const handleRequestReturn = async (overdueTransaction) => {
    if (!overdueTransaction._id) {
      Swal.fire({
        title: 'Parañaledge',
        text: 'Transaction ID not found',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    setSubmittingBook(overdueTransaction._id);

    try {
      // Show loading
      Swal.fire({
        title: 'Submitting...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const condition = bookConditions[overdueTransaction._id] || 'good';

      await axios.post(
        `https://paranaque-web-system.onrender.com/api/transactions/request-return/${overdueTransaction._id}`,
        {
          condition,
          notes: `Book is overdue. Return requested by user on ${new Date().toLocaleDateString()}`
        }
      );

      Swal.hideLoading();

      // Show toast notification
      Swal.fire({
        title: '✓ Request Submitted!',
        text: 'The librarian will review your request soon.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      // Mark book as requested
      const newRequested = new Set(requestedBooks);
      newRequested.add(overdueTransaction._id);
      setRequestedBooks(newRequested);

      // Check if all books have return requests
      const allRequested = overdueBooks.every(book => newRequested.has(book._id) || requestedBooks.has(book._id));
      if (allRequested) {
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      Swal.hideLoading();
      const errorMessage = error.response?.data?.message || 'Failed to submit return request';
      
      Swal.fire({
        title: 'Parañaledge',
        text: errorMessage,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setSubmittingBook(null);
    }
  };

  const handleConditionChange = (bookId, condition) => {
    setBookConditions({
      ...bookConditions,
      [bookId]: condition
    });
  };

  const calculateDaysOverdue = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const daysOverdue = Math.floor((now - end) / (1000 * 60 * 60 * 24));
    return daysOverdue > 0 ? daysOverdue : 0;
  };

  const allBooksRequested = overdueBooks.length > 0 && 
    overdueBooks.every(book => requestedBooks.has(book._id));

  return (
    <div className="overdue-modal-overlay">
      <div className="overdue-modal-container">
        <div className="overdue-modal-header">
          <h2>⚠️ Overdue Books Notice</h2>
          <p className="overdue-modal-subtitle">You have overdue books that need to be returned</p>
        </div>

        <div className="overdue-modal-content">
          <p className="overdue-modal-description">
            You cannot access the library system until you submit return requests for all your overdue books. 
            An admin or librarian will review and approve your request.
          </p>

          <div className="overdue-books-list">
            {overdueBooks && overdueBooks.length > 0 ? (
              overdueBooks.map((book) => {
                const isRequested = requestedBooks.has(book._id);
                const daysOverdue = calculateDaysOverdue(book.endDate);

                return (
                  <div key={book._id} className={`overdue-book-item ${isRequested ? 'requested' : ''}`}>
                    <div className="overdue-book-header">
                      <h3>{book.bookTitle}</h3>
                      <span className={`days-overdue-badge ${daysOverdue > 30 ? 'critical' : daysOverdue > 14 ? 'warning' : ''}`}>
                        {daysOverdue} days overdue
                      </span>
                    </div>

                    <div className="overdue-book-details">
                      <div className="detail-item">
                        <label>Due Date:</label>
                        <span>{new Date(book.endDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                      <div className="detail-item">
                        <label>Book ID:</label>
                        <span>{book.bookId}</span>
                      </div>
                    </div>

                    {!isRequested && (
                      <div className="overdue-book-condition">
                        <label htmlFor={`condition-${book._id}`}>Book Condition:</label>
                        <select
                          id={`condition-${book._id}`}
                          value={bookConditions[book._id] || 'good'}
                          onChange={(e) => handleConditionChange(book._id, e.target.value)}
                          className="condition-select"
                        >
                          <option value="good">Good</option>
                          <option value="damaged">Damaged</option>
                          <option value="lost">Lost</option>
                        </select>
                      </div>
                    )}

                    <button
                      className={`request-return-btn ${isRequested ? 'requested' : ''}`}
                      onClick={() => handleRequestReturn(book)}
                      disabled={submittingBook === book._id || isRequested}
                    >
                      {isRequested ? '✓ Return Requested' : submittingBook === book._id ? 'Submitting...' : 'Request Return'}
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="no-overdues">
                <p>No overdue books found</p>
              </div>
            )}
          </div>

          {allBooksRequested && overdueBooks.length > 0 && (
            <div className="all-requests-submitted">
              <p>✓ All return requests have been submitted!</p>
              <p className="small-text">The librarian will review and approve your requests. You'll be notified once approved.</p>
              <button 
                className="proceed-btn"
                onClick={onClose}
              >
                Proceed to Library
              </button>
            </div>
          )}
        </div>

        <div className="overdue-modal-footer">
          <p className="footer-note">If you need assistance, please contact the librarian.</p>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            title="Switch to another user account"
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default OverdueModal;
