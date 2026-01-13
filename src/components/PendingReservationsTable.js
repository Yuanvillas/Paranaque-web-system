import React, { useEffect, useState } from 'react';
import './App.css';

const PendingReservationsTable = () => {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  const fetchPendingReservations = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-reservations');
      const data = await response.json();

      if (response.ok) {
        setPendingReservations(data.transactions || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch pending reserved books');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reservationId) => {
    if (!window.confirm('Are you sure you want to approve this reservation?')) {
      return;
    }

    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/approve-reservation/${reservationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          adminEmail: localStorage.getItem('userEmail') || 'admin@example.com'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Reservation approved successfully');
        fetchPendingReservations();
      } else {
        alert(data.message || 'Failed to approve reservation');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving reservation. Please try again.');
    }
  };

  const openRejectModal = (reservation) => {
    setSelectedReservation(reservation);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
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
        fetchPendingReservations();
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
      <div className="pending-reservations-container">
        <h2>Pending Reservations</h2>
        <p>Loading reservations...</p>
      </div>
    );
  }

  const filteredBooks = pendingReservations.filter((book) =>
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pending-reservations-container">
       <div className="d-flex justify-content-between align-items-center">
        <h2 style={{ fontWeight: '600', fontSize: '25px', marginTop: "5px" }}>Pending Reservations</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search analytics..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!error && filteredBooks.length === 0 ? (
        <div className="no-reservations-message">
          <p>No pending reservations found.</p>
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
              {filteredBooks.map((reservation) => (
                <tr key={reservation._id}>
                  <td>{reservation.bookTitle}</td>
                  <td>{reservation.userEmail}</td>
                  <td>{formatDate(reservation.createdAt)}</td>
                  <td>
                    <button
                      onClick={() => handleApprove(reservation._id)}
                      className="approve-button"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openRejectModal(reservation)}
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
            <h3>Reject Reservation</h3>
            <p>Book: {selectedReservation?.bookTitle}</p>
            <p>Requested by: {selectedReservation?.userEmail}</p>
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

export default PendingReservationsTable;
