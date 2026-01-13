import React, { useEffect, useState } from 'react';
import './App.css';
import '../styles/pending-requests.css';

const PendingRequestTable = () => {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [reservationRequests, setReservationRequests] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [activeTab, setActiveTab] = useState('borrow');

  useEffect(() => {
    fetchPendingRequest();
    fetchReturnRequests();
  }, []);

  const fetchPendingRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
      const data = await response.json();
      if (response.ok) {
        const allRequests = data.transactions || [];
        // Separate borrow and reservation requests
        const borrowRequests = allRequests.filter(req => req.type === 'borrow');
        const reserveRequests = allRequests.filter(req => req.type === 'reserve');
        setPendingRequests(borrowRequests);
        setReservationRequests(reserveRequests);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch pending requests');
      }
    } catch (err) {
      setError('Error connecting to server. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnRequests = async () => {
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/return-requests');
      const data = await response.json();
      if (response.ok) {
        setReturnRequests(data.requests || []);
      } else {
        console.error('Failed to fetch return requests');
      }
    } catch (err) {
      console.error('Error fetching return requests:', err);
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
        fetchPendingRequest();
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
    setSelectedReservation(borrow);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleApproveReturnRequest = async (returnRequestId) => {
    if (!window.confirm('Are you sure you want to approve this return request?')) {
      return;
    }
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/return-requests/${returnRequestId}/approve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: localStorage.getItem('userEmail') || 'librarian@example.com'
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Return request approved successfully');
        fetchReturnRequests();
        fetchPendingRequest();
      } else {
        alert(data.message || 'Failed to approve return request');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving return request. Please try again.');
    }
  };

  const handleRejectReturnRequest = async (returnRequestId) => {
    if (!returnRequestId || !rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    try {
      const response = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/return-requests/${returnRequestId}/reject`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
          approvedBy: localStorage.getItem('userEmail') || 'librarian@example.com'
        }),
      });
      const data = await response.json();
      if (response.ok) {
        alert('Return request rejected successfully');
        setShowRejectModal(false);
        fetchReturnRequests();
        fetchPendingRequest();
      } else {
        alert(data.message || 'Failed to reject return request');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting return request. Please try again.');
    }
  };

  const handleReject = async () => {
    console.log('Rejection reason:', rejectionReason);
    console.log('Selected borrow:', selectedBorrow);
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
        fetchPendingRequest();
      } else {
        alert(data.message || 'Failed to reject borrow request');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error rejecting borrow request. Please try again.');
    }
  };

  const handleApproveReservation = async (reservationId) => {
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
        fetchPendingRequest();
      } else {
        const errorMsg = data.details ? `${data.message} (${data.details})` : data.message;
        alert(errorMsg || 'Failed to approve reservation');
      }
    } catch (err) {
      console.error('Error:', err);
      alert('Error approving reservation. Please try again.');
    }
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
        <h2>Pending Requests</h2>
        <p>Loading requests...</p>
      </div>
    );
  }

  const filteredBorrowRequests = pendingRequests.filter((book) =>
    book.bookTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReservationRequests = reservationRequests.filter((request) =>
    request.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReturnRequests = returnRequests.filter((request) =>
    request.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.userEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getConditionColor = (condition) => {
    switch(condition) {
      case 'good': return '#4CAF50';
      case 'damaged': return '#FF9800';
      case 'lost': return '#F44336';
      default: return '#757575';
    }
  };

  return (
    <div className="pending-container">
      <div className="header-row">
        <h2 className="page-title">📌 Pending Requests</h2>

        <div className="search-container ">
          <input type="text" placeholder="Search requests..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('borrow')}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === 'borrow' ? '3px solid #4CAF50' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'borrow' ? 'bold' : 'normal',
            color: activeTab === 'borrow' ? '#4CAF50' : '#666'
          }}
        >
          Borrow Requests ({filteredBorrowRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('reserve')}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === 'reserve' ? '3px solid #2196F3' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'reserve' ? 'bold' : 'normal',
            color: activeTab === 'reserve' ? '#2196F3' : '#666'
          }}
        >
          Reserve Requests ({filteredReservationRequests.length})
        </button>
        <button
          onClick={() => setActiveTab('return')}
          style={{
            padding: '10px 20px',
            borderBottom: activeTab === 'return' ? '3px solid #FF9800' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'return' ? 'bold' : 'normal',
            color: activeTab === 'return' ? '#FF9800' : '#666'
          }}
        >
          Return Requests ({filteredReturnRequests.length})
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Borrow Requests Tab */}
      {activeTab === 'borrow' && (
        <>
          {!error && filteredBorrowRequests.length === 0 ? (
            <div className="empty-state">
              <img src="/imgs/empty.png" alt="No Data" className="empty-img" />
              <p>No borrow requests found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Request Type</th>
                    <th>Book Title</th>
                    <th>User</th>
                    <th>Date Requested</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBorrowRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="type-cell">{request.type}</td>
                      <td className="title-cell">{request.bookTitle}</td>
                      <td>{request.userEmail}</td>
                      <td>{formatDate(request.createdAt)}</td>

                      <td className="action-buttons">
                        <button
                          onClick={() =>
                            request.type === "borrow"
                              ? handleApprove(request._id)
                              : handleApproveReservation(request._id)
                          }
                          className="btn approve"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => openRejectModal(request)}
                          className="btn reject"
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
        </>
      )}

      {/* Reserve Requests Tab */}
      {activeTab === 'reserve' && (
        <>
          {filteredReservationRequests.length === 0 ? (
            <div className="empty-state">
              <img src="/imgs/empty.png" alt="No Data" className="empty-img" />
              <p>No reserve requests found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>User</th>
                    <th>Date Requested</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReservationRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="title-cell">{request.bookTitle}</td>
                      <td>{request.userEmail}</td>
                      <td>{formatDate(request.createdAt)}</td>

                      <td className="action-buttons">
                        <button
                          onClick={() => handleApproveReservation(request._id)}
                          className="btn approve"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => openRejectModal(request)}
                          className="btn reject"
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
        </>
      )}

      {/* Return Requests Tab */}
      {activeTab === 'return' && (
        <>
          {filteredReturnRequests.length === 0 ? (
            <div className="empty-state">
              <img src="/imgs/empty.png" alt="No Data" className="empty-img" />
              <p>No return requests found.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="styled-table">
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>User Email</th>
                    <th>Condition</th>
                    <th>Date Requested</th>
                    <th>Notes</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredReturnRequests.map((request) => (
                    <tr key={request._id}>
                      <td className="title-cell">{request.bookTitle}</td>
                      <td>{request.userEmail}</td>
                      <td>
                        <span style={{
                          backgroundColor: getConditionColor(request.condition),
                          color: 'white',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {request.condition.toUpperCase()}
                        </span>
                      </td>
                      <td>{formatDate(request.requestDate)}</td>
                      <td style={{ fontSize: '12px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.notes || '-'}
                      </td>

                      <td className="action-buttons">
                        <button
                          onClick={() => handleApproveReturnRequest(request._id)}
                          className="btn approve"
                        >
                          Approve
                        </button>

                        <button
                          onClick={() => {
                            setSelectedBorrow(request);
                            setRejectionReason('');
                            setShowRejectModal(true);
                          }}
                          className="btn reject"
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
        </>
      )}

      {showRejectModal && (
        <div className="modal-overlay">
          <div className="modal-ui">
            <h3 className="modal-title">Reject Request</h3>

            <p><strong>Book:</strong> {selectedBorrow?.bookTitle}</p>
            <p><strong>User:</strong> {selectedBorrow?.userEmail}</p>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
            ></textarea>

            <div className="modal-buttons">
              <button className="btn cancel" onClick={() => setShowRejectModal(false)}>
                Cancel
              </button>

              <button
                className="btn reject"
                onClick={() => {
                  // Check if it's a return request (has requestDate) or borrow/reservation request
                  if (selectedBorrow?.requestDate) {
                    handleRejectReturnRequest(selectedBorrow._id);
                  } else if (selectedBorrow?.type === "borrow") {
                    handleReject();
                  } else {
                    handleRejectReservation();
                  }
                }}
              >
                Submit Rejection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PendingRequestTable;
