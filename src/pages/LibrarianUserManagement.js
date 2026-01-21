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
  };

  const closeHistoryModal = () => {
    setViewUserLogs(null);
  };

  const userLogs = logs.filter(log => log.userEmail === viewUserLogs);

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

      {/* User History Modal */}
      {viewUserLogs && (
        <div className="um-modal-overlay" onClick={closeHistoryModal}>
          <div className="um-modal" onClick={(e) => e.stopPropagation()}>
            <div className="um-modal-header">
              <h2>User History - {viewUserLogs}</h2>
              <button className="um-modal-close" onClick={closeHistoryModal}>×</button>
            </div>
            <div className="um-modal-content">
              {userLogs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#999' }}>No activity history found for this user.</p>
              ) : (
                <table className="um-history-table">
                  <thead>
                    <tr>
                      <th>Date & Time</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userLogs.map((log, idx) => (
                      <tr key={idx}>
                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                        <td>{log.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibrarianUserManagement;
