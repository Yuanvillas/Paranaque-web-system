import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const initialPasswordData = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: ""
};

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;

const ChangePasswordButton = ({ email }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [passwordData, setPasswordData] = useState(initialPasswordData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    if (isSubmitting) return;
    setIsOpen(false);
    setPasswordData(initialPasswordData);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email) {
      setError("Unable to identify the current account.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (!passwordPattern.test(passwordData.newPassword)) {
      setError("Use at least 8 characters with uppercase, lowercase, a number, and a special character.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.put(
        "https://paranaque-web-system.onrender.com/api/auth/change-password",
        {
          email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        }
      );

      setIsOpen(false);
      setPasswordData(initialPasswordData);
      setError("");
      await Swal.fire({
        title: "Parañaledge",
        text: response.data.message || "Password updated successfully.",
        icon: "success",
        confirmButtonText: "OK"
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Password change failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          marginTop: 16,
          padding: "10px 16px",
          backgroundColor: "#2e7d32",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontWeight: 600
        }}
      >
        Change Password
      </button>

      {isOpen && (
        <div
          className="modal-overlay"
          onClick={closeModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100
          }}
        >
          <div
            className="modal-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="change-password-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "#fff",
              padding: "24px",
              borderRadius: 10,
              width: 380,
              maxWidth: "90vw",
              position: "relative",
              boxSizing: "border-box"
            }}
          >
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              aria-label="Close change password form"
              style={{
                position: "absolute",
                top: 8,
                right: 12,
                border: "none",
                background: "transparent",
                fontSize: 24,
                cursor: isSubmitting ? "not-allowed" : "pointer"
              }}
            >
              ×
            </button>
            <h3 id="change-password-title" style={{ margin: "0 0 18px" }}>
              Change Password
            </h3>
            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
              <input
                type="password"
                placeholder="Current password"
                aria-label="Current password"
                autoComplete="current-password"
                required
                value={passwordData.currentPassword}
                onChange={(event) => setPasswordData({
                  ...passwordData,
                  currentPassword: event.target.value
                })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="New password"
                aria-label="New password"
                autoComplete="new-password"
                required
                value={passwordData.newPassword}
                onChange={(event) => setPasswordData({
                  ...passwordData,
                  newPassword: event.target.value
                })}
                style={inputStyle}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                aria-label="Confirm new password"
                autoComplete="new-password"
                required
                value={passwordData.confirmNewPassword}
                onChange={(event) => setPasswordData({
                  ...passwordData,
                  confirmNewPassword: event.target.value
                })}
                style={inputStyle}
              />
              {error && (
                <p role="alert" style={{ color: "#c62828", margin: 0, fontSize: 13 }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "11px 16px",
                  backgroundColor: "#2e7d32",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  cursor: isSubmitting ? "wait" : "pointer",
                  fontWeight: 600
                }}
              >
                {isSubmitting ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  border: "1px solid #ddd",
  borderRadius: 6,
  fontSize: 14
};

export default ChangePasswordButton;
