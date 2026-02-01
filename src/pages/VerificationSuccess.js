import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import logo from "../imgs/liblogo.png";
import "../components/App.css";

function VerificationSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    // Broadcast verification completion to all other tabs
    localStorage.setItem("verificationComplete", JSON.stringify({
      email: email,
      timestamp: Date.now(),
      verified: true
    }));

    // Clear any cached authentication data
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Auto-redirect to login after 5 seconds with full page reload
    const timer = setTimeout(() => {
      // Use window.location to force a full page reload and clear all caches
      window.location.href = "/";
    }, 5000);

    return () => clearTimeout(timer);
  }, [email]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        className="auth-card"
        style={{
          background: "white",
          borderRadius: "10px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          padding: "40px",
          textAlign: "center",
          maxWidth: "500px",
          animation: "slideUp 0.5s ease-out",
        }}
      >
        {/* Success Icon */}
        <div
          style={{
            fontSize: "60px",
            marginBottom: "20px",
            animation: "bounce 0.6s ease-out",
          }}
        >
          ✅
        </div>

        {/* Logo */}
        <img
          src={logo}
          alt="Parañaledge Logo"
          style={{
            maxWidth: "120px",
            marginBottom: "20px",
          }}
        />

        <h2
          style={{
            color: "#2e7d32",
            marginBottom: "15px",
            fontSize: "28px",
            fontWeight: "600",
          }}
        >
          Email Verified Successfully!
        </h2>

        <p
          style={{
            color: "#666",
            fontSize: "16px",
            marginBottom: "10px",
            lineHeight: "1.6",
          }}
        >
          Your email has been verified successfully. You can now log in to your account.
        </p>

        {email && (
          <p
            style={{
              color: "#888",
              fontSize: "14px",
              marginBottom: "30px",
              backgroundColor: "#f5f5f5",
              padding: "10px",
              borderRadius: "5px",
            }}
          >
            <strong>Email:</strong> {email}
          </p>
        )}

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={() => {
              // Clear cache and redirect with full page reload
              localStorage.removeItem("userEmail");
              localStorage.removeItem("user");
              sessionStorage.clear();
              window.location.href = "/";
            }}
            style={{
              padding: "12px 30px",
              backgroundColor: "#2e7d32",
              color: "white",
              border: "none",
              borderRadius: "5px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = "#1b5e20";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = "#2e7d32";
              e.target.style.transform = "translateY(0)";
            }}
          >
            Go to Login
          </button>
        </div>

        <p
          style={{
            color: "#999",
            fontSize: "13px",
            marginTop: "20px",
          }}
        >
          Redirecting to login in 5 seconds...
        </p>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default VerificationSuccess;
