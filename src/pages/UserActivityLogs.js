import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faHistory,
  faCheckCircle,
  faTimesCircle,
  faSign,
  faBook,
  faCalendarAlt,
  faFilter,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import "../components/App.css";

const UserActivityLogs = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState(null);
  const pageSize = 10;

  const userEmail = localStorage.getItem("userEmail");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filterAction && filterAction !== "all"
          ? `https://paranaque-web-system.onrender.com/api/logs/user/${userEmail}?page=${currentPage}&pageSize=${pageSize}&actionType=${filterAction}`
          : `https://paranaque-web-system.onrender.com/api/logs/user/${userEmail}?page=${currentPage}&pageSize=${pageSize}`;

      const res = await fetch(url);
      const data = await res.json();

      if (res.ok) {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      } else {
        setError("Failed to fetch activity logs.");
      }
    } catch (err) {
      console.error("Error fetching logs:", err);
      setError("Error fetching activity logs.");
    } finally {
      setLoading(false);
    }
  }, [userEmail, filterAction, currentPage, pageSize]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(
        `https://paranaque-web-system.onrender.com/api/logs/stats/${userEmail}`
      );
      const data = await res.json();
      if (res.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, [userEmail]);

  useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }
    fetchLogs();
    fetchStats();
  }, [userEmail, fetchLogs, fetchStats, navigate]);

  const getActionIcon = (action) => {
    const iconMap = {
      login: { icon: faSign, color: "#2e7d32", bg: "#e8f5e9", label: "Login" },
      logout: {
        icon: faSign,
        color: "#1976d2",
        bg: "#e3f2fd",
        label: "Logout",
      },
      borrow: { icon: faBook, color: "#ff6f00", bg: "#fff3e0", label: "Borrow" },
      reserve: {
        icon: faCalendarAlt,
        color: "#7b1fa2",
        bg: "#f3e5f5",
        label: "Reserve",
      },
      return: { icon: faBook, color: "#c62828", bg: "#ffebee", label: "Return" },
      register: {
        icon: faCheckCircle,
        color: "#2e7d32",
        bg: "#e8f5e9",
        label: "Register",
      },
    };

    return (
      iconMap[action] || {
        icon: faHistory,
        color: "#666",
        bg: "#f5f5f5",
        label: action,
      }
    );
  };

  const getStatusIcon = (status) => {
    if (status === "success")
      return { icon: faCheckCircle, color: "#2e7d32" };
    if (status === "failed") return { icon: faTimesCircle, color: "#d32f2f" };
    return { icon: faSpinner, color: "#ff9800" };
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const filteredLogs = logs;

  return (
    <div className="activity-logs-container" style={styles.mainContainer}>
      <div style={styles.headerContainer}>
        <button
          onClick={() => navigate(-1)}
          style={styles.backButton}
          onMouseEnter={(e) =>
            (e.target.style.backgroundColor =
              styles.backButtonHover.backgroundColor)
          }
          onMouseLeave={(e) =>
            (e.target.style.backgroundColor = styles.backButton.backgroundColor)
          }
        >
          <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: "8px" }} />
          Back
        </button>
        <h2 style={styles.title}>
          <FontAwesomeIcon icon={faHistory} style={{ marginRight: "10px" }} />
          My Activity Logs
        </h2>
      </div>

      {/* Statistics Section */}
      {stats && (
        <div style={styles.statsSection}>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.stats.totalLogins}</div>
            <div style={styles.statLabel}>Total Logins</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.stats.totalBorrows}</div>
            <div style={styles.statLabel}>Books Borrowed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.stats.totalReserves}</div>
            <div style={styles.statLabel}>Reservations</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statValue}>{stats.stats.totalReturns}</div>
            <div style={styles.statLabel}>Returns</div>
          </div>
          {stats.lastLogin && (
            <div style={styles.lastLoginCard}>
              <div style={styles.lastLoginLabel}>Last Login</div>
              <div style={styles.lastLoginDate}>{stats.lastLogin.formattedDate}</div>
            </div>
          )}
        </div>
      )}

      {/* Filter Section */}
      <div style={styles.filterSection}>
        <label style={styles.filterLabel}>
          <FontAwesomeIcon icon={faFilter} style={{ marginRight: "8px" }} />
          Filter by Action:
        </label>
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setCurrentPage(1);
          }}
          style={styles.filterSelect}
        >
          <option value="all">All Actions</option>
          <option value="auth">Authentication (Login/Logout)</option>
          <option value="transaction">Transactions (Borrow/Reserve/Return)</option>
          <option value="account">Account Actions</option>
        </select>
      </div>

      {error && <div style={styles.errorMessage}>{error}</div>}

      {/* Logs Table */}
      <div style={styles.logsSection}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <FontAwesomeIcon
              icon={faSpinner}
              spin
              style={styles.loadingIcon}
            />
            <p>Loading activity logs...</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <>
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.tableCell}>Date & Time</th>
                    <th style={styles.tableCell}>Action</th>
                    <th style={styles.tableCell}>Description</th>
                    <th style={styles.tableCell}>Status</th>
                    <th style={styles.tableCell}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log, index) => {
                    const actionInfo = getActionIcon(log.action);
                    const statusInfo = getStatusIcon(log.status);
                    return (
                      <tr key={log._id} style={styles.tableRow}>
                        <td style={styles.tableCell}>{log.formattedDate}</td>
                        <td style={styles.tableCell}>
                          <div
                            style={{
                              ...styles.actionBadge,
                              backgroundColor: actionInfo.bg,
                              color: actionInfo.color,
                            }}
                          >
                            <FontAwesomeIcon
                              icon={actionInfo.icon}
                              style={{ marginRight: "6px" }}
                            />
                            {actionInfo.label}
                          </div>
                        </td>
                        <td style={styles.tableCell}>{log.description}</td>
                        <td style={styles.tableCell}>
                          <div style={{ ...styles.statusBadge }}>
                            <FontAwesomeIcon
                              icon={statusInfo.icon}
                              style={{
                                marginRight: "6px",
                                color: statusInfo.color,
                              }}
                            />
                            <span
                              style={{
                                textTransform: "capitalize",
                                color: statusInfo.color,
                              }}
                            >
                              {log.status}
                            </span>
                          </div>
                        </td>
                        <td style={styles.tableCell}>
                          {log.bookTitle && (
                            <span style={styles.detailTag}>
                              📖 {log.bookTitle}
                            </span>
                          )}
                          {log.ipAddress && (
                            <span style={styles.detailTag}>
                              🌐 {log.ipAddress}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div style={styles.paginationContainer}>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                  ...styles.paginationButton,
                  opacity: currentPage === 1 ? 0.5 : 1,
                  cursor: currentPage === 1 ? "not-allowed" : "pointer",
                }}
              >
                Previous
              </button>

              <div style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                  ...styles.paginationButton,
                  opacity: currentPage === totalPages ? 0.5 : 1,
                  cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                }}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <div style={styles.noLogsMessage}>
            <FontAwesomeIcon icon={faHistory} style={styles.noLogsIcon} />
            <p>No activity logs found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  mainContainer: {
    padding: "20px",
    backgroundColor: "#f5f5f5",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
  },
  headerContainer: {
    display: "flex",
    alignItems: "center",
    marginBottom: "30px",
    gap: "15px",
  },
  backButton: {
    padding: "10px 20px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
  backButtonHover: {
    backgroundColor: "#1b5e20",
  },
  title: {
    fontSize: "28px",
    color: "#2e7d32",
    margin: 0,
    flex: 1,
  },
  statsSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },
  statCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    textAlign: "center",
    border: "2px solid #e0e0e0",
  },
  statValue: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: "5px",
  },
  statLabel: {
    fontSize: "12px",
    color: "#666",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  lastLoginCard: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    border: "2px solid #1976d2",
  },
  lastLoginLabel: {
    fontSize: "12px",
    color: "#1976d2",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: "8px",
  },
  lastLoginDate: {
    fontSize: "14px",
    color: "#333",
    fontWeight: "bold",
  },
  filterSection: {
    backgroundColor: "white",
    padding: "20px",
    borderRadius: "8px",
    marginBottom: "20px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  },
  filterLabel: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 0,
  },
  filterSelect: {
    padding: "8px 12px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    fontSize: "14px",
    cursor: "pointer",
    flex: 1,
    maxWidth: "300px",
  },
  logsSection: {
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    overflow: "hidden",
  },
  tableWrapper: {
    overflowX: "auto",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
  },
  tableHeader: {
    backgroundColor: "#2e7d32",
    color: "white",
  },
  tableCell: {
    padding: "12px 15px",
    textAlign: "left",
    fontSize: "14px",
    borderBottom: "1px solid #e0e0e0",
  },
  tableRow: {
    transition: "background-color 0.2s",
    "&:hover": {
      backgroundColor: "#f9f9f9",
    },
  },
  actionBadge: {
    display: "inline-block",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "bold",
    whiteSpace: "nowrap",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    fontSize: "12px",
    fontWeight: "bold",
  },
  detailTag: {
    display: "inline-block",
    backgroundColor: "#f0f0f0",
    padding: "4px 8px",
    borderRadius: "4px",
    marginRight: "5px",
    fontSize: "12px",
    marginBottom: "3px",
  },
  paginationContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
    borderTop: "1px solid #e0e0e0",
  },
  paginationButton: {
    padding: "8px 16px",
    backgroundColor: "#2e7d32",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "bold",
    transition: "background-color 0.3s",
  },
  pageInfo: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#333",
    minWidth: "120px",
    textAlign: "center",
  },
  loadingContainer: {
    textAlign: "center",
    padding: "40px",
  },
  loadingIcon: {
    fontSize: "32px",
    color: "#2e7d32",
    marginBottom: "10px",
  },
  noLogsMessage: {
    textAlign: "center",
    padding: "40px",
    color: "#999",
  },
  noLogsIcon: {
    fontSize: "48px",
    color: "#ddd",
    marginBottom: "10px",
  },
  errorMessage: {
    backgroundColor: "#ffebee",
    color: "#c62828",
    padding: "12px 15px",
    borderRadius: "5px",
    marginBottom: "20px",
    borderLeft: "4px solid #c62828",
  },
};

export default UserActivityLogs;
