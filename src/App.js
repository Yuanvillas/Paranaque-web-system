import React, { lazy, Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import "./components/App.css";
import ProtectedRoute from "./utils/ProtectedRoute";

const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AddBook = lazy(() => import("./pages/AddBook"));
const ArchivedBooks = lazy(() => import("./pages/ArchivedBooks"));
const ArchivedUsers = lazy(() => import("./pages/ArchivedUsers"));
const Genres = lazy(() => import("./pages/Genres"));
const GenreBooks = lazy(() => import("./pages/GenreBooks"));
const Profile = lazy(() => import("./pages/Profile"));
const UserHome = lazy(() => import("./pages/UserHome"));
const MyShelf = lazy(() => import("./pages/MyShelf"));
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const MyHolds = lazy(() => import("./pages/MyHolds"));
const UserLayout = lazy(() => import("./layouts/UserLayout"));
const UserActivityLogs = lazy(() => import("./pages/UserActivityLogs"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Resources = lazy(() => import("./pages/Resources"));
const VerifyNotice = lazy(() => import("./pages/VerifyNotice"));
const VerificationSuccess = lazy(() => import("./pages/VerificationSuccess"));
const FAQ = lazy(() => import("./pages/FAQ"));
const About = lazy(() => import("./pages/About"));
const ChatPopup = lazy(() => import("./pages/ChatPopup"));
const AdminLogs = lazy(() => import("./pages/AdminLogs"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const LibrarianUserManagement = lazy(() => import("./pages/LibrarianUserManagement"));
const LibrarianDashboard = lazy(() => import("./pages/LibrarianDashboard"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

function AppContent() {
  const location = useLocation();
  
  // Show ChatPopup only on authenticated pages (not login/register/verify-notice/forgot-password/reset-password/landing)
  const showChat = !["/", "/register", "/verify-notice", "/verify-success", "/forgot-password", "/landing"].includes(location.pathname) && !location.pathname.startsWith("/reset-password");

  return (
    <>
      <Suspense fallback={<div role="status">Loading page...</div>}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
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
          <Route path="/admin/resources" element={<ProtectedRoute element={<Resources dashboardPath="/admin-dashboard" analyticsPath="/admin/analytics" />} />} />
          <Route path="/verify-notice" element={<VerifyNotice />} />
          <Route path="/admin/logs" element={<ProtectedRoute element={<AdminLogs />} />} />
          <Route path="/admin/user-management" element={<ProtectedRoute element={<UserManagement />} />} />
          <Route path="/librarian/user-management" element={<ProtectedRoute element={<LibrarianUserManagement />} />} />
          <Route path="/librarian/analytics" element={<ProtectedRoute element={<Analytics />} />} />
          <Route path="/librarian/resources" element={<ProtectedRoute element={<Resources dashboardPath="/librarian-dashboard" analyticsPath="/librarian/analytics" />} />} />
          <Route path="/librarian-dashboard" element={<ProtectedRoute element={<LibrarianDashboard />} />} />

          <Route path="/user-home" element={<ProtectedRoute element={<UserLayout />} />}>
            <Route index element={<UserHome />} />
            <Route path="genres" element={<Genres />} />
            <Route path="genres/:genre" element={<GenreBooks />} />
            <Route path="profile" element={<Profile />} />
            <Route path="shelf" element={<MyShelf />} />
            <Route path="bookmarks" element={<Bookmarks />} />
            <Route path="holds" element={<MyHolds />} />
            <Route path="activity-logs" element={<UserActivityLogs />} />
            <Route path="faq" element={<FAQ />} />
            <Route path="about" element={<About />} />
          </Route>
        </Routes>
      </Suspense>
      <Suspense fallback={null}>{showChat && <ChatPopup />}</Suspense>
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
