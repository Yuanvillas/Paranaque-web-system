import React, { useState } from "react";

const AuthForm = ({ type, onSubmit }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",         // ✅ Added address
    email: "",
    password: "",
    confirmPassword: ""
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (type === "register" && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    const dataToSend = { ...formData };
    if (type === "register") delete dataToSend.confirmPassword;

    onSubmit(dataToSend);
  };

  return (
    <div className="auth-card">
      <h2>{type === "register" ? "Sign up to GreenApp" : "Welcome to GreenApp"}</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        {type === "register" && (
          <>
            <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required />
            <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required />
            <input type="text" name="contactNumber" placeholder="Contact Number" value={formData.contactNumber} onChange={handleChange} required />
            <input type="text" name="address" placeholder="Address" value={formData.address} onChange={handleChange} required />
          </>
        )}
        <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required />
        <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} required />
        {type === "register" && (
          <>
            <input type="password" name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} required />
            <p className="terms-text">Creating an account means you agree to our Terms of Service and Privacy Policy.</p>
          </>
        )}
        <button type="submit">{type === "register" ? "SIGN UP" : "SIGN IN"}</button>
      </form>
    </div>
  );
};

export default AuthForm;
