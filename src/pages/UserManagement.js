import React, { useEffect, useState } from "react";
import { authenticatedFetch } from "../utils/authHelper";
import Swal from "sweetalert2";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../components/App.css";
import "../styles/user-management.css";
import { isValidEmail } from "../utils/emailValidation";

const STREET_SUGGESTIONS_KEY = "registerStreetSuggestions";
const MAX_STREET_SUGGESTIONS = 20;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [viewUserLogs, setViewUserLogs] = useState(null);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editError, setEditError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterRole, setFilterRole] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [createForm, setCreateForm] = useState({
    firstName: "",
    lastName: "",
    suffix: "",
    street: "",
    region: "",
    city: "",
    barangay: "",
    contactNumber: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [createErrors, setCreateErrors] = useState({});
  const [createTouched, setCreateTouched] = useState({});
  const [createStreetSuggestions, setCreateStreetSuggestions] = useState([]);
  const [createStreetSuggestionError, setCreateStreetSuggestionError] = useState("");
  const [createLocationError, setCreateLocationError] = useState("");
  const [createRegions, setCreateRegions] = useState([]);
  const [createCities, setCreateCities] = useState([]);
  const [createBarangays, setCreateBarangays] = useState([]);
  const navigate = useNavigate();

  const ADMIN_PASSCODE = "1234";
  const getUserRole = (user) =>
    typeof user.role === "string" ? user.role.trim().toLowerCase() : "user";
  const countUsersByRole = (role) => users.filter((user) => getUserRole(user) === role).length;

  useEffect(() => {
    try {
      const savedSuggestions = localStorage.getItem(STREET_SUGGESTIONS_KEY);
      if (!savedSuggestions) return;

      const parsedSuggestions = JSON.parse(savedSuggestions);
      if (!Array.isArray(parsedSuggestions) || !parsedSuggestions.every((value) => typeof value === "string")) {
        throw new Error("Saved street suggestions have an invalid format.");
      }

      setCreateStreetSuggestions(
        parsedSuggestions.filter((value) => value.trim().length >= 2).slice(0, MAX_STREET_SUGGESTIONS)
      );
    } catch (loadError) {
      console.error("Failed to load saved street suggestions:", loadError);
      setCreateStreetSuggestionError("Saved street suggestions could not be loaded from this device.");
    }
  }, []);

  useEffect(() => {
    axios.get("https://psgc.gitlab.io/api/regions.json")
      .then((res) => {
        setCreateRegions(res.data);
        setCreateLocationError("");
      })
      .catch((loadError) => {
        console.error("Failed to load regions:", loadError);
        setCreateLocationError("Could not load regions. Please try again later.");
      });
  }, []);

  useEffect(() => {
    if (!createForm.region) {
      setCreateCities([]);
      return;
    }

    axios.get(`https://psgc.gitlab.io/api/regions/${createForm.region}/cities.json`)
      .then((res) => {
        setCreateCities(res.data);
        setCreateLocationError("");
      })
      .catch((loadError) => {
        console.error("Failed to load cities:", loadError);
        setCreateLocationError("Could not load cities for the selected region.");
      });
  }, [createForm.region]);

  useEffect(() => {
    if (!createForm.city) {
      setCreateBarangays([]);
      return;
    }

    axios.get(`https://psgc.gitlab.io/api/cities/${createForm.city}/barangays.json`)
      .then((res) => {
        setCreateBarangays(res.data);
        setCreateLocationError("");
      })
      .catch((loadError) => {
        console.error("Failed to load barangays:", loadError);
        setCreateLocationError("Could not load barangays for the selected city.");
      });
  }, [createForm.city]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/users");
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users);
      } else {
        setError(data.error || "Failed to fetch users.");
      }
    } catch (err) {
      setError("Error fetching users.");
    }
  };

  const deleteUser = async (userId) => {
    const confirm = window.confirm("Are you sure you want to archive this user? The user will be moved to the archive storage.");
    if (!confirm) return;

    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(users.filter(user => user._id !== userId));
        await Swal.fire({
          title: "Parañaledge",
          text: "User archived successfully. The user can be found in the User Archive.",
          icon: "success",
          confirmButtonText: "OK"
        });
      } else {
        const data = await res.json();
        await Swal.fire({
          title: "Parañaledge",
          text: data.error || "Failed to archive user.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      contactNumber: user.contactNumber,
      address: user.address,
      email: user.email,
      role: user.role || 'user',
      password: '',
    });
    setEditError("");
  };

  const handleEditChange = (e) => {
    console.log("Edit change:", e.target.name, e.target.value);
    const { name, value } = e.target;
    let passcode = window.prompt("Enter passcode to set user as admin:");
    if (passcode !== ADMIN_PASSCODE) {
      setEditError("Incorrect passcode. Role not changed.");
      return;
    } else {
      setEditError("");
    }
    passcode = "";
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangeUserRole = async (e, userId) => {
    console.log("Edit change:", e.target.name, e.target.value, userId);
    const passcode = window.prompt("Enter passcode to set user as admin:");
    if (passcode !== ADMIN_PASSCODE) {
      setEditError("Incorrect passcode. Role not changed.");
      return;
    } else {
      setEditError("");
    }
    console.log("Passcode correct. Updating role.", passcode);
    await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}/update-role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: e.target.value })
    });
  };

  const saveEdit = async (userId) => {
    if (!editForm.firstName || !editForm.lastName || !editForm.contactNumber || !editForm.address) {
      setEditError("All fields are required.");
      return;
    }
    try {
      const res = await fetch(`https://paranaque-web-system.onrender.com/api/auth/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(users.map(u => u._id === userId ? { ...u, ...editForm } : u));
        setEditingUser(null);
        setEditError("");
      } else {
        setEditError(data.message || "Failed to update user.");
      }
    } catch (err) {
      setEditError("Error updating user.");
    }
  };

  const handleViewHistory = (email) => {
    setViewUserLogs(email);
  }

  const cancelEdit = () => {
    setEditingUser(null);
    setEditError("");
  };

  const getCreateFieldError = (name, value, values = createForm) => {
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) return "This field is required.";
        if (value.trim().length < 2) return "Must be at least 2 characters.";
        if (!/^[a-zA-Z\s]+$/.test(value)) return "Only letters and spaces are allowed.";
        return "";
      case "contactNumber":
        if (!/^09\d{9}$/.test(value)) return "Must be 11 digits and start with '09'.";
        return "";
      case "email":
        if (!value) return "Email is required.";
        if (!isValidEmail(value)) return "Please enter a valid email address.";
        return "";
      case "password":
        if (!value) return "Password is required.";
        if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/.test(value)
        ) return "Password must include uppercase, lowercase, number, special character.";
        return "";
      case "confirmPassword":
        if (!value) return "Please confirm your password.";
        if (value !== values.password) return "Passwords do not match.";
        return "";
      case "street":
        if (!value.trim()) return "Street is required.";
        if (value.trim().length < 2) return "Must be at least 2 characters.";
        return "";
      case "region":
        if (!value) return "Please select a region.";
        return "";
      case "city":
        if (!value) return "Please select a city.";
        return "";
      case "barangay":
        if (!value) return "Please select a barangay.";
        return "";
      default:
        return "";
    }
  };

  const getCreateFieldFeedback = (name) => {
    if (!createTouched[name]) return null;

    const error = createErrors[name];
    const validMessages = {
      firstName: "Valid first name",
      lastName: "Valid last name",
      contactNumber: "Valid contact number",
      email: "Valid email address",
      password: "Password meets the requirements",
      confirmPassword: "Passwords match",
      street: "Valid street",
      region: "Valid region",
      city: "Valid city",
      barangay: "Valid barangay",
    };

    return (
      <p
        id={`${name}-feedback`}
        className={`create-field-feedback ${error ? "error-text" : "valid-text"}`}
        role="status"
      >
        {error || `✓ ${validMessages[name]}`}
      </p>
    );
  };

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...createForm, [name]: value };
    if (name === "region") {
      updatedForm.city = "";
      updatedForm.barangay = "";
      setCreateCities([]);
      setCreateBarangays([]);
    } else if (name === "city") {
      updatedForm.barangay = "";
      setCreateBarangays([]);
    }
    setCreateForm(updatedForm);
    setCreateTouched((prev) => ({ ...prev, [name]: true }));
    setCreateErrors((prev) => {
      const updatedErrors = {
        ...prev,
        [name]: getCreateFieldError(name, value, updatedForm),
      };
      if (name === "region") {
        updatedErrors.city = getCreateFieldError("city", "", updatedForm);
        updatedErrors.barangay = getCreateFieldError("barangay", "", updatedForm);
      } else if (name === "city") {
        updatedErrors.barangay = getCreateFieldError("barangay", "", updatedForm);
      }
      if (name === "password" && createTouched.confirmPassword) {
        updatedErrors.confirmPassword = getCreateFieldError(
          "confirmPassword",
          updatedForm.confirmPassword,
          updatedForm
        );
      }
      return updatedErrors;
    });
  };

  const handleCreateBlur = (e) => {
    const { name, value } = e.target;
    setCreateTouched((prev) => ({ ...prev, [name]: true }));
    setCreateErrors((prev) => ({
      ...prev,
      [name]: getCreateFieldError(name, value),
    }));
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const fieldsToValidate = [
      "firstName",
      "lastName",
      "street",
      "region",
      "city",
      "barangay",
      "contactNumber",
      "email",
      "password",
      "confirmPassword",
    ];
    const newErrors = fieldsToValidate.reduce((errors, field) => {
      errors[field] = getCreateFieldError(field, createForm[field]);
      return errors;
    }, {});
    setCreateErrors(newErrors);
    setCreateTouched(
      fieldsToValidate.reduce((touched, field) => ({ ...touched, [field]: true }), {})
    );

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    const selectedRegion = createRegions.find((region) => region.code === createForm.region);
    const selectedCity = createCities.find((city) => city.code === createForm.city);
    const selectedBarangay = createBarangays.find((barangay) => barangay.name === createForm.barangay);
    const address = [
      createForm.street.trim(),
      selectedBarangay?.name,
      selectedCity?.name,
      selectedRegion?.name,
    ].filter(Boolean).join(", ");

    try {
      const res = await fetch("https://paranaque-web-system.onrender.com/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: createForm.firstName,
          lastName: createForm.lastName,
          contactNumber: createForm.contactNumber,
          email: createForm.email,
          password: createForm.password,
          address,
        }),
      });
      
      const data = await res.json();
      if (res.ok) {
        let successMessage = "Account created successfully!";
        const street = createForm.street.trim();
        const updatedSuggestions = [
          street,
          ...createStreetSuggestions.filter(
            (suggestion) => suggestion.toLowerCase() !== street.toLowerCase()
          ),
        ].slice(0, MAX_STREET_SUGGESTIONS);
        try {
          localStorage.setItem(STREET_SUGGESTIONS_KEY, JSON.stringify(updatedSuggestions));
          setCreateStreetSuggestions(updatedSuggestions);
          setCreateStreetSuggestionError("");
        } catch (storageError) {
          console.error("Failed to save street suggestion:", storageError);
          successMessage += " The street suggestion could not be saved on this device.";
        }
        Swal.fire({
          title: "Parañaledge",
          text: successMessage,
          icon: "success",
          confirmButtonText: "OK"
        });
        setShowCreateModal(false);
        setCreateForm({
          firstName: "",
          lastName: "",
          suffix: "",
          street: "",
          region: "",
          city: "",
          barangay: "",
          contactNumber: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setCreateErrors({});
        setCreateTouched({});
        setCreateCities([]);
        setCreateBarangays([]);
        fetchUsers();
      } else {
        Swal.fire({
          title: "Parañaledge",
          text: data.message || "Failed to create account.",
          icon: "error",
          confirmButtonText: "OK"
        });
      }
    } catch (err) {
      Swal.fire({
        title: "Parañaledge",
        text: "Error creating account.",
        icon: "error",
        confirmButtonText: "OK"
      });
    }
  };

  const cancelCreate = () => {
    setShowCreateModal(false);
    setCreateForm({
      firstName: "",
      lastName: "",
      suffix: "",
      street: "",
      region: "",
      city: "",
      barangay: "",
      contactNumber: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setCreateErrors({});
    setCreateTouched({});
    setCreateCities([]);
    setCreateBarangays([]);
  };

  const exportUsersToCSV = () => {
    if (users.length === 0) {
      Swal.fire({
        title: "Parañaledge",
        text: "No users to export.",
        icon: "info",
        confirmButtonText: "OK"
      });
      return;
    }

    const headers = ["First Name", "Last Name", "Email", "Contact Number", "Address", "Role"];
    const rows = users.map(user => [
      user.firstName,
      user.lastName,
      user.email,
      user.contactNumber,
      user.address,
      user.role
    ]);

    let csvContent = headers.join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Swal.fire({
      title: "Parañaledge",
      text: `Successfully exported ${users.length} users.`,
      icon: "success",
      confirmButtonText: "OK"
    });
  };

  useEffect(() => {
    fetchUsers();
    authenticatedFetch("https://paranaque-web-system.onrender.com/api/logs")
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.logs);
      })
      .catch((err) => {
        console.error('Error fetching logs:', err);
        setError("Failed to fetch logs.");
      });
  }, []);

  return (
    <div className="dashboard">
      <main className="main-content">
        <section className="content">
          <div className="um">
            <div className="um-header">
              <button className="um-back-btn" onClick={() => navigate('/admin-dashboard')}>
                ← Back
              </button>
              <h1 className="um-title">User Management</h1>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="um-btn um-create" onClick={() => navigate('/admin/archived-users')}>
                  📦 Archived Users
                </button>
                <button className="um-btn um-create" onClick={exportUsersToCSV}>
                  📥 Export Users
                </button>
                <button className="um-btn um-create" onClick={() => {
                  setShowCreateModal(true);
                  setCreateForm({
                    firstName: "",
                    lastName: "",
                    suffix: "",
                    street: "",
                    region: "",
                    city: "",
                    barangay: "",
                    contactNumber: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                  setCreateErrors({});
                  setCreateTouched({});
                  setCreateCities([]);
                  setCreateBarangays([]);
                }}>
                  + Create New Account
                </button>
              </div>
            </div>

            {error && <div className="um-error">{error}</div>}

            {/* Search Bar */}
            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Search by name, email, or contact number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '5px',
                  border: '2px solid #ddd',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.3s'
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div className="um-filter-buttons" style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button 
                className={`um-filter-btn ${filterRole === 'all' ? 'active' : ''}`}
                onClick={() => {
                  setFilterRole('all');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'all' ? '#4CAF50' : '#ddd'}`,
                  backgroundColor: filterRole === 'all' ? '#4CAF50' : 'white',
                  color: filterRole === 'all' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                All Users ({users.length})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'user' ? 'active' : ''}`}
                onClick={() => {
                  setFilterRole('user');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'user' ? '#2196F3' : '#ddd'}`,
                  backgroundColor: filterRole === 'user' ? '#2196F3' : 'white',
                  color: filterRole === 'user' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Regular Users ({countUsersByRole('user')})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'librarian' ? 'active' : ''}`}
                onClick={() => {
                  setFilterRole('librarian');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'librarian' ? '#FF9800' : '#ddd'}`,
                  backgroundColor: filterRole === 'librarian' ? '#FF9800' : 'white',
                  color: filterRole === 'librarian' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Librarians ({countUsersByRole('librarian')})
              </button>
              <button 
                className={`um-filter-btn ${filterRole === 'admin' ? 'active' : ''}`}
                onClick={() => {
                  setFilterRole('admin');
                  setCurrentPage(1);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '5px',
                  border: `2px solid ${filterRole === 'admin' ? '#F44336' : '#ddd'}`,
                  backgroundColor: filterRole === 'admin' ? '#F44336' : 'white',
                  color: filterRole === 'admin' ? 'white' : '#333',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Admins ({countUsersByRole('admin')})
              </button>
            </div>

            {users.length === 0 ? (
              <p className="um-empty">No users found.</p>
            ) : (() => {
              // Filter users based on role and search
              const filteredUsers = users
                .filter(user => filterRole === 'all' || getUserRole(user) === filterRole)
                .filter(user => {
                  const searchLower = searchQuery.toLowerCase();
                  const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
                  const email = user.email.toLowerCase();
                  const contact = user.contactNumber.toLowerCase();
                  return (
                    fullName.includes(searchLower) ||
                    email.includes(searchLower) ||
                    contact.includes(searchLower)
                  );
                });

              // Calculate pagination
              const totalPages = Math.ceil(filteredUsers.length / pageSize);
              const startIndex = (currentPage - 1) * pageSize;
              const endIndex = startIndex + pageSize;
              const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

              // Reset to page 1 if current page exceeds total pages
              if (currentPage > totalPages && totalPages > 0) {
                setCurrentPage(1);
              }

              return (
                <div>
                  {totalPages > 1 && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      padding: '15px',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '5px'
                    }}>
                      <button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === 1 ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ← Previous
                      </button>

                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#333' }}>
                        Page {currentPage} of {totalPages} (Showing {paginatedUsers.length} of {filteredUsers.length} users)
                      </span>

                      <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: currentPage === totalPages ? '#ccc' : '#4CAF50',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                  <div className="um-table-wrapper">
                    <table className="um-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Contact</th>
                          <th>Address</th>
                          <th>Role</th>
                          <th className="um-actions-col">Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                              No users found on this page.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map((user) => {
                            const role = getUserRole(user);
                            return (
                              <tr
                                key={user._id}
                                className={`um-row um-row-${role}`}
                                style={{
                                  borderLeft: role === 'admin' ? '4px solid #F44336' :
                                    role === 'librarian' ? '4px solid #FF9800' :
                                      '4px solid #2196F3',
                                  backgroundColor: role === 'admin' ? '#FFEBEE' :
                                    role === 'librarian' ? '#FFF3E0' :
                                      'transparent'
                                }}
                              >
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.contactNumber}</td>
                                <td>{user.address}</td>

                                <td>
                                  <select
                                    name="role"
                                    className="um-select"
                                    value={role}
                                    onChange={(e) => handleChangeUserRole(e, user._id)}
                                    style={{
                                      fontWeight: 'bold',
                                      color: role === 'admin' ? '#F44336' :
                                        role === 'librarian' ? '#FF9800' :
                                          '#2196F3'
                                    }}
                                  >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                    <option value="librarian">Librarian</option>
                                  </select>
                                </td>

                                <td className="um-actions">
                                  <button onClick={() => startEdit(user)} className="um-btn um-edit">Edit</button>
                                  <button onClick={() => deleteUser(user._id)} className="um-btn um-delete">Archive</button>
                                  <button onClick={() => handleViewHistory(user.email)} className="um-btn um-save">History</button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}

            {editError && <p className="um-error mt-10">{editError}</p>}
          </div>

          {editingUser && (
            <div className="modal-overlay">
              <div className="modal-content">

                <h2>Edit User</h2>

                <input
                  name="firstName"
                  value={editForm.firstName}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="First Name"
                />

                <input
                  name="lastName"
                  value={editForm.lastName}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Last Name"
                />

                <input
                  name="contactNumber"
                  value={editForm.contactNumber}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Contact Number"
                />

                <input
                  name="address"
                  value={editForm.address}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="Address"
                />

                <select
                  name="role"
                  value={editForm.role}
                  onChange={handleEditChange}
                  className="modal-input"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="librarian">Librarian</option>
                </select>

                <input
                  type="password"
                  name="password"
                  value={editForm.password}
                  onChange={handleEditChange}
                  className="modal-input"
                  placeholder="New Password (leave empty to keep current)"
                  autoComplete="new-password"
                />

                {editError && <p className="error-text">{editError}</p>}

                <div className="modal-actions">
                  <button className="modal-save" onClick={() => saveEdit(editingUser)}>Save</button>
                  <button className="modal-cancel" onClick={cancelEdit}>Cancel</button>
                </div>

              </div>
            </div>
          )}

          {showCreateModal && (
            <div className="modal-overlay">
              <div className="modal-content create-account-modal">
                <h2>Create New Account</h2>

                <input
                  type="text"
                  name="firstName"
                  value={createForm.firstName}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.firstName && createErrors.firstName)}
                  aria-describedby="firstName-feedback"
                  className={`modal-input ${createTouched.firstName ? (createErrors.firstName ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="First Name"
                />
                {getCreateFieldFeedback("firstName")}

                <input
                  type="text"
                  name="lastName"
                  value={createForm.lastName}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.lastName && createErrors.lastName)}
                  aria-describedby="lastName-feedback"
                  className={`modal-input ${createTouched.lastName ? (createErrors.lastName ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="Last Name"
                />
                {getCreateFieldFeedback("lastName")}

                <input
                  type="text"
                  name="street"
                  value={createForm.street}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.street && createErrors.street)}
                  aria-describedby="street-feedback"
                  className={`modal-input ${createTouched.street ? (createErrors.street ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="House No., Street, Subdivision"
                  list="create-user-street-suggestions"
                />
                <datalist id="create-user-street-suggestions">
                  {createStreetSuggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                <p className="street-suggestion-note">
                  Previous street entries are saved in this browser for suggestions. Avoid using this on a shared device.
                </p>
                {getCreateFieldFeedback("street")}
                {createStreetSuggestionError && (
                  <p className="error-text">{createStreetSuggestionError}</p>
                )}

                <div className="create-location-row">
                  <div>
                    <select
                      name="region"
                      value={createForm.region}
                      onChange={handleCreateChange}
                      onBlur={handleCreateBlur}
                      aria-invalid={Boolean(createTouched.region && createErrors.region)}
                      aria-describedby="region-feedback"
                      className={`modal-input ${createTouched.region ? (createErrors.region ? "is-invalid" : "is-valid") : ""}`}
                    >
                      <option value="">Select Region</option>
                      {createRegions.map((region) => (
                        <option key={region.code} value={region.code}>{region.name}</option>
                      ))}
                    </select>
                    {getCreateFieldFeedback("region")}
                  </div>
                  <div>
                    <select
                      name="city"
                      value={createForm.city}
                      onChange={handleCreateChange}
                      onBlur={handleCreateBlur}
                      disabled={!createForm.region}
                      aria-invalid={Boolean(createTouched.city && createErrors.city)}
                      aria-describedby="city-feedback"
                      className={`modal-input ${createTouched.city ? (createErrors.city ? "is-invalid" : "is-valid") : ""}`}
                    >
                      <option value="">Select City</option>
                      {createCities.map((city) => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                    {getCreateFieldFeedback("city")}
                  </div>
                </div>

                <select
                  name="barangay"
                  value={createForm.barangay}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  disabled={!createForm.city}
                  aria-invalid={Boolean(createTouched.barangay && createErrors.barangay)}
                  aria-describedby="barangay-feedback"
                  className={`modal-input ${createTouched.barangay ? (createErrors.barangay ? "is-invalid" : "is-valid") : ""}`}
                >
                  <option value="">Select Barangay</option>
                  {createBarangays.map((barangay) => (
                    <option key={barangay.code} value={barangay.name}>{barangay.name}</option>
                  ))}
                </select>
                {getCreateFieldFeedback("barangay")}
                {createLocationError && <p className="error-text">{createLocationError}</p>}

                <input
                  type="text"
                  name="contactNumber"
                  value={createForm.contactNumber}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.contactNumber && createErrors.contactNumber)}
                  aria-describedby="contactNumber-feedback"
                  className={`modal-input ${createTouched.contactNumber ? (createErrors.contactNumber ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="Contact Number (09XXXXXXXXX)"
                />
                {getCreateFieldFeedback("contactNumber")}

                <input
                  type="email"
                  name="email"
                  value={createForm.email}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.email && createErrors.email)}
                  aria-describedby="email-feedback"
                  className={`modal-input ${createTouched.email ? (createErrors.email ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="Email"
                  autoComplete="off"
                />
                {getCreateFieldFeedback("email")}

                <input
                  type="password"
                  name="password"
                  value={createForm.password}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.password && createErrors.password)}
                  aria-describedby="password-feedback"
                  className={`modal-input ${createTouched.password ? (createErrors.password ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="Password"
                  autoComplete="new-password"
                />
                {getCreateFieldFeedback("password")}

                <input
                  type="password"
                  name="confirmPassword"
                  value={createForm.confirmPassword}
                  onChange={handleCreateChange}
                  onBlur={handleCreateBlur}
                  aria-invalid={Boolean(createTouched.confirmPassword && createErrors.confirmPassword)}
                  aria-describedby="confirmPassword-feedback"
                  className={`modal-input ${createTouched.confirmPassword ? (createErrors.confirmPassword ? "is-invalid" : "is-valid") : ""}`}
                  placeholder="Confirm Password"
                  autoComplete="new-password"
                />
                {getCreateFieldFeedback("confirmPassword")}

                <div className="modal-actions">
                  <button className="modal-save" onClick={handleCreateAccount}>Create</button>
                  <button className="modal-cancel" onClick={cancelCreate}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {viewUserLogs && (
            <div className="modal-overlay">
              <div className="modal-content">

                <button className="modal-close-btn" onClick={() => {
                  setViewUserLogs(null);
                  setHistorySearchQuery('');
                }}>
                  ✕
                </button>

                <h2>Book transaction record</h2>

                {/* Search bar inside modal */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: '#f5f5f5' }}>
                  <input
                    type="text"
                    placeholder="🔍 Search book activities (title, action, date)..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '6px',
                      border: '2px solid #ddd',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                      transition: 'all 0.3s',
                      fontFamily: 'Arial, sans-serif'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
                    onBlur={(e) => e.target.style.borderColor = '#ddd'}
                  />
                </div>

                {(() => {
                  const userLogs = logs.filter(log => log.userEmail === viewUserLogs);

                  const relevantLogs = userLogs
                    .filter(log => {
                      const action = (log.action || '').toLowerCase();
                      const description = (log.description || '').toLowerCase();
                      return ['borrow', 'reserve', 'return', 'cancel_reservation', 'cancel_transaction', 'approve_transaction', 'reject_transaction'].includes(action) ||
                        description.includes('borrow') ||
                        description.includes('return') ||
                        description.includes('reserv');
                    })
                    .filter(log => {
                      if (!historySearchQuery) return true;
                      const searchLower = historySearchQuery.toLowerCase();
                      return `${log.action || ''} ${log.description || ''}`.toLowerCase().includes(searchLower);
                    })
                    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                  if (relevantLogs.length === 0) {
                    return <p style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No logs available.</p>;
                  }

                  return (
                    <div className="history-container">
                      {relevantLogs.map((log, idx) => (
                        <div key={idx} className="history-item">
                          <p className="history-action">{log.description || log.action}</p>
                          <p className="history-date">
                            {new Date(log.timestamp).toLocaleString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        </div>
                      ))}
                    </div>
                  );
                })()}

              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
};

export default UserManagement;
