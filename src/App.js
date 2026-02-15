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
import VerificationSuccess from "./pages/VerificationSuccess";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import ChatPopup from "./pages/ChatPopup";
import "./components/App.css";
import AdminLogs from "./pages/AdminLogs";
import UserManagement from "./pages/UserManagement";
import LibrarianUserManagement from "./pages/LibrarianUserManagement";
import LibrarianDashboard from "./pages/LibrarianDashboard";
import ProtectedRoute from "./utils/ProtectedRoute";
import LandingPage from "./pages/LandingPage";

function AppContent() {
  const location = useLocation();
  
  // Show ChatPopup only on authenticated pages (not login/register/verify-notice/forgot-password/reset-password/landing)
  const showChat = !["/", "/register", "/verify-notice", "/verify-success", "/forgot-password", "/landing"].includes(location.pathname) && !location.pathname.startsWith("/reset-password");

  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-success" element={<VerificationSuccess />} />
        <Route path="/admin-dashboard" element={<ProtectedRoute element={<AdminDashboard />} />} />
        <Route path="/admin/add-book" element={<ProtectedRoute element={<AddBook />} />} />
        <Route path="/admin/archived-books" element={<ProtectedRoute element={<ArchivedBooks />} />} />
        <Route path="/admin/archived-users" element={<ProtectedRoute element={<ArchivedUsers />} />} />
        <Route path="/admin/analytics" element={<ProtectedRoute element={<Analytics />} />} />
        <Route path="/verify-notice" element={<VerifyNotice />} />
        <Route path="/admin/logs" element={<ProtectedRoute element={<AdminLogs />} />} />
        <Route path="/admin/user-management" element={<ProtectedRoute element={<UserManagement />} />} />
        <Route path="/librarian/user-management" element={<ProtectedRoute element={<LibrarianUserManagement />} />} />
        <Route path="/librarian/analytics" element={<ProtectedRoute element={<Analytics />} />} />
        <Route path="/librarian-dashboard" element={<ProtectedRoute element={<LibrarianDashboard />} />} />

        <Route path="/user-home" element={<ProtectedRoute element={<UserLayout />} />}>
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
