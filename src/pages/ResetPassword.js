import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";
import API_BASE_URL from "../config/api";

/**
 * Reset Password Component
 * 
 * Flow:
 * 1. User receives email with link: https://domain.com/api/auth/reset-password/{token}
 * 2. Backend verifies token and redirects to: /reset-password?token={token}&email={email}
 * 3. This component loads with token and email from URL
 * 4. User enters new password
 * 5. Component submits to POST /api/auth/reset-password with token and newPassword
 * 6. Backend updates password and returns success
 * 7. Component redirects to login page
 */

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const errorParam = searchParams.get("error");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!token);

  // Check if user has a valid token
  useEffect(() => {
    if (!token) {
      console.error("❌ No reset token found in URL");
      // Show error and redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/forgot-password?error=invalid_token";
      }, 1500);
    } else {
      console.log("✅ Reset token found:", token.substring(0, 10) + "...");
      setPageLoading(false);
    }
  }, [token]);

  // Handle error parameters from backend redirect
  useEffect(() => {
    if (errorParam) {
      let errorMsg = "An error occurred.";
      if (errorParam === "missing_token") {
        errorMsg = "No reset token provided. Please request a new password reset.";
      } else if (errorParam === "invalid_token") {
        errorMsg = "Reset link is invalid or has expired. Please request a new password reset.";
      } else if (errorParam === "server_error") {
        errorMsg = "Server error. Please try again later.";
      }

      Swal.fire({
        title: "Parañaledge",
        text: errorMsg,
        icon: "error",
        confirmButtonText: "OK"
      }).then(() => {
        window.location.href = "/forgot-password";
      });
    }
  }, [errorParam]);

  const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/\d/.test(password)) return "Password must contain a number.";
    if (!/[@$!%*#?&^_-]/.test(password)) return "Password must contain a special character (@$!%*#?&^_-).";
    return "";
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      Swal.fire({
        title: "Parañaledge",
        text: "Please fill in all password fields.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire({
        title: "Parañaledge",
        text: "Passwords do not match.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    const error = validatePassword(newPassword);
    if (error) {
      Swal.fire({
        title: "Parañaledge",
        text: error,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    // Submit password reset
    setLoading(true);
    try {
      console.log("📤 Submitting password reset...");
      const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword
      });

      console.log("✅ Password reset successful:", res.data.message);

      Swal.fire({
        title: "Parañaledge",
        text: res.data.message || "Password reset successfully!",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        // Redirect to login page
        window.location.href = "/";
      });
    } catch (err) {
      console.error("❌ Password reset error:", err);
      const errorMsg = err.response?.data?.message || "Failed to reset password. Please try again.";
      
      Swal.fire({
        title: "Parañaledge",
        text: errorMsg,
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking token
  if (pageLoading) {
    return (
      <div className="auth-container">
        <div className="auth-wrapper">
          <div className="auth-image">
            <img src={schoolImage} alt="School" />
          </div>
          <div className="auth-card">
            <img className="logo" src={logo} alt="logo" />
            <h2>Loading...</h2>
            <p style={{ textAlign: "center", color: "#666" }}>
              Verifying your reset link...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If no token, component will redirect via useEffect
  if (!token) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={schoolImage} alt="School" />
        </div>
        <div className="auth-card">
          <img className="logo" src={logo} alt="logo" />
          <h2>Reset Your Password</h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "20px", fontSize: "14px" }}>
            Please enter your new password below. Make sure it meets all requirements.
          </p>
          
          {email && (
            <p style={{ 
              textAlign: "center", 
              color: "#555", 
              marginBottom: "20px", 
              fontSize: "13px", 
              backgroundColor: "#f0f0f0", 
              padding: "10px", 
              borderRadius: "4px",
              borderLeft: "4px solid #2e7d32"
            }}>
              <strong>Email:</strong> {decodeURIComponent(email)}
            </p>
          )}

          <form className="auth-form" onSubmit={handleResetPassword}>
            {/* New Password Field */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#333", display: "block", marginBottom: "5px" }}>
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  opacity: loading ? 0.6 : 1
                }}
              />
              <small style={{ color: "#888", fontSize: "11px", display: "block", marginTop: "5px" }}>
                Min 8 chars, uppercase, lowercase, number, special char
              </small>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#333", display: "block", marginBottom: "5px", marginTop: "15px" }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "14px",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  opacity: loading ? 0.6 : 1
                }}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading} 
              style={{ 
                backgroundColor: loading ? "#ccc" : "#2e7d32",
                marginTop: "20px",
                width: "100%",
                padding: "12px",
                fontSize: "16px",
                fontWeight: "bold",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background-color 0.3s"
              }}
            >
              {loading ? "Resetting Password..." : "Reset Password"}
            </button>
          </form>

          {/* Back to Login Link */}
          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <Link 
              to="/"
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
