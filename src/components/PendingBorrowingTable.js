import React, { useEffect, useState } from 'react';
import './App.css';

const PendingBorrowingTable = () => {
  const [pendingBorrows, setPendingBorrows] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPendingBorrows();
  }, []);

  const fetchPendingBorrows = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-borrows');
      const data = await response.json();
      if (response.ok) {
        setPendingBorrows(data.transactions || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch pending borrows');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (borrowId) => {
    if (!window.confirm('Are you sure you want to approve this borrow request?')) {
      return;
    }
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/approve-borrow/${borrowId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: localStorage.getItem('userEmail') || 'admin@example.com'
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Borrow request approved successfully');
        fetchPendingBorrows();
      } else {
        alert(data.message || 'Failed to approve borrow request');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving borrow request. Please try again.');
    }
  };

  const openRejectModal = (borrow) => {
    setSelectedBorrow(borrow);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedBorrow || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/reject-borrow/${selectedBorrow._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminEmail: localStorage.getItem('userEmail') || 'admin@example.com',
          rejectionReason: rejectionReason.trim()
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Borrow request rejected successfully');
        setShowRejectModal(false);
        fetchPendingBorrows();
      } else {
        alert(data.message || 'Failed to reject borrow request');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting borrow request. Please try again.');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="pending-borrowing-container">
        <h2>Pending Borrow Requests</h2>
        <p>Loading borrow requests...</p>
      </div>
    );
  }

  const filteredBooks = pendingBorrows.filter((book) =>
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pending-borrowing-container">
      <div className="d-flex justify-content-between align-items-center">
        <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>Pending Borrow Requests</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {error && <div className="error-message">{error}</div>}
      {!error && filteredBooks.length === 0 ? (
        <div className="no-borrows-message">
          <p>No pending borrow requests found.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="reservation-table">
            <thead>
              <tr>
                <th>Book Title</th>
                <th>Requested By</th>
                <th>Request Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBooks.map((borrow) => (
                <tr key={borrow._id}>
                  <td>{borrow.bookTitle}</td>
                  <td>{borrow.userEmail}</td>
                  <td>{formatDate(borrow.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(borrow._id)}
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(borrow)}
                      className="reject-button"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reject Borrow Request</h3>
            <p>Book: {selectedBorrow?.bookTitle}</p>
            <p>Requested by: {selectedBorrow?.userEmail}</p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              rows={4}
              className="rejection-reason"
            />
            <div className="modal-actions">
              <button onClick={() => setShowRejectModal(false)} className="cancel-button">
                Cancel
              </button>
              <button onClick={handleReject} className="confirm-reject-button">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingBorrowingTable;
