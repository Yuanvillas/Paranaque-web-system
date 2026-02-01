import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";
import PasswordInput from "../ui/PasswordInput";
import OverdueModal from "../components/OverdueModal";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Check if user is already logged in and redirect
  useEffect(() => {
    const userEmail = localStorage.getItem("userEmail");
    const user = localStorage.getItem("user");
    
    // If user is logged in, redirect to appropriate dashboard
    if (userEmail && user) {
      try {
        const userData = JSON.parse(user);
        if (userData.role === "admin" || userData.role === "librarian") {
          navigate("/admin-dashboard", { replace: true });
        } else {
          navigate("/user-home", { replace: true });
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const checkForOverdueBooks = async (userEmail) => {
    try {
      const response = await axios.get(
        `https://paranaque-web-system.onrender.com/api/transactions/overdue/user/${userEmail}`
      );
      
      const overdueData = response.data.overdue || [];
      
      if (overdueData && overdueData.length > 0) {
        setOverdueBooks(overdueData);
        setShowOverdueModal(true);
        return true; // Has overdue books
      }
      
      return false; // No overdue books
    } catch (error) {
      console.error('Error checking overdue books:', error);
      return false;
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Show loading indicator
      Swal.fire({
        title: "Logging in...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/login", form);
      const user = res.data.user;

      // Only redirect admin/librarian immediately
      if (user.role === "admin" || user.role === "librarian") {
        Swal.hideLoading();
        
        await Swal.fire({
          title: "Parañaledge",
          text: res.data.message,
          icon: "success",
          confirmButtonText: "OK"
        });
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("user", JSON.stringify(user));
        console.log("Admin or Librarian logged in:", user);
        navigate("/admin-dashboard");
      } else {
        // For regular users, check for overdue books first
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("user", JSON.stringify(user));
        setCurrentUser(user);

        // Check for overdues
        const hasOverdues = await checkForOverdueBooks(user.email);

        Swal.hideLoading();
        
        await Swal.fire({
          title: "Parañaledge",
          text: res.data.message,
          icon: "success",
          confirmButtonText: "OK"
        });

        // If no overdues, navigate directly
        if (!hasOverdues) {
          console.log("User logged in:", user);
          navigate("/user-home");
        }
        // If overdues exist, the modal will be shown
      }
    } catch (err) {
      Swal.hideLoading();
      setLoading(false);
      console.log(err);
      const message = err.response?.data?.message;
      if (message === "Please verify your email before logging in.") {
        await Swal.fire({
          title: "Parañaledge",
          text: "Please check your Gmail and verify your account before logging in.",
          icon: "warning",
          confirmButtonText: "OK"
        });
      } else {
        await Swal.fire({
          title: "Parañaledge",
          text: message || "Login failed.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOverdueModalClose = () => {
    setShowOverdueModal(false);
    navigate("/user-home");
  };

  return (
    <div className="auth-container">
      {showOverdueModal && (
        <OverdueModal 
          overdueBooks={overdueBooks} 
          userEmail={currentUser?.email}
          onClose={handleOverdueModalClose}
        />
      )}
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={schoolImage} alt="School" />
        </div>
        <div className="auth-card">
          <img className="logo" src={logo} alt="logo" />
          <h2>Welcome to Parañaledge</h2>
          <form className="auth-form" onSubmit={handleLogin}>
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              autoComplete="off"
              required
              disabled={showOverdueModal}
            />
            <PasswordInput
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              disabled={showOverdueModal}
            />
            <button type="submit" disabled={loading || showOverdueModal} style={{ opacity: (loading || showOverdueModal) ? 0.6 : 1, cursor: (loading || showOverdueModal) ? 'not-allowed' : 'pointer' }}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            Don’t have an account?{" "}
            <Link to="/register" style={{ color: "#2e7d32", fontWeight: "bold" }}>
              Register
            </Link>
          </div>          <div style={{ textAlign: "center", marginTop: "10px" }}>
            <Link to="/forgot-password" style={{ color: "#2e7d32", fontWeight: "bold", fontSize: "14px" }}>
              Forgot Password?
            </Link>
          </div>        </div>
      </div>
    </div>
  );
}

export default Login;
