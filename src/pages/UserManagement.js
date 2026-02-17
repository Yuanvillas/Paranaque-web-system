import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import "../styles/user-management.css";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewUserLogs, setViewUserLogs] = useState(null);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    contactNumber: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [createErrors, setCreateErrors] = useState({});
  const navigate = useNavigate();

  const ADMIN_PASSCODE = "1234";

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

  const deleteUser = async (userId) => {
    const confirm = window.confirm("Are you sure you want to archive this user? The user will be moved to the archive storage.");
    if (!confirm) return;

    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(users.filter(user => user._id !== userId));
        await Swal.fire({
          title: "Parañaledge",
          text: "User archived successfully. The user can be found in the User Archive.",
          icon: "success",
          confirmButtonText: "OK"
        });
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.error || "Failed to archive user.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber,
      address: user.address,
      email: user.email,
      role: user.role || 'user',
      password: '',
    });
    setEditError("");
  };

  const handleEditChange = (e) => {
    console.log("Edit change:", e.target.name, e.target.value);
    const { name, value } = e.target;
    let passcode = window.prompt("Enter passcode to set user as admin:");
    if (passcode !== ADMIN_PASSCODE) {
      setEditError("Incorrect passcode. Role not changed.");
      return;
    } else {
      setEditError("");
    }
    passcode = "";
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeUserRole = async (e, userId) => {
    console.log("Edit change:", e.target.name, e.target.value, userId);
    const passcode = window.prompt("Enter passcode to set user as admin:");
    if (passcode !== ADMIN_PASSCODE) {
      setEditError("Incorrect passcode. Role not changed.");
      return;
    } else {
      setEditError("");
    }
    console.log("Passcode correct. Updating role.", passcode);
    await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}/update-role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: e.target.value })
    });
  };

  const saveEdit = async (userId) => {
    if (!editForm.firstName || !editForm.lastName || !editForm.contactNumber || !editForm.address) {
      setEditError("All fields are required.");
      return;
    }
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, ...editForm } : u));
        setEditingUser(null);
        setEditError("");
      } else {
        setEditError(data.message || "Failed to update user.");
      }
    } catch (err) {
      setEditError("Error updating user.");
    }
  };

  const handleViewHistory = (email) => {
    setViewUserLogs(email);
  }

  const cancelEdit = () => {
    setEditingUser(null);
    setEditError("");
  };

  const validateCreateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) error = "This field is required.";
        else if (!/^[A-Za-z]+$/.test(value)) error = "Only letters are allowed.";
        break;
      case "contactNumber":
        if (!/^09\d{9}$/.test(value)) error = "Must be 11 digits and start with '09'.";
        break;
      case "email":
        if (!value) {
          error = "Email is required.";
        } else {
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          if (!emailRegex.test(value)) {
            error = "Please enter a valid email address.";
          } else {
            const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
            if (!gmailRegex.test(value)) {
              error = "Only Gmail addresses are allowed.";
            }
          }
        }
        break;
      case "password":
        if (!value) error = "Password is required.";
        else if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/.test(value)
        )
          error = "Password must include uppercase, lowercase, number, special character.";
        break;
      case "confirmPassword":
        if (value !== createForm.password) error = "Passwords do not match.";
        break;
      case "address":
        if (!value.trim()) error = "Address is required.";
        break;
      default:
        break;
    }
    setCreateErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    validateCreateField(name, value);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = ["firstName", "lastName", "contactNumber", "email", "password", "confirmPassword", "address"];
    let newErrors = {};
    fieldsToValidate.forEach((field) => {
      validateCreateField(field, createForm[field]);
    });

    if (Object.values(newErrors).some(err => err !== "")) {
      return;
    }

    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          contactNumber: createForm.contactNumber,
          email: createForm.email,
          password: createForm.password,
          address: createForm.address,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Parañaledge",
          text: "Account created successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });
        setShowCreateModal(false);
        setCreateForm({
          firstName: "",
          lastName: "",
          suffix: "",
          contactNumber: "",
          address: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setCreateErrors({});
        fetchUsers();
      } else {
        Swal.fire({
          title: "Parañaledge",
          text: data.message || "Failed to create account.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Parañaledge",
        text: "Error creating account.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    setCreateForm({
      firstName: "",
      lastName: "",
      suffix: "",
      contactNumber: "",
      address: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setCreateErrors({});
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      Swal.fire({
        title: "Parañaledge",
        text: "No users to export.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Contact Number", "Address", "Role"];
    const rows = users.map(user => [
      user.firstName,
      user.lastName,
      user.email,
      user.contactNumber,
      user.address,
      user.role
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: "Parañaledge",
      text: `Successfully exported ${users.length} users.`,
      icon: "success",
      confirmButtonText: "OK"
    });
  };

  useEffect(() => {
    fetchUsers();
    fetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
      })
      .catch((err) => {
        console.error('Error fetching logs:', err);
        setError("Failed to fetch logs.");
      });
  }, []);

  return (
    <div className="dashboard">
      <main className="main-content">
        <section className="content">
          <div className="um">
            <div className="um-header">
              <button className="um-back-btn" onClick={() => navigate('/admin-dashboard')}>
                ← Back
              </button>
              <h1 className="um-title">User Management</h1>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="um-btn um-create" onClick={() => navigate('/admin/archived-users')}>
                  📦 Archived Users
                </button>
                <button className="um-btn um-create" onClick={exportUsersToCSV}>
                  📥 Export Users
                </button>
                <button className="um-btn um-create" onClick={() => {
                  setShowCreateModal(true);
                  setCreateForm({
                    firstName: "",
                    lastName: "",
                    suffix: "",
                    contactNumber: "",
                    address: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                  setCreateErrors({});
                }}>
                  + Create New Account
                </button>
              </div>
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
            ) : (() => {
              // Filter users based on role and search
              const filteredUsers = users
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
                });

              // Calculate pagination
              const totalPages = Math.ceil(filteredUsers.length / pageSize);
              const startIndex = (currentPage - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

              // Reset to page 1 if current page exceeds total pages
              if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(1);
              }

              return (
                <div>
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
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                              No users found on this page.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((user, idx) => (
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

                            <td>
                              <select
                                name="role"
                                className="um-select"
                                value={editForm.role}
                                onChange={(e) => handleChangeUserRole(e, user._id)}
                                defaultValue={user.role}
                                style={{
                                  fontWeight: 'bold',
                                  color: user.role === 'admin' ? '#F44336' : 
                                         user.role === 'librarian' ? '#FF9800' : 
                                         '#2196F3'
                                }}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                                <option value="librarian">Librarian</option>
                              </select>
                            </td>

                            <td className="um-actions">
                              <button onClick={() => startEdit(user)} className="um-btn um-edit">Edit</button>
                              <button onClick={() => deleteUser(user._id)} className="um-btn um-delete">Archive</button>
                              <button onClick={() => handleViewHistory(user.email)} className="um-btn um-save">History</button>
                            </td>
                          </tr>
                        ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px'
                    }}>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ← Previous
                      </button>

                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        Page {currentPage} of {totalPages} (Showing {paginatedUsers.length} of {filteredUsers.length} users)
                      </span>

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === totalPages ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}

            {editError && <p className="um-error mt-10">{editError}</p>}
          </div>

          {editingUser && (
            <div className="modal-overlay">
              <div className="modal-content">

                <h2>Edit User</h2>

                <input
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="First Name"
                />

                <input
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Last Name"
                />

                <input
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Contact Number"
                />

                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Address"
                />

                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  className="modal-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="librarian">Librarian</option>
                </select>

                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="New Password (leave empty to keep current)"
                  autoComplete="new-password"
                />

                {editError && <p className="error-text">{editError}</p>}

                <div className="modal-actions">
                  <button className="modal-save" onClick={() => saveEdit(editingUser)}>Save</button>
                  <button className="modal-cancel" onClick={cancelEdit}>Cancel</button>
                </div>

              </div>
            </div>
          )}

          {showCreateModal && (
            <div className="modal-overlay">
              <div className="modal-content">
                <h2>Create New Account</h2>

                <input
                  type="text"
                  name="firstName"
                  value={createForm.firstName}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="First Name"
                />
                {createErrors.firstName && <p className="error-text">{createErrors.firstName}</p>}

                <input
                  type="text"
                  name="lastName"
                  value={createForm.lastName}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Last Name"
                />
                {createErrors.lastName && <p className="error-text">{createErrors.lastName}</p>}

                <input
                  type="text"
                  name="contactNumber"
                  value={createForm.contactNumber}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Contact Number (09XXXXXXXXX)"
                />
                {createErrors.contactNumber && <p className="error-text">{createErrors.contactNumber}</p>}

                <input
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Email (Gmail only)"
                  autoComplete="off"
                />
                {createErrors.email && <p className="error-text">{createErrors.email}</p>}

                <input
                  type="text"
                  name="address"
                  value={createForm.address}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Address"
                  autoComplete="off"
                />
                {createErrors.address && <p className="error-text">{createErrors.address}</p>}

                <input
                  type="password"
                  name="password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Password"
                  autoComplete="new-password"
                />
                {createErrors.password && <p className="error-text">{createErrors.password}</p>}

                <input
                  type="password"
                  name="confirmPassword"
                  value={createForm.confirmPassword}
                  onChange={handleCreateChange}
                  className="modal-input"
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
                {createErrors.confirmPassword && <p className="error-text">{createErrors.confirmPassword}</p>}

                <div className="modal-actions">
                  <button className="modal-save" onClick={handleCreateAccount}>Create</button>
                  <button className="modal-cancel" onClick={cancelCreate}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {viewUserLogs && (
            <div className="modal-overlay">
              <div className="modal-content">

                <button className="modal-close-btn" onClick={() => {
                  setViewUserLogs(null);
                  setHistorySearchQuery('');
                }}>
                  ✕
                </button>

                <h2>User Borrowed & Reserved Books History</h2>

                {/* Search bar inside modal */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: '#f5f5f5' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search book activities (title, action, date)..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
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
                </div>

                {(() => {
                  const userLogs = logs.filter(log => log.userEmail === viewUserLogs);

                  const relevantLogs = userLogs
                    .filter(log =>
                      log.action.includes("Requested to borrow book:") ||
                      log.action.includes("Returned book:") ||
                      log.action.includes("Reservation approved by") ||
                      log.action.includes("Reservation requested for book:")
                    )
                    .filter(log => {
                      if (!historySearchQuery) return true;
                      const searchLower = historySearchQuery.toLowerCase();
                      return log.action.toLowerCase().includes(searchLower);
                    })
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                  if (relevantLogs.length === 0) {
                    return <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No logs available.</p>;
                  }

                  return (
                    <div className="history-container">
                      {relevantLogs.map((log, idx) => (
                        <div key={idx} className="history-item">
                          <p className="history-action">{log.action}</p>
                          <p className="history-date">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default UserManagement;
