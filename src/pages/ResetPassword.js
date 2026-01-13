import React, { useState } from "react";
import Swal from "sweetalert2";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";

function ResetPassword() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    if (!password) return "Password is required.";
    if (!passwordRegex.test(password)) {
      return "Min 8 characters, incl. uppercase, lowercase, number, and special character.";
    }
    return "";
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Please fill in all password fields.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Passwords do not match.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    const error = validatePassword(newPassword);
    if (error) {
      await Swal.fire({
        title: "Parañaledge",
        text: error,
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/reset-password", {
        token,
        newPassword
      });

      await Swal.fire({
        title: "Parañaledge",
        text: res.data.message,
        icon: "success",
        confirmButtonText: "OK"
      });

      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      await Swal.fire({
        title: "Parañaledge",
        text: err.response?.data?.message || "Failed to reset password.",
        icon: "error",
        confirmButtonText: "OK"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={schoolImage} alt="School" />
        </div>
        <div className="auth-card">
          <img className="logo" src={logo} alt="logo" />
          <h2>Set New Password</h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "20px", fontSize: "14px" }}>
            Please enter your new password below.
          </p>
          <form className="auth-form" onSubmit={handleResetPassword}>
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setPasswordError(validatePassword(e.target.value));
              }}
              required
              autoComplete="new-password"
            />
            {passwordError && <p style={{ color: "red", fontSize: "0.8rem", marginTop: "-10px" }}>{passwordError}</p>}
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: loading ? "#ccc" : "#2e7d32" }}>
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            <Link 
              to="/"
              style={{
                color: "#2e7d32",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "14px",
                textDecoration: "none"
              }}
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
