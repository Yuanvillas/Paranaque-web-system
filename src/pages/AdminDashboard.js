// src/pages/AdminDashboard.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import BorrowedBooksTable from "../components/BorrowedBooksTable";
import TransactionsTable from "../components/TransactionsTable";
import PendingReservationsTable from "../components/PendingReservationsTable";
import PendingBorrowingTable from "../components/PendingBorrowingTable";
import AddBook from "./AddBook";
import ReservedBooksTable from "../components/ReservedBooksTable";
import logo from "../imgs/liblogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faChartBar,
  faBook,
  faFileAlt,
  faSignOutAlt,
  faGear,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import BooksTable from "../components/BooksTable";
import AdminDashboardTable from "../components/AdminDashboardTable";
import PendingRequestTable from "../components/PendingRequestTable";
import UploadAvatar from "../components/UploadAvatar";
import BorrowedReturnedChart from "../components/BorrowedReturnedChart";
import UserEntryMonitor from "../components/UserEntryMonitor";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("userEmail");

  const [selectedResource, setSelectedResource] = useState(null);
  const [storedBooks, setStoredBooks] = useState([]);
  const [error, setError] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: '', profilePicture: '' });
  const [showAddBookModal, setShowAddBookModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [logs, setLogs] = useState([]);
  const [borrowedBoos, setBorrowedBooks] = useState([]);
  const [returnedBooks, setReturnedBooks] = useState([]);

  const handleSectionClick = (name) => {
    if (name === "User Management") {
      navigate("/admin/user-management");
    } else if (name === "Analytics") {
      navigate("/admin/analytics");
    } else if (name === "Log Activities") {
      navigate("/admin/logs");
    } else if (name === "Resource Management") {
      if (selectedResource === "Resource Management") {
        setSelectedResource(null);
        setSelectedSubResource(null);
      } else {
        setSelectedResource("Resource Management");
        setSelectedSubResource("All Books"); // Show All Books by default
      }
    } else {
      Swal.fire({
        title: "Parañaledge",
        text: `${name} clicked`,
        icon: "info",
        confirmButtonText: "OK"
      });
    }
  };

  useEffect(() => {
    fetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched logs:', data);
        setLogs(data.logs);
        const resBorrowedBook = data.logs
          .filter(log =>
            log.action.includes("Requested to borrow book:")
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const resReturnedBook = data.logs
          .filter(log =>
            log.action.includes("Returned book:")
          )
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setBorrowedBooks(resBorrowedBook);
        setReturnedBooks(resReturnedBook);
      })
      .catch((err) => {
        console.error('Error fetching logs:', err); // Debug log
        setError("Failed to fetch logs.");
      });

  }, [userEmail]);


  const resourceOptions = [
    "All Books",
    "Archive Books",
    "Borrowed Books",
    "Reserved Books",
    "Pending Requests",
    "Transactions"
  ];

  const handleResourceClick = (option) => {
    if (option === "Add Book") {
      setShowAddBookModal(true);
    } else if (option === "Archive Books") {
      navigate("/admin/archived-books");
    } else if (option === "All Books") {
      setSelectedSubResource("All Books");
    } else if (option === "Borrowed Books") {
      setSelectedSubResource("Borrowed Books");
    } else if (option === "Reserved Books") {
      setSelectedSubResource("Reserved Books");
    } else if (option === "Pending Requests") {
      setSelectedSubResource("Pending Requests");
    } else if (option === "Transactions") {
      setSelectedSubResource("Transactions");
    }
  };

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const response = await fetch("https://paranaque-web-system.onrender.com/api/books");
        const data = await response.json();
        const availableBooks = data.books.filter((book) => !book.archived);
        setStoredBooks(availableBooks);
      } catch (error) {
        console.error("Error fetching books:", error);
        setError("Failed to load books");
      }
    };

    fetchBooks();
  }, [selectedResource]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    console.log("Stored User:", storedUser.profilePicture);
    if (!storedUser || (storedUser.role !== "admin" && storedUser.role !== "librarian")) {
      navigate("/"); // redirect to homepage
    }
    setUser({
      name: `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim(),
      email: storedUser.email,
      role: storedUser.role || '',
      profilePicture: storedUser.profilePicture || ''
    });
  }, []);

  const handleLogout = () => {
    // Clear any stored tokens or session data if used
    localStorage.removeItem('token'); // If you use a token
    // Redirect to login page
    navigate('/');
  };

  const [selectedSubResource, setSelectedSubResource] = useState("");

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo2">
          <img style={{ width: '50px' }} src={logo} alt="School" />
        </div>
        <nav className="nav-links">
          {user.role === "admin" && (
            <button onClick={() => handleSectionClick("User Management")}>
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faUsers} />
              {!isCollapsed && <span style={{ marginLeft: 8 }}>User Management</span>}
            </button>
          )}
          <button onClick={() => handleSectionClick("Analytics")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faChartBar} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Analytics</span>}
          </button>
          <button onClick={() => handleSectionClick("Resource Management")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faBook} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Resources</span>}
          </button>
          {user.role === "admin" && (
            <button onClick={() => handleSectionClick("Log Activities")}>
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faFileAlt} />
              {!isCollapsed && <span style={{ marginLeft: 8 }}>Logs</span>}
            </button>
          )}
          <button onClick={handleLogout}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faSignOutAlt} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Logout</span>}
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header" style={{ justifyContent: "right" }}>
          <div className="profile-container">
            <div
              className="admin-profile-icon"
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "#e9ecef",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "2rem",
                cursor: "pointer",
                transition: "box-shadow 0.2s",
                marginLeft: "auto",
                marginRight: "auto"
              }}
              onClick={() => setShowProfile(true)}
              title="View Profile"
            >
              {
                user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt="Profile"
                    style={{ width: "50px", height: "50px", borderRadius: "50%" }}
                  />
                ) : (
                  <FontAwesomeIcon style={{ color: "#ccc", fontSize: '25px' }} icon={faUser} />
                )
              }

            </div>
            {showProfile && (
              <div
                className="modal-overlay"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  width: "100vw",
                  height: "100vh",
                  background: "rgba(0,0,0,0.4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1000
                }}
                onClick={() => setShowProfile(false)}
              >
                <div
                  className="modal-content"
                  style={{
                    background: "#fff",
                    padding: "2rem",
                    borderRadius: "10px",
                    width: "400px",
                    minWidth: "320px",
                    maxWidth: "90vw",
                    position: "relative"
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setShowProfile(false)}
                    style={{
                      position: "absolute",
                      top: 10,
                      right: 16,
                      background: "none",
                      border: "none",
                      fontSize: "1.5rem",
                      cursor: "pointer"
                    }}
                    aria-label="Close"
                  >
                    ×
                  </button>
                  <div style={{ textAlign: "center" }}>
                    <div style={{
                      width: "70px",
                      height: "70px",
                      borderRadius: "50%",
                      background: "#e9ecef",
                      margin: "0 auto 10px auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "2.5rem"
                    }}>
                      {
                        user.profilePicture ? (
                          <img
                            src={user.profilePicture}
                            alt="Profile"
                            style={{ width: "70px", height: "70px", borderRadius: "50%" }}
                          />
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <UploadAvatar email={user.email} user={user} />
                          </div>
                        )
                      }
                    </div>
                    <div style={{ fontWeight: "bold", fontSize: "1.2rem", marginBottom: 4 }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: "1rem", color: "#888", marginBottom: 12 }}>
                      {user.email}
                    </div>
                    <div style={{ fontSize: "0.95rem", color: "#444" }}>
                      <strong>Role:</strong> {user.role}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* End Profile Modal */}
          </div>
        </header>

        <section className="content">
          <h1 style={{ fontWeight: '600', fontSize: '25px', marginTop: "-5px" }}>Admin Dashboard</h1>

          {!selectedResource && <UserEntryMonitor />}

          {selectedResource === "Resource Management" ? (
            <div className="resource-submenu">
              {resourceOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleResourceClick(option)}
                  className={`resource-option ${selectedSubResource === option ? "active" : ""}`}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {!selectedResource && <AdminDashboardTable />}

          {selectedSubResource === "Borrowed Books" && (
            <BorrowedBooksTable />
          )}

          {selectedSubResource === "Transactions" && (
            <TransactionsTable />
          )}

          {selectedSubResource === "Pending Requests" && (
            <PendingRequestTable />
          )}

          {selectedSubResource === "Reserved Books" && (
            <ReservedBooksTable />
          )}

          {selectedSubResource === "All Books" && (
            <BooksTable />
          )}

        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
