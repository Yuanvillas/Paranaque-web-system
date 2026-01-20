import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";
import API_BASE_URL from "../config/api";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      Swal.fire({
        title: "Parañaledge",
        text: "Invalid reset link. Please request a new password reset.",
        icon: "error",
        confirmButtonText: "OK"
      }).then(() => {
        navigate("/forgot-password");
      });
    }
  }, [token, navigate]);

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
      console.log("📤 Sending password reset request to:", `${API_BASE_URL}/api/auth/reset-password`);
      const res = await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        token,
        newPassword
      });

      console.log("✅ Password reset successful");

      Swal.fire({
        title: "Parañaledge",
        text: "Password reset successfully! Redirecting to login...",
        icon: "success",
        confirmButtonText: "OK"
      }).then(() => {
        navigate("/");
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

  if (!token) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={schoolImage} alt="School" />
        </div>
        <div className="auth-card">
          <img className="logo" src={logo} alt="logo" />
          <h2>Reset Password</h2>
          
          <form onSubmit={handleResetPassword} style={{ width: "100%" }}>
            {/* New Password Field */}
            <div style={{ marginBottom: "15px" }}>
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
                  boxSizing: "border-box",
                  opacity: loading ? 0.6 : 1
                }}
              />
              <small style={{ color: "#888", fontSize: "11px", display: "block", marginTop: "5px" }}>
                Min 8 chars, uppercase, lowercase, number, special char (@$!%*#?&^_-)
              </small>
            </div>

            {/* Confirm Password Field */}
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontSize: "12px", fontWeight: "bold", color: "#333", display: "block", marginBottom: "5px" }}>
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
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
                  boxSizing: "border-box",
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

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <a 
              href="/"
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                textDecoration: "none",
                fontSize: "14px"
              }}
            >
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
