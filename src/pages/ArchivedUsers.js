import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faTrash, faUndo } from "@fortawesome/free-solid-svg-icons";
import "../components/App.css";
import "../styles/user-management.css";

const ArchivedUsers = () => {
  const [archivedUsers, setArchivedUsers] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchArchivedUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/archived-users");
      const data = await res.json();
      if (res.ok) {
        setArchivedUsers(data.users);
        setError("");
      } else {
        setError(data.error || "Failed to fetch archived users.");
      }
    } catch (err) {
      setError("Error fetching archived users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArchivedUsers();
  }, []);

  const permanentlyDeleteUser = async (userId, userEmail) => {
    const confirm = window.confirm(
      `Are you sure you want to PERMANENTLY delete ${userEmail}? This action cannot be undone.`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/archived-users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setArchivedUsers(archivedUsers.filter(user => user._id !== userId));
        await Swal.fire({
          title: "Parañaledge",
          text: "User permanently deleted.",
          icon: "success",
          confirmButtonText: "OK"
        });
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.error || "Failed to delete user.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Parañaledge",
        text: "Error deleting user.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const restoreUser = async (userId, userEmail) => {
    const confirm = window.confirm(
      `Are you sure you want to restore ${userEmail} to active users?`
    );
    if (!confirm) return;

    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/archived-users/${userId}/restore`, {
        method: "PUT",
      });
      if (res.ok) {
        setArchivedUsers(archivedUsers.filter(user => user._id !== userId));
        await Swal.fire({
          title: "Parañaledge",
          text: "User restored successfully.",
          icon: "success",
          confirmButtonText: "OK"
        });
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.error || "Failed to restore user.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        title: "Parañaledge",
        text: "Error restoring user.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <p style={styles.loadingText}>Loading archived users...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerContainer}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
          Back
        </button>
        <h1 style={styles.title}>Archived Users</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {archivedUsers.length === 0 ? (
        <div style={styles.noDataMessage}>
          <p>No archived users found.</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Contact</th>
                <th style={styles.th}>Address</th>
                <th style={styles.th}>Role</th>
                <th style={styles.th}>Archived Date</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {archivedUsers.map((user) => (
                <tr key={user._id} style={styles.tableRow}>
                  <td style={styles.td}>
                    {user.firstName} {user.lastName}
                  </td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.contactNumber}</td>
                  <td style={styles.td}>{user.address}</td>
                  <td style={styles.td}>
                    <span style={styles.roleBadge}>{user.role}</span>
                  </td>
                  <td style={styles.td}>
                    {new Date(user.archivedAt).toLocaleDateString()}
                  </td>
                  <td style={styles.td}>
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => restoreUser(user._id, user.email)}
                        style={styles.restoreBtn}
                        title="Restore user to active"
                      >
                        <FontAwesomeIcon icon={faUndo} />
                      </button>
                      <button
                        onClick={() => permanentlyDeleteUser(user._id, user.email)}
                        style={styles.deleteBtn}
                        title="Permanently delete user"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Total Archived</div>
          <div style={styles.statValue}>{archivedUsers.length}</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  headerContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    backgroundColor: '#f1f3f6',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    transition: 'background-color 0.3s ease',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#333',
    margin: 0,
  },
  errorMessage: {
    padding: '12px 16px',
    background: '#ffebee',
    color: '#c62828',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #ef5350',
  },
  noDataMessage: {
    padding: '40px 16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginBottom: '24px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    background: '#fff',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  tableHeader: {
    background: '#1dbf73',
    color: '#fff',
    borderBottom: '2px solid #15a354',
  },
  th: {
    padding: '14px 12px',
    textAlign: 'left',
    fontWeight: '600',
    borderRight: '1px solid #0d7a47',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '12px 12px',
    color: '#333',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    backgroundColor: '#e3f2fd',
    color: '#1976d2',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  actionButtons: {
    display: 'flex',
    gap: '8px',
  },
  restoreBtn: {
    padding: '6px 10px',
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  deleteBtn: {
    padding: '6px 10px',
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s ease',
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '24px',
  },
  statCard: {
    padding: '16px',
    background: '#f9f9f9',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  statLabel: {
    fontSize: '12px',
    color: '#666',
    fontWeight: '600',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1dbf73',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
    marginTop: '40px',
  },
};

export default ArchivedUsers;
