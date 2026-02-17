import React, { useEffect, useState, useCallback } from 'react';
import Swal from 'sweetalert2';
import '../components/App.css';

const MyHolds = () => {
  const [holds, setHolds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const userEmail = localStorage.getItem('userEmail');

  const fetchHolds = useCallback(async () => {
    if (!userEmail) {
      await Swal.fire({
        title: 'Parañaledge',
        text: 'User not logged in',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `https://paranaque-web-system.onrender.com/api/holds/user/${userEmail}`
      );
      const data = await response.json();
      setHolds(data.holds || []);
    } catch (error) {
      console.error('Error fetching holds:', error);
      await Swal.fire({
        title: 'Parañaledge',
        text: 'Error fetching holds',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  // Fetch book details for viewing
  const fetchBookDetails = async (bookId) => {
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/books/${bookId}`);
      const data = await res.json();
      setSelectedBook(data.book || {});
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching book details:', error);
      await Swal.fire({
        title: 'Parañaledge',
        text: 'Error loading book details',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Handle borrowing from holds
  const handleBorrowFromHold = async () => {
    if (!selectedBook || !userEmail) return;

    setBorrowLoading(true);
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/borrow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: selectedBook._id,
          userEmail: userEmail
        })
      });

      if (res.ok) {
        await Swal.fire({
          title: 'Parañaledge',
          text: 'Book borrowed successfully!',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        setShowModal(false);
        setSelectedBook(null);
        fetchHolds(); // Refresh holds list
      } else {
        const error = await res.json();
        await Swal.fire({
          title: 'Parañaledge',
          text: error.message || 'Error borrowing book',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error borrowing book:', error);
      await Swal.fire({
        title: 'Parañaledge',
        text: 'Error borrowing book',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setBorrowLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedBook(null);
  };

  useEffect(() => {
    fetchHolds();
  }, [fetchHolds]);

  // Auto-refresh holds every 30 seconds to detect status changes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHolds();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchHolds]);

  const handleCancelHold = async (holdId, bookTitle) => {
    const confirm = await Swal.fire({
      title: 'Cancel Hold',
      text: `Are you sure you want to cancel the hold on "${bookTitle}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d32f2f',
      confirmButtonText: 'Yes, cancel hold'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `https://paranaque-web-system.onrender.com/api/holds/cancel/${holdId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: 'User cancelled' })
        }
      );

      if (res.ok) {
        await Swal.fire({
          title: 'Parañaledge',
          text: 'Hold cancelled successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
        fetchHolds();
      } else {
        await Swal.fire({
          title: 'Parañaledge',
          text: 'Error cancelling hold',
          icon: 'error',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error cancelling hold:', error);
      await Swal.fire({
        title: 'Parañaledge',
        text: 'Error cancelling hold',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'active':
        return { backgroundColor: '#e3f2fd', color: '#1976d2', text: 'Waiting in Queue' };
      case 'ready':
        return { backgroundColor: '#c8e6c9', color: '#2e7d32', text: 'Book Available - Borrow Now' };
      case 'expired':
        return { backgroundColor: '#fbe9e7', color: '#d84315', text: 'Expired' };
      case 'cancelled':
        return { backgroundColor: '#eeeeee', color: '#616161', text: 'Cancelled' };
      default:
        return { backgroundColor: '#f0f0f0', color: '#666', text: status };
    }
  };

  const activeHolds = holds.filter(h => h.status === 'active');
  const readyHolds = holds.filter(h => h.status === 'ready');
  const inactiveHolds = holds.filter(h => h.status === 'expired' || h.status === 'cancelled');

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', color: '#333', margin: '0' }}>📋 My Book Holds</h1>
        <button
          onClick={fetchHolds}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: loading ? '#ccc' : '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {loading ? '🔄 Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Loading holds...</p>
        </div>
      ) : holds.length === 0 ? (
        <div
          style={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '30px',
            textAlign: 'center'
          }}
        >
          <p style={{ fontSize: '16px', color: '#666', margin: '0' }}>
            You don't have any holds yet. When a book you want is unavailable, you can place a hold to be notified when it becomes available!
          </p>
        </div>
      ) : (
        <>
          {/* Available to Borrow */}
          {readyHolds.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', color: '#2e7d32', marginBottom: '15px' }}>
                ✓ Available to Borrow ({readyHolds.length})
              </h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {readyHolds.map(hold => (
                  <div
                    key={hold._id}
                    style={{
                      backgroundColor: '#c8e6c9',
                      border: '2px solid #81c784',
                      borderRadius: '8px',
                      padding: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#1b5e20' }}>
                        {hold.bookTitle}
                      </p>
                      <p style={{ fontSize: '13px', color: '#2e7d32', margin: '4px 0' }}>
                        <strong>Ready since:</strong> {new Date(hold.readyPickupDate).toLocaleDateString()}
                      </p>
                      <p style={{ fontSize: '12px', color: '#558b2f', margin: '4px 0' }}>
                        ⏰ Please pick up within 7 days or your hold will expire
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '15px', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => fetchBookDetails(hold.bookId._id)}
                        style={{
                          backgroundColor: '#2e7d32',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        👁️ View Book
                      </button>
                      <button
                        onClick={() => handleCancelHold(hold._id, hold.bookTitle)}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Holds */}
          {activeHolds.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h2 style={{ fontSize: '20px', color: '#1976d2', marginBottom: '15px' }}>
                📚 Waiting in Queue ({activeHolds.length})
              </h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {activeHolds.map(hold => (
                  <div
                    key={hold._id}
                    style={{
                      backgroundColor: '#e3f2fd',
                      border: '2px solid #90caf9',
                      borderRadius: '8px',
                      padding: '15px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#0d47a1' }}>
                          {hold.bookTitle}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                          <div>
                            <p style={{ margin: '4px 0', color: '#1565c0' }}>
                              <strong>Position:</strong> #{hold.queuePosition}
                            </p>
                            <p style={{ margin: '4px 0', color: '#1565c0' }}>
                              <strong>Hold Date:</strong> {new Date(hold.holdDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p style={{ margin: '4px 0', color: '#1565c0' }}>
                              <strong>Expires:</strong> {new Date(hold.expiryDate).toLocaleDateString()}
                            </p>
                            {hold.notificationSent && (
                              <p style={{ margin: '4px 0', color: '#388e3c' }}>
                                ✓ <strong>Notification sent</strong>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleCancelHold(hold._id, hold.bookTitle)}
                        style={{
                          backgroundColor: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '8px 16px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: '600',
                          marginLeft: '15px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Cancel Hold
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inactive Holds */}
          {inactiveHolds.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', color: '#757575', marginBottom: '15px' }}>History</h2>
              <div style={{ display: 'grid', gap: '15px' }}>
                {inactiveHolds.map(hold => {
                  const badgeStyle = getStatusBadgeStyle(hold.status);
                  return (
                    <div
                      key={hold._id}
                      style={{
                        backgroundColor: '#fafafa',
                        border: '1px solid #e0e0e0',
                        borderRadius: '8px',
                        padding: '15px',
                        opacity: 0.7
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <div>
                          <p style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 8px', color: '#666' }}>
                            {hold.bookTitle}
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                            <p style={{ margin: '4px 0', color: '#999' }}>
                              <strong>Hold Date:</strong> {new Date(hold.holdDate).toLocaleDateString()}
                            </p>
                            {hold.cancelledDate && (
                              <p style={{ margin: '4px 0', color: '#999' }}>
                                <strong>Cancelled:</strong> {new Date(hold.cancelledDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div
                          style={{
                            backgroundColor: badgeStyle.backgroundColor,
                            color: badgeStyle.color,
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {badgeStyle.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Info Section */}
      <div
        style={{
          marginTop: '40px',
          backgroundColor: '#f3e5f5',
          border: '1px solid #ce93d8',
          borderRadius: '8px',
          padding: '20px'
        }}
      >
        <h3 style={{ fontSize: '16px', color: '#6a1b9a', margin: '0 0 12px' }}>📚 How Holds Work</h3>
        <ul style={{ fontSize: '14px', color: '#4a148c', lineHeight: '1.8', paddingLeft: '20px', margin: '0' }}>
          <li>When a book is unavailable, you can place a hold to be notified when it becomes available</li>
          <li>Holds are managed on a first-come, first-served basis</li>
          <li>You'll receive an email notification when a book is available to borrow</li>
          <li>You can borrow the book anytime after receiving the notification</li>
          <li>Your hold expires after 7 days if you don't borrow it</li>
          <li>You can cancel a hold anytime from this page</li>
        </ul>
      </div>

      {/* Book Details Modal */}
      {showModal && selectedBook && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: '#333' }}>
                {selectedBook.title}
              </h2>
              <button
                onClick={closeModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px', fontSize: '14px' }}>
              <div>
                {selectedBook.image && (
                  <img
                    src={selectedBook.image}
                    alt={selectedBook.title}
                    style={{
                      width: '100%',
                      height: 'auto',
                      borderRadius: '8px',
                      marginBottom: '15px',
                      border: '1px solid #ddd'
                    }}
                  />
                )}
              </div>
              <div>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Author:</strong> {selectedBook.author || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Publisher:</strong> {selectedBook.publisher || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Year:</strong> {selectedBook.year || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Category:</strong> {selectedBook.category || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Subject:</strong> {selectedBook.subject || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Stock:</strong> {selectedBook.stock || 'Not available'}
                </p>
                <p style={{ margin: '4px 0', color: '#555' }}>
                  <strong>Available:</strong> {selectedBook.availableStock || selectedBook.available || 'Not available'}
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <button
                onClick={handleBorrowFromHold}
                disabled={borrowLoading}
                style={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: borrowLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px',
                  opacity: borrowLoading ? 0.7 : 1
                }}
              >
                {borrowLoading ? '⏳ Processing...' : '📚 Borrow Now'}
              </button>
              <button
                onClick={closeModal}
                disabled={borrowLoading}
                style={{
                  backgroundColor: '#ccc',
                  color: '#333',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: borrowLoading ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '16px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyHolds;
