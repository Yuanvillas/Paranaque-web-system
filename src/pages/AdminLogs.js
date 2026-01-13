import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import "../components/App.css";

const AdminLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched logs:', data); // Debug log
        setLogs(data.logs);
      })
      .catch((err) => {
        console.error('Error fetching logs:', err); // Debug log
        setError("Failed to fetch logs.");
      });
  }, []);

  return (
    <div className="log-activity-container" style={styles.mainContainer}>
      <div style={styles.headerContainer}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: '8px' }} />
          Back
        </button>
        <h2 style={styles.title}>Log Activities</h2>
        <div style={{ width: '60px' }}></div>
      </div>
      {error && <p className="error-message">{error}</p>}
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
            {logs.length === 0 ? (
              <tr>
                <td colSpan="3" style={styles.emptyCell}>No activity logs found.</td>
              </tr>
            ) : (
              logs.map((log, idx) => (
                <tr key={idx} style={styles.tableRow}>
                  <td style={styles.td}>{log.userEmail}</td>
                  <td style={styles.td}>{log.action}</td>
                  <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  mainContainer: {
    maxWidth: 1000,
    margin: '40px auto',
    padding: '32px',
    background: '#fafbfc',
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
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
  backButtonHover: {
    backgroundColor: '#e0e0e0',
  },
  title: {
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
    margin: 0,
  },
  tableWrapper: {
    maxHeight: 500,
    overflowY: 'auto',
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    padding: 16,
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '1rem',
  },
  caption: {
    captionSide: 'top',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    marginBottom: 8,
    textAlign: 'left',
    color: '#555',
  },
  tableHeader: {
    background: '#f1f3f6',
  },
  th: {
    padding: '12px 8px',
    borderBottom: '2px solid #e0e0e0',
    textAlign: 'left',
    fontWeight: '600',
    color: '#555',
  },
  tableRow: {
    borderBottom: '1px solid #f0f0f0',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '12px 8px',
    borderBottom: '1px solid #f0f0f0',
    color: '#333',
  },
  emptyCell: {
    textAlign: 'center',
    color: '#888',
    padding: 24,
  },
};

export default AdminLogs;
