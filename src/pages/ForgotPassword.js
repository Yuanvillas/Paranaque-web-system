import React, { useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";

function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  console.log("ForgotPassword page loaded");

  const handleSendReset = async (e) => {
    e.preventDefault();

    if (!email) {
      await Swal.fire({
        title: "Parañaledge",
        text: "Please enter your email address.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/forgot-password", { email });

      await Swal.fire({
        title: "Parañaledge",
        text: res.data.message,
        icon: "success",
        confirmButtonText: "OK"
      });

      setEmail("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      await Swal.fire({
        title: "Parañaledge",
        text: err.response?.data?.message || "Failed to send reset email.",
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
          <h2>Reset Your Password</h2>
          <p style={{ textAlign: "center", color: "#666", marginBottom: "20px", fontSize: "14px" }}>
            Please enter the email address associated with your account. We'll send you an email to help you reset your password.
          </p>
          <form className="auth-form" onSubmit={handleSendReset}>
            <label style={{ fontSize: "14px", fontWeight: "bold", color: "#333", marginBottom: "5px", display: "block" }}>
              Your email address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading} style={{ backgroundColor: loading ? "#ccc" : "#2e7d32" }}>
              {loading ? "Sending..." : "Send Reset Password Email"}
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

export default ForgotPassword;
