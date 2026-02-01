import React, { useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../imgs/liblogo.png";
import "../components/App.css";
import API_BASE_URL from "../config/api";

function VerifyNotice() {
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    if (!email) return;

    // Listen for verification completion from other tabs
    const handleStorageChange = (e) => {
      if (e.key === "verificationComplete") {
        const data = JSON.parse(e.newValue);
        if (data && data.verified && data.email === email) {
          // Verification completed in another tab
          clearInterval(interval);
          Swal.fire({
            title: "Parañaledge",
            text: "Email verified successfully! You can now log in.",
            icon: "success",
            confirmButtonText: "OK"
          }).then(() => {
            localStorage.removeItem("userEmail");
            window.location.href = "/"; // Full page reload
          });
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/auth/is-verified?email=${email}`);
        if (res.data.verified) {
          clearInterval(interval);
          await Swal.fire({
            title: "Parañaledge",
            text: "Email verified successfully! You can now log in.",
            icon: "success",
            confirmButtonText: "OK"
          });
          localStorage.removeItem("userEmail");
          window.location.href = "/"; // Full page reload
        }
      } catch (err) {
        console.error("Verification check failed:", err);
      }
    }, 5000); // poll every 5 seconds

    return () => {
      clearInterval(interval);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div
        className="auth-card"
        style={{
          background: "white",
          padding: "40px 30px",
          borderRadius: "10px",
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          textAlign: "center",
          width: "100%",
          maxWidth: "500px",
        }}
      >
        <div className="logo2" style={{ marginBottom: "20px" }}>
          <img style={{ width: "100px" }} src={logo} alt="School" />
        </div>
        <h2 style={{ marginBottom: "10px" }}>Verify Your Email</h2>
        <p style={{ margin: 0 }}>
          We've sent a verification email to your inbox. <br />
          Once verified, you'll be redirected to the login page.
        </p>
      </div>
    </div>
  );
}

export default VerifyNotice;
