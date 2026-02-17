// src/components/UserLayout.js
import React, { useState, createContext } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Swal from "sweetalert2";
import {
  faHouse,
  faBookOpen,
  faRightFromBracket,
  faUser,
  faListCheck,
  faBook
} from "@fortawesome/free-solid-svg-icons";
import {
  faBookmark,
  faQuestionCircle,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import ChatPopup from "../pages/ChatPopup";
import NotificationBell from "../components/NotificationBell";
import "../components/App.css";
import logo from "../imgs/liblogo.png";

// Create context
export const SearchContext = createContext();

const UserLayout = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

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

    const userEmail = localStorage.getItem("userEmail");
    
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
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    
    // Navigate to login page with replace to prevent back button access
    navigate("/", { replace: true });
  };

  // Track logout when user closes browser/tab
  React.useEffect(() => {
    const handleBeforeUnload = () => {
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        // Clear all auth data before closing
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        
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

  return (
    <SearchContext.Provider value={searchTerm}>
      <div className="dashboard">
        <aside className="sidebar">
          <div className="logo2">
            <img style={{ width: '50px' }} src={logo} alt="School" />
          </div>
          <nav className="nav-links">
            <Link to="/user-home">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faHouse} /> <span>Home</span>
            </Link>
            <Link to="/user-home/genres">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faBookOpen} /> <span>Catalogs</span>
            </Link>
            <Link to="/user-home/bookmarks">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faBookmark} /> <span>Bookmarks</span>
            </Link>
            <Link to="/user-home/shelf">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faBook} /> <span>My Shelf</span>
            </Link>
            <Link to="/user-home/holds">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faListCheck} /> <span>My Holds</span>
            </Link>
            <Link to="/user-home/history">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faQuestionCircle} /> <span>FAQ</span>
            </Link>
            <Link to="/user-home/about">
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faInfoCircle} /> <span>About</span>
            </Link>
            <button onClick={handleLogout}>
              <FontAwesomeIcon style={{ fontSize: '20px' }} icon={faRightFromBracket} /> <span>Logout</span>
            </button>
          </nav>
        </aside>

        <main className="main-content">
          <header className="header justify-between">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search here..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="header-actions">
              <NotificationBell />
              <Link to="/user-home/profile" className="profile-link">
                <FontAwesomeIcon icon={faUser} />
              </Link>
            </div>
          </header>

          <section className="content">
            <Outlet />
          </section>
        </main>

        <ChatPopup />
      </div>
    </SearchContext.Provider>
  );
};

export default UserLayout;
