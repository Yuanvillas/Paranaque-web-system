// src/pages/AdminDashboard.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import BorrowedBooksTable from "../components/BorrowedBooksTable";
import TransactionsTable from "../components/TransactionsTable";
import ReservedBooksTable from "../components/ReservedBooksTable";
import logo from "../imgs/liblogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faChartBar,
  faBook,
  faFileAlt,
  faSignOutAlt,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import BooksTable from "../components/BooksTable";
import AdminDashboardTable from "../components/AdminDashboardTable";
import PendingRequestTable from "../components/PendingRequestTable";
import UploadAvatar from "../components/UploadAvatar";
import UserEntryMonitor from "../components/UserEntryMonitor";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [selectedResource, setSelectedResource] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: '', profilePicture: '' });
  const [isCollapsed] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [entryStats, setEntryStats] = useState({
    totalEntries: 0,
    todayEntries: 0,
    activeUsers: 0,
    activeAdmins: 0,
    activeLibrarians: 0
  });
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showTodayEntriesModal, setShowTodayEntriesModal] = useState(false);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [showActiveAdminsModal, setShowActiveAdminsModal] = useState(false);
  const [showActiveLibrariansModal, setShowActiveLibrariansModal] = useState(false);
  const [todayEntriesData, setTodayEntriesData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [activeAdminsData, setActiveAdminsData] = useState([]);
  const [activeLibrariansData, setActiveLibrariansData] = useState([]);
  const [loadingModals, setLoadingModals] = useState(false);

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
    const fetchEntryStats = async () => {
      try {
        const [logsResponse, usersResponse] = await Promise.all([
          fetch('https://paranaque-web-system.onrender.com/api/logs'),
          fetch('https://paranaque-web-system.onrender.com/api/auth/users')
        ]);
        
        const logsData = await logsResponse.json();
        const usersData = await usersResponse.json();
        
        if (logsResponse.ok && logsData.logs && usersResponse.ok && usersData.users) {
          const logs = logsData.logs;
          const today = new Date().toDateString();
          
          const todayLogs = logs.filter(log => 
            new Date(log.timestamp).toDateString() === today
          );
          
          // Create a map of user roles
          const userRoles = {};
          usersData.users.forEach(user => {
            userRoles[user.email] = user.role;
          });
          
          // Count unique regular users who are STILL logged in
          // by finding their LAST action - only count if it's login (not logout)
          const userLastActions = {};
          todayLogs.forEach(log => {
            if (log.action && userRoles[log.userEmail] === 'user' &&
                (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
              if (!userLastActions[log.userEmail] || new Date(log.timestamp) > new Date(userLastActions[log.userEmail].timestamp)) {
                userLastActions[log.userEmail] = log;
              }
            }
          });
          
          const uniqueUsersToday = new Set(
            Object.values(userLastActions)
              .filter(log => log.action && log.action.toLowerCase().includes('login'))
              .map(log => log.userEmail)
          );
          
          // Count unique admins who are STILL logged in
          const adminLastActions = {};
          todayLogs.forEach(log => {
            if (log.action && userRoles[log.userEmail] === 'admin' &&
                (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
              if (!adminLastActions[log.userEmail] || new Date(log.timestamp) > new Date(adminLastActions[log.userEmail].timestamp)) {
                adminLastActions[log.userEmail] = log;
              }
            }
          });
          
          const uniqueAdminsToday = new Set(
            Object.values(adminLastActions)
              .filter(log => log.action && log.action.toLowerCase().includes('login'))
              .map(log => log.userEmail)
          );
          
          // Count unique librarians who are STILL logged in
          const librarianLastActions = {};
          todayLogs.forEach(log => {
            if (log.action && userRoles[log.userEmail] === 'librarian' &&
                (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
              if (!librarianLastActions[log.userEmail] || new Date(log.timestamp) > new Date(librarianLastActions[log.userEmail].timestamp)) {
                librarianLastActions[log.userEmail] = log;
              }
            }
          });
          
          const uniqueLibrariansToday = new Set(
            Object.values(librarianLastActions)
              .filter(log => log.action && log.action.toLowerCase().includes('login'))
              .map(log => log.userEmail)
          );
          
          setEntryStats({
            totalEntries: logs.length,
            todayEntries: todayLogs.length,
            activeUsers: uniqueUsersToday.size,
            activeAdmins: uniqueAdminsToday.size,
            activeLibrarians: uniqueLibrariansToday.size
          });
        }
      } catch (err) {
        console.error('Error fetching entry stats:', err);
      }
    };

    fetchEntryStats();
    const interval = setInterval(fetchEntryStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTodayEntriesClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/logs');
      const data = await response.json();
      
      if (response.ok && data.logs) {
        const today = new Date().toDateString();
        const todayLogs = data.logs.filter(log => 
          new Date(log.timestamp).toDateString() === today
        );
        setTodayEntriesData(todayLogs);
        setShowTodayEntriesModal(true);
      }
    } catch (err) {
      console.error('Error fetching today entries:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleActiveUsersClick = async () => {
    setLoadingModals(true);
    try {
      const [logsResponse, usersResponse] = await Promise.all([
        fetch('https://paranaque-web-system.onrender.com/api/logs'),
        fetch('https://paranaque-web-system.onrender.com/api/auth/users')
      ]);
      
      const logsData = await logsResponse.json();
      const usersData = await usersResponse.json();
      
      if (logsResponse.ok && logsData.logs && usersResponse.ok && usersData.users) {
        const today = new Date().toDateString();
        const todayLogs = logsData.logs.filter(log => 
          new Date(log.timestamp).toDateString() === today
        );
        
        // Create a map of user roles
        const userRoles = {};
        usersData.users.forEach(user => {
          userRoles[user.email] = user.role;
        });
        
        // Get users who are STILL logged in (last action is login)
        const userActions = {};
        todayLogs.forEach(log => {
          if (log.action && userRoles[log.userEmail] === 'user' &&
              (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
            if (!userActions[log.userEmail]) {
              userActions[log.userEmail] = [];
            }
            userActions[log.userEmail].push(log);
          }
        });
        
        const activeUsers = {};
        Object.entries(userActions).forEach(([email, actions]) => {
          // Find the most recent action
          const lastAction = actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          // Only include if last action is login (still logged in)
          if (lastAction && lastAction.action.toLowerCase().includes('login')) {
            const loginCount = actions.filter(a => a.action.toLowerCase().includes('login')).length;
            activeUsers[email] = {
              email: email,
              lastLogin: lastAction.timestamp,
              loginCount: loginCount
            };
          }
        });
        
        setActiveUsersData(Object.values(activeUsers));
        setShowActiveUsersModal(true);
      }
    } catch (err) {
      console.error('Error fetching active users:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleActiveAdminsClick = async () => {
    setLoadingModals(true);
    try {
      const [logsResponse, usersResponse] = await Promise.all([
        fetch('https://paranaque-web-system.onrender.com/api/logs'),
        fetch('https://paranaque-web-system.onrender.com/api/auth/users')
      ]);
      
      const logsData = await logsResponse.json();
      const usersData = await usersResponse.json();
      
      if (logsResponse.ok && logsData.logs && usersResponse.ok && usersData.users) {
        const today = new Date().toDateString();
        const todayLogs = logsData.logs.filter(log => 
          new Date(log.timestamp).toDateString() === today
        );
        
        // Create a map of user roles
        const userRoles = {};
        usersData.users.forEach(user => {
          userRoles[user.email] = user.role;
        });
        
        // Get admins who are STILL logged in (last action is login)
        const adminActions = {};
        todayLogs.forEach(log => {
          if (log.action && userRoles[log.userEmail] === 'admin' &&
              (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
            if (!adminActions[log.userEmail]) {
              adminActions[log.userEmail] = [];
            }
            adminActions[log.userEmail].push(log);
          }
        });
        
        const activeAdmins = {};
        Object.entries(adminActions).forEach(([email, actions]) => {
          const lastAction = actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          if (lastAction && lastAction.action.toLowerCase().includes('login')) {
            const loginCount = actions.filter(a => a.action.toLowerCase().includes('login')).length;
            activeAdmins[email] = {
              email: email,
              lastLogin: lastAction.timestamp,
              loginCount: loginCount
            };
          }
        });
        
        setActiveAdminsData(Object.values(activeAdmins));
        setShowActiveAdminsModal(true);
      }
    } catch (err) {
      console.error('Error fetching active admins:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleActiveLibrariansClick = async () => {
    setLoadingModals(true);
    try {
      const [logsResponse, usersResponse] = await Promise.all([
        fetch('https://paranaque-web-system.onrender.com/api/logs'),
        fetch('https://paranaque-web-system.onrender.com/api/auth/users')
      ]);
      
      const logsData = await logsResponse.json();
      const usersData = await usersResponse.json();
      
      if (logsResponse.ok && logsData.logs && usersResponse.ok && usersData.users) {
        const today = new Date().toDateString();
        const todayLogs = logsData.logs.filter(log => 
          new Date(log.timestamp).toDateString() === today
        );
        
        // Create a map of user roles
        const userRoles = {};
        usersData.users.forEach(user => {
          userRoles[user.email] = user.role;
        });
        
        // Get librarians who are STILL logged in (last action is login)
        const librarianActions = {};
        todayLogs.forEach(log => {
          if (log.action && userRoles[log.userEmail] === 'librarian' &&
              (log.action.toLowerCase().includes('login') || log.action.toLowerCase().includes('logout'))) {
            if (!librarianActions[log.userEmail]) {
              librarianActions[log.userEmail] = [];
            }
            librarianActions[log.userEmail].push(log);
          }
        });
        
        const activeLibrarians = {};
        Object.entries(librarianActions).forEach(([email, actions]) => {
          const lastAction = actions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
          if (lastAction && lastAction.action.toLowerCase().includes('login')) {
            const loginCount = actions.filter(a => a.action.toLowerCase().includes('login')).length;
            activeLibrarians[email] = {
              email: email,
              lastLogin: lastAction.timestamp,
              loginCount: loginCount
            };
          }
        });
        
        setActiveLibrariansData(Object.values(activeLibrarians));
        setShowActiveLibrariansModal(true);
      }
    } catch (err) {
      console.error('Error fetching active librarians:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      try {
        const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
        const data = await response.json();
        if (response.ok) {
          const allRequests = data.transactions || [];
          const borrowRequests = allRequests.filter(req => req.type === 'borrow');
          const reserveRequests = allRequests.filter(req => req.type === 'reserve');
          setPendingRequestsCount(borrowRequests.length + reserveRequests.length);
        }
      } catch (err) {
        console.error('Error fetching pending requests count:', err);
      }
    };

    const interval = setInterval(fetchPendingRequestsCount, 5000);
    fetchPendingRequestsCount();

    return () => clearInterval(interval);
  }, []);


  const resourceOptions = [
    "All Books",
    "Archive Books",
    "Borrowed Books",
    "Reserved Books",
    "Pending Requests",
    "Transactions"
  ];

  const handleResourceClick = (option) => {
    if (option === "Archive Books") {
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
        fetch("https://paranaque-web-system.onrender.com/api/books");
      } catch (error) {
        console.error("Error fetching books:", error);
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
  }, [navigate]);

  const handleLogout = async () => {
    const userEmail = localStorage.getItem('userEmail');
    
    // Log the logout to the backend
    if (userEmail) {
      try {
        await fetch('https://paranaque-web-system.onrender.com/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: userEmail })
        });
      } catch (err) {
        console.error('Error logging logout:', err);
      }
    }
    
    // Clear local storage and navigate
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('token');
    navigate('/');
  };

  // Track logout when admin closes browser/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        // Use sendBeacon with FormData for reliable delivery even if page is closing
        const formData = new FormData();
        formData.append('email', userEmail);
        navigator.sendBeacon(
          'https://paranaque-web-system.onrender.com/api/auth/logout',
          formData
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

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
          <h1 style={{ fontWeight: '600', fontSize: '25px', marginTop: "-5px" }}>Dashboard Overview</h1>

          {!selectedResource && (
            <>
              {/* Entry Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '30px',
                marginTop: '20px'
              }}>
                <div 
                  onClick={() => setShowEntryModal(true)}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '15px'
                  }}>
                    Total Entries
                  </div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#00BFA5',
                    marginBottom: '5px'
                  }}>
                    {entryStats.totalEntries}
                  </div>
                </div>

                <div 
                  onClick={handleTodayEntriesClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '15px'
                  }}>
                    Today's Entries
                  </div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#00BFA5',
                    marginBottom: '5px'
                  }}>
                    {entryStats.todayEntries}
                  </div>
                </div>

                <div 
                  onClick={handleActiveUsersClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '25px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '15px'
                  }}>
                    Active Users Online
                  </div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#00BFA5',
                    marginBottom: '5px'
                  }}>
                    {entryStats.activeUsers}
                  </div>
                </div>

                <div
                  onClick={handleActiveAdminsClick}
                  style={{
                    backgroundColor: '#fff',
                    padding: '25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '15px'
                  }}>
                    Active Admins Online
                  </div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#FF6F00',
                    marginBottom: '5px'
                  }}>
                    {entryStats.activeAdmins}
                  </div>
                </div>

                <div
                  onClick={handleActiveLibrariansClick}
                  style={{
                    backgroundColor: '#fff',
                    padding: '25px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{
                    fontSize: '12px',
                    color: '#999',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '15px'
                  }}>
                    Active Librarians Online
                  </div>
                  <div style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#8B5CF6',
                    marginBottom: '5px'
                  }}>
                    {entryStats.activeLibrarians}
                  </div>
                </div>
              </div>
            </>
          )}

          {selectedResource === "Resource Management" ? (
            <div className="resource-submenu">
              {resourceOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleResourceClick(option)}
                  className={`resource-option ${selectedSubResource === option ? "active" : ""}`}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  {option}
                  {option === "Pending Requests" && pendingRequestsCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      backgroundColor: '#FF5252',
                      color: 'white',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      animation: 'pulse 1.5s infinite'
                    }}>
                      {pendingRequestsCount}
                    </span>
                  )}
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

          {/* Entry Monitor Modal */}
          {showEntryModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => setShowEntryModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                maxHeight: '85vh',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '1200px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>User Entry Monitor</h2>
                  <button
                    onClick={() => setShowEntryModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <UserEntryMonitor />
              </div>
            </div>
          )}

          {/* Today's Entries Modal */}
          {showTodayEntriesModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => setShowTodayEntriesModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                maxHeight: '85vh',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '1000px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Today's Entries</h2>
                  <button
                    onClick={() => setShowTodayEntriesModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : todayEntriesData.length === 0 ? (
                  <p style={{ color: '#999' }}>No entries found for today.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Action</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {todayEntriesData.map((entry, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{entry.userEmail}</td>
                            <td style={{ padding: '10px', color: '#00BFA5' }}>{entry.action}</td>
                            <td style={{ padding: '10px' }}>{new Date(entry.timestamp).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Users Modal */}
          {showActiveUsersModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => setShowActiveUsersModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                maxHeight: '85vh',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '1000px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Active Users Online Today</h2>
                  <button
                    onClick={() => setShowActiveUsersModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : activeUsersData.length === 0 ? (
                  <p style={{ color: '#999' }}>No active users found for today.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeUsersData.map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{user.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#00BFA5' }}>🟢 Online</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showActiveAdminsModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => setShowActiveAdminsModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                maxHeight: '85vh',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '1000px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Active Admins Online Today</h2>
                  <button
                    onClick={() => setShowActiveAdminsModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : activeAdminsData.length === 0 ? (
                  <p style={{ color: '#999' }}>No active admins found for today.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAdminsData.map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{user.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#FF6F00' }}>🟢 Online</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {showActiveLibrariansModal && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }} onClick={() => setShowActiveLibrariansModal(false)}>
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                maxHeight: '85vh',
                overflowY: 'auto',
                width: '100%',
                maxWidth: '1000px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
              }} onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Active Librarians Online Today</h2>
                  <button
                    onClick={() => setShowActiveLibrariansModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '24px',
                      cursor: 'pointer',
                      color: '#999'
                    }}
                  >
                    ✕
                  </button>
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : activeLibrariansData.length === 0 ? (
                  <p style={{ color: '#999' }}>No active librarians found for today.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLibrariansData.map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{user.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#8B5CF6' }}>🟢 Online</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;
