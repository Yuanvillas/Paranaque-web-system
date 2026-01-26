import React, { useState } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";
import PasswordInput from "../ui/PasswordInput";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Show loading indicator
      await Swal.fire({
        title: "Logging in...",
        html: `<div style="display: flex; justify-content: center; align-items: center;">
          <div style="
            border: 4px solid #f3f3f3;
            border-top: 4px solid #2e7d32;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          "></div>
        </div>`,
        icon: undefined,
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: async (modal) => {
          Swal.showLoading();
        }
      });

      const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/login", form);
      const user = res.data.user;

      Swal.hideLoading();
      
      await Swal.fire({
        title: "Parañaledge",
        text: res.data.message,
        icon: "success",
        confirmButtonText: "OK"
      });
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "admin" || user.role === "librarian") {
        console.log("Admin or Librarian logged in:", user);
        navigate("/admin-dashboard");
      } else {
        console.log("User logged in:", user);
        navigate("/user-home");
      }
    } catch (err) {
      Swal.hideLoading();
      setLoading(false);
      console.log(err)
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

  return (
    <div className="auth-container">
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
            />
            <PasswordInput
              type="password"
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
            />
            <button type="submit" disabled={loading} style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
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
