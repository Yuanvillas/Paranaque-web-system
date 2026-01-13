import React, { useEffect } from "react";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUndo, faTrash, faBook } from "@fortawesome/free-solid-svg-icons";
import logo from "../imgs/liblogo.png";
import "../components/App.css";
import API_BASE_URL from "../config/api";

function VerifyNotice() {
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem("userEmail");

    if (!email) return;

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
          navigate("/"); // redirect to login page
        }
      } catch (err) {
        console.error("Verification check failed:", err);
      }
    }, 5000); // poll every 5 seconds

    return () => clearInterval(interval);
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
