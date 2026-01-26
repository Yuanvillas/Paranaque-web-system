import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faLog, faCheckCircle, faTimesCircle, faShieldAlt } from "@fortawesome/free-solid-svg-icons";
import "../components/App.css";

const AdminLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [filterAction, setFilterAction] = useState("all");

  useEffect(() => {
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

  const getActionIcon = (action) => {
    if (action.includes("Successful login")) return { icon: faCheckCircle, color: "#2e7d32", bg: "#e8f5e9" };
    if (action.includes("Failed login")) return { icon: faTimesCircle, color: "#d32f2f", bg: "#ffebee" };
    if (action.includes("logged out")) return { icon: faShieldAlt, color: "#1976d2", bg: "#e3f2fd" };
    return { icon: faLog, color: "#666", bg: "#f5f5f5" };
  };

  const filteredLogs = filterAction === "all" 
    ? logs 
    : logs.filter(log => log.action.toLowerCase().includes(filterAction.toLowerCase()));

  return (
    <div className="log-activity-container" style={styles.mainContainer}>
      <div style={styles.headerContainer}>
        <button 
          onClick={() => navigate(-1)} 
          style={styles.backButton}
          onMouseEnter={(e) => e.target.style.backgroundColor = styles.backButtonHover.backgroundColor}
          onMouseLeave={(e) => e.target.style.backgroundColor = styles.backButton.backgroundColor}
        >
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
          Back
        </button>
        <h2 style={styles.title}>
          <FontAwesomeIcon icon={faLog} style={{ marginRight: '12px', color: '#2e7d32' }} />
          Log Activities
        </h2>
        <div style={styles.logCount}>
          <span style={styles.countBadge}>{filteredLogs.length}</span>
        </div>
      </div>

      <div style={styles.filterContainer}>
        <label style={styles.filterLabel}>Filter by action:</label>
        <div style={styles.filterButtons}>
          <button 
            onClick={() => setFilterAction("all")}
            style={{
              ...styles.filterButton,
              background: filterAction === "all" ? "#2e7d32" : "#f0f0f0",
              color: filterAction === "all" ? "white" : "#333"
            }}
          >
            All ({logs.length})
          </button>
          <button 
            onClick={() => setFilterAction("success")}
            style={{
              ...styles.filterButton,
              background: filterAction === "success" ? "#2e7d32" : "#f0f0f0",
              color: filterAction === "success" ? "white" : "#333"
            }}
          >
            Successful ({logs.filter(l => l.action.includes("Successful")).length})
          </button>
          <button 
            onClick={() => setFilterAction("failed")}
            style={{
              ...styles.filterButton,
              background: filterAction === "failed" ? "#2e7d32" : "#f0f0f0",
              color: filterAction === "failed" ? "white" : "#333"
            }}
          >
            Failed ({logs.filter(l => l.action.includes("Failed")).length})
          </button>
          <button 
            onClick={() => setFilterAction("logout")}
            style={{
              ...styles.filterButton,
              background: filterAction === "logout" ? "#2e7d32" : "#f0f0f0",
              color: filterAction === "logout" ? "white" : "#333"
            }}
          >
            Logout ({logs.filter(l => l.action.includes("logged out")).length})
          </button>
        </div>
      </div>

      {error && <p style={styles.errorMessage}>{error}</p>}
      
      <div style={styles.tableWrapper}>
        <table className="log-table" style={styles.table}>
          <caption style={styles.caption}>All User Activity Logs</caption>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Action</th>
              <th style={styles.th}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="3" style={styles.emptyCell}>
                  <FontAwesomeIcon icon={faLog} style={{ fontSize: '32px', color: '#ccc', marginBottom: '12px', display: 'block' }} />
                  No activity logs found.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log, idx) => {
                const actionInfo = getActionIcon(log.action);
                return (
                  <tr key={idx} style={styles.tableRow}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={styles.td}>
                      <span style={styles.emailBadge}>{log.userEmail}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionCell}>
                        <div style={{
                          ...styles.actionIcon,
                          backgroundColor: actionInfo.bg,
                          color: actionInfo.color
                        }}>
                          <FontAwesomeIcon icon={actionInfo.icon} />
                        </div>
                        <span style={styles.actionText}>{log.action}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.timestamp}>{new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  mainContainer: {
    maxWidth: 1200,
    margin: '40px auto',
    padding: '40px',
    background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
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
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  backButtonHover: {
    backgroundColor: '#e0e0e0',
  },
  title: {
    textAlign: 'center',
    fontSize: '28px',
    fontWeight: '700',
    color: '#2c3e50',
    margin: 0,
    flex: 1,
  },
  logCount: {
    width: '60px',
    textAlign: 'right',
  },
  countBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: '#2e7d32',
    color: 'white',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '700',
  },
  filterContainer: {
    marginBottom: '24px',
    padding: '20px',
    background: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  filterLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '12px',
  },
  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  filterButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  tableWrapper: {
    maxHeight: 600,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: 10,
    background: 'white',
    padding: 0,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '0.95rem',
  },
  caption: {
    captionSide: 'top',
    fontWeight: 'bold',
    fontSize: '1.05rem',
    padding: '16px',
    textAlign: 'left',
    color: '#2c3e50',
    borderBottom: '2px solid #e0e0e0',
  },
  tableHeader: {
    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
    stickyTop: 0,
  },
  th: {
    padding: '14px 16px',
    textAlign: 'left',
    fontWeight: '700',
    color: 'white',
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
    cursor: 'pointer',
  },
  td: {
    padding: '14px 16px',
    color: '#333',
  },
  emailBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    background: '#f0f0f0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
  },
  actionCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actionIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    fontSize: '14px',
  },
  actionText: {
    fontSize: '13px',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace',
  },
  emptyCell: {
    textAlign: 'center',
    color: '#888',
    padding: 40,
    fontSize: '14px',
  },
  errorMessage: {
    padding: '12px 16px',
    backgroundColor: '#ffebee',
    color: '#d32f2f',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '500',
  },
};

export default AdminLogs;

export default AdminLogs;
