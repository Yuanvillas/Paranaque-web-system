// src/pages/LibrarianDashboard.js
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import logo from "../imgs/liblogo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUsers,
  faChartBar,
  faSignOutAlt,
  faUser,
  faHome,
  faBook
} from "@fortawesome/free-solid-svg-icons";
import UploadAvatar from "../components/UploadAvatar";
import UserEntryMonitor from "../components/UserEntryMonitor";
import BooksTable from "../components/BooksTable";
import BorrowedBooksTable from "../components/BorrowedBooksTable";
import ReservedBooksTable from "../components/ReservedBooksTable";
import PendingRequestTable from "../components/PendingRequestTable";
import TransactionsTable from "../components/TransactionsTable";

const LibrarianDashboard = () => {
  const navigate = useNavigate();

  const [selectedResource, setSelectedResource] = useState(null);
  const [selectedSubResource, setSelectedSubResource] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState({ name: '', email: '', role: '', profilePicture: '' });
  const [isCollapsed] = useState(false);
  const [entryStats, setEntryStats] = useState({
    totalEntries: 0,
    todayEntries: 0,
    activeUsers: 0,
    activeAdmins: 0,
    activeLibrarians: 0
  });
  const [systemStats, setSystemStats] = useState({
    booksListed: 0,
    timesIssued: 0,
    timesReturned: 0,
    ongoingRequests: 0,
    listedCategories: 0
  });
  const [showTodayEntriesModal, setShowTodayEntriesModal] = useState(false);
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [showBooksModal, setShowBooksModal] = useState(false);
  const [showIssuedModal, setShowIssuedModal] = useState(false);
  const [showReturnedModal, setShowReturnedModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showActiveAdminsModal, setShowActiveAdminsModal] = useState(false);
  const [showActiveLibrariansModal, setShowActiveLibrariansModal] = useState(false);
  const [todayEntriesData, setTodayEntriesData] = useState([]);
  const [activeUsersData, setActiveUsersData] = useState([]);
  const [activeAdminsData, setActiveAdminsData] = useState([]);
  const [activeLibrariansData, setActiveLibrariansData] = useState([]);
  const [booksData, setBooksData] = useState([]);
  const [issuedData, setIssuedData] = useState([]);
  const [returnedData, setReturnedData] = useState([]);
  const [requestsData, setRequestsData] = useState([]);
  const [categoriesData, setCategoriesData] = useState([]);
  const [loadingModals, setLoadingModals] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);

  const resourceOptions = [
    "All Books",
    "Archive Books",
    "Borrowed Books",
    "Reserved Books",
    "Pending Requests",
    "Transactions"
  ];

  const handleSectionClick = (name) => {
    if (name === "Home") {
      setSelectedResource(null);
      setSelectedSubResource(null);
    } else if (name === "User Management") {
      navigate("/librarian/user-management");
    } else if (name === "Analytics") {
      navigate("/librarian/analytics");
    } else if (name === "Resources") {
      if (selectedResource === "Resources") {
        setSelectedResource(null);
        setSelectedSubResource(null);
      } else {
        setSelectedResource("Resources");
        setSelectedSubResource("All Books");
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

  const handleResourceClick = (option) => {
    setSelectedSubResource(option);
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

    const fetchSystemStats = async () => {
      try {
        const [booksRes, borrowedRes, transRes, requestsRes, returnRes] = await Promise.all([
          fetch('https://paranaque-web-system.onrender.com/api/books?limit=10000'),
          fetch('https://paranaque-web-system.onrender.com/api/books/borrowed?limit=10000'),
          fetch('https://paranaque-web-system.onrender.com/api/transactions?limit=10000'),
          fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000'),
          fetch('https://paranaque-web-system.onrender.com/api/transactions/return-requests')
        ]);

        const booksData = await booksRes.json();
        const borrowedData = await borrowedRes.json();
        const transData = await transRes.json();
        const requestsData = await requestsRes.json();
        const returnData = await returnRes.json();

        console.log('Books Data:', booksData);
        console.log('Borrowed Data:', borrowedData);
        console.log('Transactions Data:', transData);
        console.log('Requests Data:', requestsData);

        if (booksRes.ok && borrowedRes.ok && transRes.ok && requestsRes.ok && returnRes.ok) {
          const books = booksData.books || [];
          const borrowedBooks = borrowedData.books || [];
          const transactions = transData.transactions || [];
          const allRequests = requestsData.transactions || [];
          const allReturnRequests = returnData.requests || [];

          // Extract unique categories from books
          const uniqueCategories = new Set();
          books.forEach(book => {
            if (book.category) {
              uniqueCategories.add(book.category);
            }
          });
          const categoriesCount = uniqueCategories.size;

          const completedTransactions = transactions.filter(t => t.status === 'completed').length;
          const pendingBorrowReserveRequests = allRequests.filter(req => req.status === 'pending').length;
          const pendingReturnRequests = allReturnRequests.filter(req => req.status === 'pending').length;
          const pendingRequests = pendingBorrowReserveRequests + pendingReturnRequests;

          console.log('Setting stats:', {
            booksListed: books.length,
            timesIssued: borrowedBooks.length,
            timesReturned: completedTransactions,
            ongoingRequests: pendingRequests,
            listedCategories: categoriesCount
          });

          setSystemStats({
            booksListed: books.length,
            timesIssued: borrowedBooks.length,
            timesReturned: completedTransactions,
            ongoingRequests: pendingRequests,
            listedCategories: categoriesCount
          });
        } else {
          console.error('One or more API responses failed:', {
            booksOk: booksRes.ok,
            borrowedOk: borrowedRes.ok,
            transOk: transRes.ok,
            requestsOk: requestsRes.ok
          });
        }
      } catch (err) {
        console.error('Error fetching system stats:', err);
      }
    };

    fetchEntryStats();
    fetchSystemStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchEntryStats();
      fetchSystemStats();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleTodayEntriesClick = async () => {
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
        
        // Filter for user role only
        const userTodayLogs = todayLogs.filter(log => userRoles[log.userEmail] === 'user');
        
        setTodayEntriesData(userTodayLogs);
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

  const handleBooksClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/books');
      const data = await response.json();
      if (response.ok) {
        setBooksData(data.books || []);
        setShowBooksModal(true);
      }
    } catch (err) {
      console.error('Error fetching books:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleIssuedClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions');
      const data = await response.json();
      if (response.ok) {
        const issued = (data.transactions || []).filter(t => t.status === 'issued' || t.status === 'borrowed');
        setIssuedData(issued);
        setShowIssuedModal(true);
      }
    } catch (err) {
      console.error('Error fetching issued books:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleReturnedClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions');
      const data = await response.json();
      if (response.ok) {
        const returned = (data.transactions || []).filter(t => t.status === 'returned');
        setReturnedData(returned);
        setShowReturnedModal(true);
      }
    } catch (err) {
      console.error('Error fetching returned books:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleRequestsClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
      const data = await response.json();
      if (response.ok) {
        const requests = (data.transactions || []).filter(t => 
          (t.type === 'borrow' || t.type === 'reserve') && 
          (t.status === 'pending' || t.status === 'requested')
        );
        setRequestsData(requests);
        setShowRequestsModal(true);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const handleCategoriesClick = async () => {
    setLoadingModals(true);
    try {
      const response = await fetch('https://paranaque-web-system.onrender.com/api/books?limit=10000');
      const data = await response.json();
      if (response.ok) {
        const books = data.books || [];
        // Extract unique categories from books
        const uniqueCategories = new Set();
        books.forEach(book => {
          if (book.category) {
            uniqueCategories.add(book.category);
          }
        });
        const categoriesArray = Array.from(uniqueCategories).map(cat => ({ name: cat }));
        setCategoriesData(categoriesArray);
        setShowCategoriesModal(true);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setLoadingModals(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      Swal.fire('No data', 'Nothing to export', 'info');
      return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(item => 
        headers.map(header => {
          const value = item[header];
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (!storedUser || storedUser.role !== "librarian") {
      navigate("/"); // redirect to homepage
    }
    setUser({
      name: `${storedUser.firstName || ''} ${storedUser.lastName || ''}`.trim(),
      email: storedUser.email,
      role: storedUser.role || '',
      profilePicture: storedUser.profilePicture || ''
    });
  }, [navigate]);

  useEffect(() => {
    const fetchPendingRequestsCount = async () => {
      try {
        const response = await fetch('https://paranaque-web-system.onrender.com/api/transactions/pending-requests?limit=10000');
        const returnResponse = await fetch('https://paranaque-web-system.onrender.com/api/transactions/return-requests');
        const data = await response.json();
        const returnData = await returnResponse.json();
        if (response.ok && returnResponse.ok) {
          const allRequests = data.transactions || [];
          const allReturnRequests = returnData.requests || [];
          const borrowRequests = allRequests.filter(req => req.type === 'borrow');
          const reserveRequests = allRequests.filter(req => req.type === 'reserve');
          const pendingReturnRequests = allReturnRequests.filter(req => req.status === 'pending');
          setPendingRequestsCount(borrowRequests.length + reserveRequests.length + pendingReturnRequests.length);
        }
      } catch (err) {
        console.error('Error fetching pending requests count:', err);
      }
    };

    const interval = setInterval(fetchPendingRequestsCount, 5000);
    fetchPendingRequestsCount();

    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0d47a1",
      cancelButtonColor: "#757575",
      confirmButtonText: "Log out",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
      allowEscapeKey: false
    });

    // If user clicked cancel, return
    if (!result.isConfirmed) {
      return;
    }

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
    
    // Clear ALL authentication data from local storage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    // Navigate to login page with replace to prevent back button access
    navigate('/', { replace: true });
  };

  // Track logout when librarian closes browser/tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      const userEmail = localStorage.getItem('userEmail');
      if (userEmail) {
        // Clear all auth data before closing
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userRole');
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        
        // Attempt to log logout (may not complete before page closes)
        navigator.sendBeacon('https://paranaque-web-system.onrender.com/api/auth/logout', 
          JSON.stringify({ email: userEmail })
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <div className="logo2">
          <img style={{ width: '50px' }} src={logo} alt="School" />
        </div>
        <nav className="nav-links">
          <button onClick={() => handleSectionClick("Home")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faHome} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Home</span>}
          </button>
          <button onClick={() => handleSectionClick("User Management")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faUsers} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>User Management</span>}
          </button>
          <button onClick={() => handleSectionClick("Analytics")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faChartBar} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Analytics</span>}
          </button>
          <button onClick={() => handleSectionClick("Resources")}>
            <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faBook} />
            {!isCollapsed && <span style={{ marginLeft: 8 }}>Resources</span>}
          </button>
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

              {/* System Statistics Cards */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px',
                marginBottom: '30px',
                marginTop: '20px'
              }}>
                <div 
                  onClick={handleBooksClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📚</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#2e7d32',
                    marginBottom: '8px'
                  }}>
                    {systemStats.booksListed}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Books Listed</div>
                </div>

                <div 
                  onClick={handleIssuedClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📤</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#1976d2',
                    marginBottom: '8px'
                  }}>
                    {systemStats.timesIssued}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Times Book Issued</div>
                </div>

                <div 
                  onClick={handleReturnedClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>♻️</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#00897b',
                    marginBottom: '8px'
                  }}>
                    {systemStats.timesReturned}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Times Books Returned</div>
                </div>

                <div 
                  onClick={handleRequestsClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    cursor: 'pointer'
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
                  {systemStats.ongoingRequests > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '-10px',
                      right: '-10px',
                      backgroundColor: '#f44336',
                      color: 'white',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px'
                    }}>
                      {systemStats.ongoingRequests}
                    </div>
                  )}
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#f57c00',
                    marginBottom: '8px'
                  }}>
                    {systemStats.ongoingRequests}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Ongoing Requests</div>
                </div>

                <div 
                  onClick={handleCategoriesClick}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e0e0e0',
                    borderRadius: '12px',
                    padding: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
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
                  <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📁</div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: '#f9a825',
                    marginBottom: '8px'
                  }}>
                    {systemStats.listedCategories}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>Listed Categories</div>
                </div>
              </div>

              {/* User Entry Monitor - Main Section */}
              <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '25px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                marginTop: '30px'
              }}>
                <UserEntryMonitor />
              </div>
            </>
          )}

          {selectedResource === "Resources" ? (
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

          {selectedSubResource === "Archive Books" && (
            <div style={{
              padding: '20px',
              backgroundColor: '#fff',
              borderRadius: '8px'
            }}>
              <h3>Archived Books</h3>
              <p style={{ color: '#888' }}>Navigate to the <a href="/archived-books" style={{ color: '#0d47a1', textDecoration: 'none' }}>Archived Books</a> page to view and manage archived books.</p>
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
                          <th style={{ padding: '10px', textAlign: 'center' }}>Login Count</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeUsersData.map((user, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{user.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#00BFA5' }}>{user.loginCount}</td>
                            <td style={{ padding: '10px' }}>{new Date(user.lastLogin).toLocaleString()}</td>
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
                          <th style={{ padding: '10px', textAlign: 'center' }}>Login Count</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeAdminsData.map((admin, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{admin.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#FF6F00' }}>{admin.loginCount}</td>
                            <td style={{ padding: '10px' }}>{new Date(admin.lastLogin).toLocaleString()}</td>
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
                          <th style={{ padding: '10px', textAlign: 'center' }}>Login Count</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeLibrariansData.map((librarian, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{librarian.email}</td>
                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#8B5CF6' }}>{librarian.loginCount}</td>
                            <td style={{ padding: '10px' }}>{new Date(librarian.lastLogin).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Books Modal */}
          {showBooksModal && (
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
            }} onClick={() => setShowBooksModal(false)}>
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
                  <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Books Listed</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      style={{
                        backgroundColor: '#1976d2',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                    >
                      📚 Resources
                    </button>
                    <button
                      onClick={() => setShowBooksModal(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '28px',
                        cursor: 'pointer',
                        color: '#999'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : booksData.length === 0 ? (
                  <p style={{ color: '#999' }}>No books found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Title</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Author</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333' }}>Category</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#333' }}>Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {booksData.map((book, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee', hover: { backgroundColor: '#f9f9f9' } }}>
                            <td style={{ padding: '12px' }}>{book.title}</td>
                            <td style={{ padding: '12px' }}>{book.author}</td>
                            <td style={{ padding: '12px' }}>{book.category || '-'}</td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>{book.quantity || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issued Books Modal */}
          {showIssuedModal && (
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
            }} onClick={() => setShowIssuedModal(false)}>
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
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Books Issued</h2>
                  <div>
                    <button
                      onClick={() => exportToCSV(issuedData, 'issued_books.csv')}
                      style={{
                        backgroundColor: '#00BFA5',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        fontSize: '14px'
                      }}
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => setShowIssuedModal(false)}
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
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : issuedData.length === 0 ? (
                  <p style={{ color: '#999' }}>No issued books found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>User Email</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Book Title</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Issue Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issuedData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.userEmail}</td>
                            <td style={{ padding: '10px' }}>{item.bookTitle || item.title || '-'}</td>
                            <td style={{ padding: '10px' }}>{item.type}</td>
                            <td style={{ padding: '10px' }}>{new Date(item.issuedDate || item.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Returned Books Modal */}
          {showReturnedModal && (
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
            }} onClick={() => setShowReturnedModal(false)}>
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
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Books Returned</h2>
                  <div>
                    <button
                      onClick={() => exportToCSV(returnedData, 'returned_books.csv')}
                      style={{
                        backgroundColor: '#00BFA5',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        fontSize: '14px'
                      }}
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => setShowReturnedModal(false)}
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
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : returnedData.length === 0 ? (
                  <p style={{ color: '#999' }}>No returned books found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>User Email</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Book Title</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Return Date</th>
                          <th style={{ padding: '10px', textAlign: 'center' }}>Fine</th>
                        </tr>
                      </thead>
                      <tbody>
                        {returnedData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.userEmail}</td>
                            <td style={{ padding: '10px' }}>{item.bookTitle || item.title || '-'}</td>
                            <td style={{ padding: '10px' }}>{new Date(item.returnedDate || item.updatedAt).toLocaleDateString()}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>₱{item.fine || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pending Requests Modal */}
          {showRequestsModal && (
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
            }} onClick={() => setShowRequestsModal(false)}>
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
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Pending Requests</h2>
                  <div>
                    <button
                      onClick={() => exportToCSV(requestsData, 'pending_requests.csv')}
                      style={{
                        backgroundColor: '#00BFA5',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        fontSize: '14px'
                      }}
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => setShowRequestsModal(false)}
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
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : requestsData.length === 0 ? (
                  <p style={{ color: '#999' }}>No pending requests found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>User Email</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Book Title</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Request Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requestsData.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{item.userEmail}</td>
                            <td style={{ padding: '10px' }}>{item.bookTitle || item.title || '-'}</td>
                            <td style={{ padding: '10px' }}>{item.type}</td>
                            <td style={{ padding: '10px' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Categories Modal */}
          {showCategoriesModal && (
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
            }} onClick={() => setShowCategoriesModal(false)}>
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
                  <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Listed Categories</h2>
                  <div>
                    <button
                      onClick={() => exportToCSV(categoriesData, 'categories.csv')}
                      style={{
                        backgroundColor: '#00BFA5',
                        color: 'white',
                        border: 'none',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        marginRight: '10px',
                        fontSize: '14px'
                      }}
                    >
                      📥 Export CSV
                    </button>
                    <button
                      onClick={() => setShowCategoriesModal(false)}
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
                </div>
                
                {loadingModals ? (
                  <p>Loading...</p>
                ) : categoriesData.length === 0 ? (
                  <p style={{ color: '#999' }}>No categories found.</p>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #ddd' }}>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Category Name</th>
                          <th style={{ padding: '10px', textAlign: 'left' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoriesData.map((category, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '10px' }}>{category.name}</td>
                            <td style={{ padding: '10px' }}>{category.description || '-'}</td>
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

export default LibrarianDashboard;
