// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import "../styles/mini-bs.css"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera } from "@fortawesome/free-solid-svg-icons";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [uploadingPicture, setUploadingPicture] = useState(false);
  
  const [passwordError, setPasswordError] = useState("");

  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`https://paranaque-web-system.onrender.com/api/auth/profile/${email}`);
        setUser(res.data);
        setForm(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    if (email) fetchUser();
  }, [email]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      const res = await axios.put(`https://paranaque-web-system.onrender.com/api/auth/profile/${email}`, form);

      await Swal.fire({
        title: "Parañaledge",
        text: res.data.message,
        icon: "success",
        confirmButtonText: "OK"
      });
      setUser(res.data.user);

      if (form.email !== email) {
        localStorage.setItem("userEmail", form.email);
      }

      setEditMode(false);
    } catch (err) {
      await Swal.fire({
        title: "Parañaledge",
        text: err.response?.data?.message || "Update failed.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const handlePasswordChange = async () => {
    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    if (newPassword !== confirmNewPassword) {
      await Swal.fire({
        title: "Parañaledge",
        text: "New passwords do not match.",
        icon: "warning",
        confirmButtonText: "OK"
      });
      return;
    }

    try {
      const res = await axios.put(`https://paranaque-web-system.onrender.com/api/auth/change-password`, {
        email,
        currentPassword,
        newPassword,
      });

      await Swal.fire({
        title: "Parañaledge",
        text: res.data.message,
        icon: "success",
        confirmButtonText: "OK"
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowPasswordForm(false);
    } catch (err) {
      await Swal.fire({
        title: "Parañaledge",
        text: err.response?.data?.message || "Password change failed.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/;
    if (!password) return "Password is required.";
    if (!passwordRegex.test(password)) {
      return "Min 8 characters, incl. uppercase, lowercase, number, and special character.";
    }
    return "";
  };

  const handlePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingPicture(true);
    const reader = new FileReader();

    reader.onloadend = async () => {
      const imageBase64 = reader.result;

      try {
        const res = await axios.put(
          `https://paranaque-web-system.onrender.com/api/auth/profile/upload-image/${email}`,
          { profilePicture: imageBase64 }
        );

        await Swal.fire({
          title: "Parañaledge",
          text: "Profile picture updated successfully!",
          icon: "success",
          confirmButtonText: "OK"
        });

        setUser(res.data.user);
        setForm(res.data.user);
      } catch (error) {
        await Swal.fire({
          title: "Parañaledge",
          text: "Failed to upload profile picture.",
          icon: "error",
          confirmButtonText: "OK"
        });
      } finally {
        setUploadingPicture(false);
      }
    };

    reader.readAsDataURL(file);
  };

  if (!user) return <div>Loading...</div>;
  console.log(user);
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div style={{ position: 'relative', display: 'inline-block' }}>
          {user.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt="User Avatar" 
              className="profile-avatar"
              style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover' }}
              onError={(e) => {
                e.target.style.display = 'none';
                document.getElementById('placeholder-avatar')?.style.removeProperty('display');
              }}
            />
          ) : null}
          <div 
            id="placeholder-avatar"
            style={{
              width: '150px', 
              height: '150px', 
              borderRadius: '50%', 
              backgroundColor: '#e0e0e0',
              display: user.profilePicture ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '60px',
              color: '#999'
            }}
          >
            {user.firstName?.[0]?.toUpperCase()}{user.lastName?.[0]?.toUpperCase()}
          </div>
          <label
            htmlFor="avatar-upload"
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: '#1dbf73',
              color: 'white',
              borderRadius: '50%',
              width: '35px',
              height: '35px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              border: '2px solid white'
            }}
          >
            <FontAwesomeIcon icon={faCamera} />
          </label>
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handlePictureUpload}
            disabled={uploadingPicture}
            style={{ display: 'none' }}
          />
        </div>

        {editMode ? (
          <div className="d-flex flex-column gap-2" style={{width: '300px'}}>
            <input className="form-input" type="text" name="firstName" value={form.firstName} onChange={handleChange} placeholder="First Name" />
            <input className="form-input" type="text" name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last Name" />
            <input className="form-input" type="text" name="email" value={form.email} onChange={handleChange} placeholder="Email" />
            <input className="form-input" type="text" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Contact Number" />
            <input className="form-input" type="text" name="address" value={form.address} onChange={handleChange} placeholder="Address" />
            <button className="btn orange-button" onClick={handleSave}>Save</button>
            <button className="btn" onClick={() => setEditMode(false)}>Cancel</button>
          </div>
        ) : (
          <>
            <h2>{user.firstName} {user.lastName} {user.suffix}</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Contact:</strong> {user.contactNumber}</p>
            <p><strong>Address:</strong> {user.address}</p>
            <button className="primary-button" onClick={() => setEditMode(true)}>Edit Profile</button>
          </>
        )}

        <hr />
        <button className="primary-button" onClick={() => {
          setShowPasswordForm(!showPasswordForm);
          if (showPasswordForm) {
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmNewPassword: "",
            });
          }
        }}>
          {showPasswordForm ? "Cancel Password Change" : "Change Password"}
        </button>

        {showPasswordForm && (
          <div className="d-flex flex-column gap-2" style={{width: '300px'}}>
            <input
              className="form-input mt-3"
              type="password"
              placeholder="Current Password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              autoComplete="new-password"
            />
            <input
              className="form-input"
              type="password"
              placeholder="New Password"
              value={passwordData.newPassword}
              onChange={(e) => {
                setPasswordData({ ...passwordData, newPassword: e.target.value });
                setPasswordError(validatePassword(e.target.value));
              }}
              autoComplete="new-password"
            />
            {passwordError && <p style={{ color: "red", fontSize: "0.8rem" }}>{passwordError}</p>}
            <input
              className="form-input"
              type="password"
              placeholder="Confirm New Password"
              value={passwordData.confirmNewPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
              autoComplete="new-password"
            />
            <button className="orange-button" onClick={handlePasswordChange}>Update Password</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
