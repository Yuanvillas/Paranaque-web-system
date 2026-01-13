import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import AddBook from "./pages/AddBook";
import ArchivedBooks from "./pages/ArchivedBooks";
import ArchivedUsers from "./pages/ArchivedUsers";
import Genres from "./pages/Genres";
import GenreBooks from "./pages/GenreBooks";
import Profile from "./pages/Profile";
import UserHome from "./pages/UserHome";
import MyShelf from "./pages/MyShelf";
import Bookmarks from "./pages/Bookmarks";
import UserLayout from "./layouts/UserLayout";
import Analytics from "./pages/Analytics";
import VerifyNotice from "./pages/VerifyNotice";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import ChatPopup from "./pages/ChatPopup";
import "./components/App.css";
import AdminLogs from "./pages/AdminLogs";
import UserManagement from "./pages/UserManagement";

function AppContent() {
  const location = useLocation();
  
  // Show ChatPopup only on authenticated pages (not login/register/verify-notice/forgot-password/reset-password)
  const showChat = !["/", "/register", "/verify-notice", "/forgot-password"].includes(location.pathname) && !location.pathname.startsWith("/reset-password");

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin/add-book" element={<AddBook />} />
        <Route path="/admin/archived-books" element={<ArchivedBooks />} />
        <Route path="/admin/archived-users" element={<ArchivedUsers />} />
        <Route path="/admin/analytics" element={<Analytics />} />
        <Route path="/verify-notice" element={<VerifyNotice />} />
        <Route path="/admin/logs" element={<AdminLogs />} />
        <Route path="/admin/user-management" element={<UserManagement />} />

        <Route path="/user-home" element={<UserLayout />}>
          <Route index element={<UserHome />} />
          <Route path="genres" element={<Genres />} />
          <Route path="genres/:genre" element={<GenreBooks />} />
          <Route path="profile" element={<Profile />} />
          <Route path="shelf" element={<MyShelf />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="about" element={<About />} />
        </Route>
      </Routes>
      {showChat && <ChatPopup />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
