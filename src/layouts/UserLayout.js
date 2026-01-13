// src/components/UserLayout.js
import React, { useState, createContext } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faBookOpen,
  faRightFromBracket,
  faUser
} from "@fortawesome/free-solid-svg-icons";
import {
  faBookmark,
  faQuestionCircle,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import ChatPopup from "../pages/ChatPopup";
import "../components/App.css";
import logo from "../imgs/liblogo.png";

// Create context
export const SearchContext = createContext();

const UserLayout = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = async () => {
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

    // Clear local storage and navigate
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    navigate("/");
  };

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
            <Link to="/user-home/faq">
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
            <Link to="/user-home/profile" className="profile-link">
              <FontAwesomeIcon icon={faUser} />
            </Link>
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
