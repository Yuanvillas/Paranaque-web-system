import React, { useEffect, useState } from 'react';
import './App.css';
import '../styles/pending-requests.css';

const UserPendingRequestTable = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('User decicded not to canceel the reservation requests');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    fetchPendingRequest();
  }, []);

  const fetchPendingRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests');
      const data = await response.json();
      if (response.ok) {
        setPendingRequests(data.transactions || []);
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

  const openRejectModal = (borrow) => {
    setSelectedBorrow(borrow);
    setSelectedReservation(borrow);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectReservation = async () => {
    if (!selectedReservation || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/reject-reservation/${selectedReservation._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: localStorage.getItem('userEmail') || 'admin@example.com',
          rejectionReason: rejectionReason.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Reservation rejected successfully');
        setShowRejectModal(false);
        fetchPendingRequest();
      } else {
        alert(data.message || 'Failed to reject reservation');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting reservation. Please try again.');
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

  const filteredBooks = pendingRequests.filter((book) =>
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div style={{ marginTop: '30px' }}>
      <h3>📌 Pending reservationId</h3>

      {error && <div className="error-message">{error}</div>}


      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Date Requested</th>
              <th style={{ textAlign: "center" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredBooks.length > 0 ? filteredBooks.map((request) => (
              request.userEmail === userEmail ?
                <tr key={request._id}>
                  <td className="title-cell">{request.bookTitle}</td>
                  <td>{request.userEmail}</td>
                  <td>{formatDate(request.createdAt)}</td>

                  <td className="action-buttons">
                    <button
                      onClick={() => openRejectModal(request)}
                      className="btn reject"
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
                : null
            )) : <p className="empty-text p-2">You don't have any pending reservation books yet.</p>}
          </tbody>
        </table>
      </div>

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-ui">
            <h3 className="modal-title">Reject Request</h3>

            <p><strong>Book:</strong> {selectedBorrow?.bookTitle}</p>
            <p><strong>User:</strong> {selectedBorrow?.userEmail}</p>

            <div className="modal-buttons">
              <button className="btn cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>

              <button
                className="btn reject"
                onClick={() =>
                  handleRejectReservation()
                }
              >
                Submit Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserPendingRequestTable;
