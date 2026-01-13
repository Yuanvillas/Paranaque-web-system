import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const PasswordInput = ({ value, onChange, onClick, name, placeholder }) => {
  const [showPassword, setShowPassword] = useState(false);

  const toggleVisibility = () => {
    setShowPassword(!showPassword);
    if (onClick) onClick(); // Trigger onClick if passed
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <input
        type={showPassword ? "text" : "password"}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || "Enter password"}
        style={{ width: "100%", paddingRight: "2rem"}}
      />
      <span
        onClick={toggleVisibility}
        style={{
          position: "absolute",
          right: "10px",
          top: "50%",
          transform: "translateY(-50%)",
          cursor: "pointer",
          color: showPassword ? "#1dbf73" : "#6b7280"
        }}
      >
        {showPassword ? <FaEyeSlash/> : <FaEye />}
      </span>
    </div>
  );
};

export default PasswordInput;
