import { useCallback, useEffect, useState } from "react";
import Swal from "sweetalert2";
import "../styles/user-home.css";

const MyShelf = () => {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState(null);
  const userEmail = localStorage.getItem("userEmail");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    try {
      console.log('Fetching transactions for user:', userEmail);
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/user/${userEmail}`);
      const data = await res.json();
      if (res.ok) {
        console.log('User transactions response:', data);

        const allTransactions = data.transactions || [];
        setTransactions(allTransactions);
      } else {
        console.error('Failed to load transactions:', data.message);
        setError(data.message || "Failed to load your books");
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError("Error loading your books");
    }
  }, [userEmail]);

  useEffect(() => {
    fetchTransactions();
    fetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then(() => {
        // Logs fetched but not used in this component
      })
      .catch((err) => {
        console.error('Error fetching logs:', err); // Debug log
      });

  }, [fetchTransactions]);

  const handleReturn = async (transactionId) => {
    try {
      // Show a dialog to confirm book condition
      const { value: condition } = await Swal.fire({
        title: "Book Condition",
        input: "select",
        inputOptions: {
          good: "Good Condition",
          damaged: "Damaged",
          lost: "Lost"
        },
        inputValue: "good",
        showCancelButton: true,
        confirmButtonText: "Submit Return Request",
        inputValidator: (value) => {
          if (!value) {
            return "Please select a condition";
          }
        }
      });

      if (!condition) return;

      const { value: notes } = await Swal.fire({
        title: "Additional Notes (Optional)",
        input: "textarea",
        inputPlaceholder: "Add any notes about the book condition or return...",
        showCancelButton: true,
        confirmButtonText: "Submit Return Request"
      });

      // Submit return request
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/transactions/request-return/${transactionId}`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          condition,
          notes: notes || null
        })
      });

      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Return request submitted successfully! The librarian will review and approve it.",
          icon: "success",
          confirmButtonText: "OK"
        });
        fetchTransactions();
      } else {
        // Handle non-JSON responses
        let errorMessage = "Failed to submit return request";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        }
        await Swal.fire({
          title: "Parañaledge",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Error submitting return request",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handleCancel = async (transactionId, type) => {
    try {
      // Use the appropriate endpoint based on transaction type
      const endpoint = type === 'reserve' 
        ? `https://paranaque-web-system.onrender.com/api/transactions/cancel-reservation/${transactionId}`
        : `https://paranaque-web-system.onrender.com/api/transactions/cancel-pending/${transactionId}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userEmail })
      });

      if (res.ok) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Request cancelled successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        fetchTransactions();
      } else {
        // Handle non-JSON responses
        let errorMessage = "Failed to cancel request";
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          errorMessage = data.message || errorMessage;
        }
        await Swal.fire({
          title: "Parañaledge",
          text: errorMessage,
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      await Swal.fire({
        title: "Parañaledge",
        text: "Error cancelling request",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const borrowedBooks = transactions.filter(t => t.type === 'borrow' && t.status === 'active');
  const reservedBooks = transactions.filter(t =>
    t.type === 'reserve' && t.status === 'active'
  );
  const completedBooks = transactions.filter(t => t.type === 'borrow' && t.status === 'completed');
  const pendingBooks = transactions.filter(t => 
    (t.type === 'borrow' || t.type === 'reserve') && t.status === 'pending'
  );

  // Get filtered items based on active tab
  const getFilteredItems = () => {
    switch(activeTab) {
      case 'borrowed':
        return borrowedBooks;
      case 'reserved':
        return reservedBooks;
      case 'completed':
        return completedBooks;
      case 'pending':
        return pendingBooks;
      default:
        return [
          ...borrowedBooks,
          ...reservedBooks,
          ...completedBooks,
          ...pendingBooks
        ];
    }
  };

  const filteredItems = getFilteredItems();

  // Search filter
  const searchFilteredItems = filteredItems.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return item.bookTitle.toLowerCase().includes(searchLower);
  });

  // Count all items for display
  const allCount = borrowedBooks.length + reservedBooks.length + completedBooks.length + pendingBooks.length;


  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ fontWeight: '600', fontSize: '25px', marginBottom: '20px' }}>My Shelf</h2>

      {error && <div className="error-msg">{error}</div>}

      {borrowedBooks.length >= 3 && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffc107',
          borderRadius: '8px',
          padding: '15px 20px',
          marginBottom: '20px',
          color: '#856404',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>⚠️</span>
          <span>You have reached the borrowing limit of <strong>3 books</strong>. Please return some books before borrowing more.</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="shelf-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({allCount})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'borrowed' ? 'active' : ''}`}
          onClick={() => setActiveTab('borrowed')}
        >
          Borrowed ({borrowedBooks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reserved' ? 'active' : ''}`}
          onClick={() => setActiveTab('reserved')}
        >
          Reserved ({reservedBooks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedBooks.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingBooks.length})
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '20px', marginTop: '20px' }}>
        <input
          type="text"
          placeholder="🔍 Search by book title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '6px',
            border: '2px solid #ddd',
            fontSize: '14px',
            boxSizing: 'border-box',
            transition: 'all 0.3s',
            fontFamily: 'Arial, sans-serif'
          }}
          onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
          onBlur={(e) => e.target.style.borderColor = '#ddd'}
        />
        {searchQuery && (
          <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#666' }}>
            Found {searchFilteredItems.length} book{searchFilteredItems.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Cards Container for non-all/non-completed tabs */}
      {activeTab !== 'all' && activeTab !== 'completed' ? (
        <div className="shelf-cards-container">
          {searchFilteredItems.length > 0 ? (
            searchFilteredItems.map((item) => (
              <div key={item._id} className="shelf-card">
                <h3>{item.bookTitle}</h3>
                
                <div className="shelf-card-badge">
                  {item.status === 'pending' ? (
                    <span className="badge pending">⏱ Pending</span>
                  ) : item.type === 'borrow' ? (
                    <span className="badge borrowed">📖 Borrowed</span>
                  ) : (
                    <span className="badge reserved">♦ Reserved</span>
                  )}
                </div>

                <div className="shelf-card-info">
                  <p className="info-label">REQUEST DATE:</p>
                  <p className="info-value">
                    {new Date(item.startDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}, {new Date(item.startDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {item.endDate && item.status !== 'pending' && (
                  <div className="shelf-card-info">
                    <p className="info-label">DUE DATE:</p>
                    <p className="info-value">
                      {new Date(item.endDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {item.type === 'borrow' && item.status === 'active' && (
                  <div className="shelf-card-actions">
                    <button 
                      className="shelf-card-btn return-btn"
                      onClick={() => handleReturn(item._id)}
                    >
                      Return
                    </button>
                  </div>
                )}

                {(item.status === 'pending' || item.type === 'reserve') && (
                  <div className="shelf-card-actions">
                    <button 
                      className="shelf-card-btn cancel-btn"
                      onClick={() => handleCancel(item._id, item.type)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-shelf">
              <p>No books in this category</p>
            </div>
          )}
        </div>
      ) : (
        /* Table view for All tab */
        <div className="shelf-table-container" style={{ overflowX: 'auto', marginTop: '20px' }}>
          {searchFilteredItems.length > 0 ? (
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              <thead>
                <tr style={{ backgroundColor: '#2e7d32', color: 'white' }}>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Book Title</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Request Date</th>
                  <th style={{ padding: '15px', textAlign: 'left', fontWeight: 'bold' }}>Due Date</th>
                  <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchFilteredItems.map((item, index) => (
                  <tr key={item._id} style={{
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : '#fff',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <td style={{ padding: '12px 15px' }}>{item.bookTitle}</td>
                    <td style={{ padding: '12px 15px', textTransform: 'capitalize' }}>
                      {item.type === 'borrow' ? '📖 Borrow' : '♦ Reserve'}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        backgroundColor: 
                          item.status === 'active' ? '#c8e6c9' :
                          item.status === 'pending' ? '#fff9c4' :
                          item.status === 'completed' ? '#b2dfdb' : '#f8bbd0',
                        color:
                          item.status === 'active' ? '#1b5e20' :
                          item.status === 'pending' ? '#f57f17' :
                          item.status === 'completed' ? '#00695c' : '#c2185b'
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {new Date(item.startDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}, {new Date(item.startDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td style={{ padding: '12px 15px' }}>
                      {item.endDate && item.status !== 'pending' ? (
                        new Date(item.endDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        {item.type === 'borrow' && item.status === 'active' && (
                          <button 
                            onClick={() => handleReturn(item._id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#4CAF50',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Return
                          </button>
                        )}
                        {(item.status === 'pending' || item.type === 'reserve') && (
                          <button 
                            onClick={() => handleCancel(item._id, item.type)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#f44336',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-shelf" style={{ textAlign: 'center', padding: '40px' }}>
              <p>No books in this category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyShelf;
