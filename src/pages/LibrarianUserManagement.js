import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import "../styles/user-management.css";

const LibrarianUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewUserLogs, setViewUserLogs] = useState(null);
  const [error, setError] = useState("");
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || "Failed to fetch users.");
      }
    } catch (err) {
      setError("Error fetching users.");
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/logs");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const handleViewHistory = (email) => {
    setViewUserLogs(email);
    setHistorySearchQuery('');
  };

  const closeHistoryModal = () => {
    setViewUserLogs(null);
    setHistorySearchQuery('');
  };

  // Filter logs to only show borrow and returned books
  const isBorrowRelatedAction = (action) => {
    if (!action) return false;
    const lowerAction = action.toLowerCase();
    return lowerAction.includes('borrow') || 
           lowerAction.includes('returned') || 
           lowerAction.includes('return') ||
           lowerAction.includes('reserve') ||
           lowerAction.includes('reservation');
  };

  const userLogs = logs
    .filter(log => log.userEmail === viewUserLogs)
    .filter(log => isBorrowRelatedAction(log.action))
    .filter(log => {
      if (!historySearchQuery) return true;
      const searchLower = historySearchQuery.toLowerCase();
      return log.action.toLowerCase().includes(searchLower);
    });

  return (
    <div className="dashboard">
      <main className="main-content">
        <section className="content">
          <div className="um">
            <div className="um-header">
              <button className="um-back-btn" onClick={() => navigate('/admin-dashboard')}>
                ← Back
              </button>
              <h1 className="um-title">User Management (View Only)</h1>
              <p style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                As a Librarian, you can view user history but cannot edit, archive, or delete accounts.
              </p>
            </div>

            {error && <div className="um-error">{error}</div>}

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search by name, email, or contact number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '5px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div className="um-filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className={`um-filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                onClick={() => setFilterRole('all')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'all' ? '#4CAF50' : '#ddd'}`,
                  backgroundColor: filterRole === 'all' ? '#4CAF50' : 'white',
                  color: filterRole === 'all' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                All Users ({users.length})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'user' ? 'active' : ''}`}
                onClick={() => setFilterRole('user')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'user' ? '#2196F3' : '#ddd'}`,
                  backgroundColor: filterRole === 'user' ? '#2196F3' : 'white',
                  color: filterRole === 'user' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Regular Users ({users.filter(u => u.role === 'user').length})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'librarian' ? 'active' : ''}`}
                onClick={() => setFilterRole('librarian')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'librarian' ? '#FF9800' : '#ddd'}`,
                  backgroundColor: filterRole === 'librarian' ? '#FF9800' : 'white',
                  color: filterRole === 'librarian' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Librarians ({users.filter(u => u.role === 'librarian').length})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
                onClick={() => setFilterRole('admin')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'admin' ? '#F44336' : '#ddd'}`,
                  backgroundColor: filterRole === 'admin' ? '#F44336' : 'white',
                  color: filterRole === 'admin' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Admins ({users.filter(u => u.role === 'admin').length})
              </button>
            </div>

            {users.length === 0 ? (
              <p className="um-empty">No users found.</p>
            ) : (
              <div className="um-table-wrapper">
                <table className="um-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Contact</th>
                      <th>Address</th>
                      <th>Role</th>
                      <th className="um-actions-col">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users
                      .filter(user => filterRole === 'all' || user.role === filterRole)
                      .filter(user => {
                        const searchLower = searchQuery.toLowerCase();
                        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                        const email = user.email.toLowerCase();
                        const contact = user.contactNumber.toLowerCase();
                        return (
                          fullName.includes(searchLower) ||
                          email.includes(searchLower) ||
                          contact.includes(searchLower)
                        );
                      })
                      .map((user, idx) => (
                      <tr 
                        key={idx} 
                        className={`um-row um-row-${user.role}`}
                        style={{
                          borderLeft: user.role === 'admin' ? '4px solid #F44336' : 
                                      user.role === 'librarian' ? '4px solid #FF9800' : 
                                      '4px solid #2196F3',
                          backgroundColor: user.role === 'admin' ? '#FFEBEE' : 
                                          user.role === 'librarian' ? '#FFF3E0' : 
                                          'transparent'
                        }}
                      >
                        <td>{user.firstName} {user.lastName}</td>
                        <td>{user.email}</td>
                        <td>{user.contactNumber}</td>
                        <td>{user.address}</td>

                        <td style={{
                          fontWeight: 'bold',
                          color: user.role === 'admin' ? '#F44336' : 
                                 user.role === 'librarian' ? '#FF9800' : 
                                 '#2196F3'
                        }}>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </td>

                        <td className="um-actions">
                          <button onClick={() => handleViewHistory(user.email)} className="um-btn um-save">View History</button>
                        </td>
                      </tr>

                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* User History Modal Popup */}
      {viewUserLogs && (
        <div 
          className="um-modal-overlay" 
          onClick={closeHistoryModal}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}
        >
          <div 
            className="um-modal" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: '550px',
              width: '90%',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
              zIndex: 10000
            }}
          >
            <div 
              className="um-modal-header" 
              style={{ 
                padding: '20px', 
                borderBottom: '1px solid #eee', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center'
              }}
            >
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#333' }}>User Borrowed & Reserved Books History</h2>
              <button 
                className="um-modal-close" 
                onClick={closeHistoryModal} 
                style={{ 
                  fontSize: '28px', 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer', 
                  color: '#999',
                  padding: 0,
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
            
            {/* Search bar inside modal */}
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee' }}>
              <input
                type="text"
                placeholder="Search book activities..."
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '5px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            <div className="um-modal-content" style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
              {userLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>No book borrow or return history found for this user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {userLogs.map((log, idx) => (
                    <div 
                      key={idx}
                      style={{
                        padding: '14px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '6px',
                        borderLeft: '4px solid #4CAF50'
                      }}
                    >
                      <p style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '600', color: '#333' }}>
                        {log.action}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianUserManagement;
