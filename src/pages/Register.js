import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/loginregister.css";
import schoolImage from "../imgs/schoolpic.png";
import logo from "../imgs/liblogo.png";
import PasswordInput from "../ui/PasswordInput";
import AddBook from "./AddBook";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    suffix: "", 
    contactNumber: "",
    address: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState("");

  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [showTermsModal, setShowTermsModal] = useState(false);

  const validateEmail = (email) => {
    if (!email) {
      setEmailStatus("");
      return "Email is required.";
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      setEmailStatus("invalid");
      return "Please enter a valid email address.";
    }

    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
      setEmailStatus("not-gmail");
      return "Only Gmail addresses are allowed.";
    }

    setEmailStatus("valid");
    return "";
  };

  const validateField = (name, value) => {
    let error = "";
    switch (name) {
      case "firstName":
      case "lastName":
        if (!value.trim()) error = "This field is required.";
        else if (!/^[A-Za-z]+$/.test(value)) error = "Only letters are allowed.";
        break;
      case "contactNumber":
        if (!/^09\d{9}$/.test(value)) error = "Must be 11 digits and start with '09'.";
        break;
      case "email":
        error = validateEmail(value);
        break;
      case "password":
        if (!value) error = "Password is required.";
        else if (
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/.test(value)
        )
          error = "Password must include uppercase, lowercase, number, special character.";
        break;
      case "confirmPassword":
        if (value !== form.password) error = "Passwords do not match.";
        break;
      case "address":
        if (!value.trim()) error = "Address is required.";
        break;
      case "termsAccepted":
        if (!value) error = "You must accept the terms.";
        break;
      default:
        break;
    }
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    setForm((prev) => ({ ...prev, [name]: fieldValue }));
    if (name === "email") validateEmail(fieldValue);
    validateField(name, fieldValue);
    console.log(`Field changed:`, form);
  };

  const getEmailInputStyle = () => {
    const base = {
      padding: "12px",
      marginBottom: "5px",
      border: "1px solid #ddd",
      borderRadius: "4px",
      fontSize: "16px",
      width: "100%",
      boxSizing: "border-box",
    };
    if (emailStatus === "valid")
      return { ...base, borderColor: "#4caf50", backgroundColor: "#f8fff8" };
    if (emailStatus === "invalid" || emailStatus === "not-gmail")
      return { ...base, borderColor: "#f44336", backgroundColor: "#fff8f8" };
    return base;
  };

  const getEmailFeedback = () => {
    switch (emailStatus) {
      case "valid":
        return <p style={{ color: "#4caf50", fontSize: "0.8rem" }}>✓ Valid Gmail address</p>;
      case "invalid":
        return <p style={{ color: "#f44336", fontSize: "0.8rem" }}>✗ Invalid email format</p>;
      case "not-gmail":
        return <p style={{ color: "#f44336", fontSize: "0.8rem" }}>✗ Only Gmail is accepted</p>;
      default:
        return null;
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    // Validate first
    const fields = Object.keys(form);
    let newErrors = {};
    fields.forEach((field) => {
      let error = "";
      switch (field) {
        case "firstName":
        case "lastName":
          if (!form[field].trim()) error = "This field is required.";
          else if (!/^[A-Za-z]+$/.test(form[field])) error = "Only letters are allowed.";
          break;
        case "contactNumber":
          if (!/^09\d{9}$/.test(form[field])) error = "Must be 11 digits and start with '09'.";
          break;
        case "email":
          error = validateEmail(form[field]);
          break;
        case "password":
          if (!form[field]) error = "Password is required.";
          else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&^_-])[A-Za-z\d@$!%*#?&^_-]{8,}$/.test(form[field]))
            error = "Password must be strong.";
          break;
        case "confirmPassword":
          if (form[field] !== form.password) error = "Passwords do not match.";
          break;
        case "street":
          if (!form[field].trim()) error = "Street is required.";
          break;
        case "barangay":
          if (!form[field]) error = "Please select a barangay.";
          break;
        case "termsAccepted":
          if (!form[field]) error = "You must accept the terms.";
          break;
        default:
          break;
      }
      if (error) newErrors[field] = error;
    });

  setErrors(newErrors);
  if (Object.keys(newErrors).length > 0) return;

  // Build full address
  const selectedCityObj = cities.find(city => city.code === selectedCity);
  const selectedBrgyObj = barangays.find(brgy => brgy.name === form.barangay);
  const selectedRegionObj = regions.find(region => region.code === selectedRegion);

  const composedAddress = [
    form.street,
    selectedBrgyObj?.name,
    selectedCityObj?.name,
    selectedRegionObj?.name
  ].filter(Boolean).join(", ");

  // Add full address to form
  const dataToSend = {
    ...form,
    address: composedAddress
  };

  try {
    const { confirmPassword, termsAccepted, ...finalData } = dataToSend;
    const res = await axios.post("https://paranaque-web-system.onrender.com/api/auth/register", finalData);
    await Swal.fire({
      title: "Parañaledge",
      text: res.data.message,
      icon: "success",
      confirmButtonText: "OK"
    });
    navigate("/verify-notice");
  } catch (err) {
    await Swal.fire({
      title: "Parañaledge",
      text: err.response?.data?.message || "Registration failed.",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
};


  useEffect(() => {
  axios.get("https://psgc.gitlab.io/api/regions.json")
    .then(res => setRegions(res.data))
    .catch(err => console.error("Failed to load regions", err));
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      axios.get(`https://psgc.gitlab.io/api/regions/${selectedRegion}/cities.json`)
        .then(res => setCities(res.data))
        .catch(err => console.error("Failed to load cities", err));
    } else {
      setCities([]);
    }
    setSelectedCity("");
    setBarangays([]);
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedCity) {
      axios.get(`https://psgc.gitlab.io/api/cities/${selectedCity}/barangays.json`)
        .then(res => setBarangays(res.data))
        .catch(err => console.error("Failed to load barangays", err));
    } else {
      setBarangays([]);
    }
  }, [selectedCity]);

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-image">
          <img src={schoolImage} alt="School" />
        </div>
        <div className="auth-card">
          <img className="logo" src={logo} alt="logo" />
          <h2>Sign up to Parañaledge</h2>
          <form className="auth-form" onSubmit={handleRegister}>
            <input type="text" name="firstName" placeholder="First Name" value={form.firstName} onChange={handleChange} />
            {errors.firstName && <p style={{ color: "red", fontSize: "0.8rem"}}>{errors.firstName}</p>}
            
            <div className="d-flex gap-3">
              <input type="text" name="lastName" placeholder="Last Name" value={form.lastName} onChange={handleChange} />
              <select
                name="suffix"
                value={form.suffix}
                onChange={handleChange}
                className="form-control input-field"
                style={{ width: "50%"}}
              >
                <option value="">Suffix</option>
                <option value="Sr.">Sr.</option>
                <option value="Jr.">Jr.</option>
                <option value="II">II</option>
                <option value="III">III</option>
                <option value="IV">IV</option>
                <option value="V">V</option>
              </select>
            </div>
            {errors.lastName && <p style={{ color: "red", fontSize: "0.8rem"}}>{errors.lastName}</p>}
           

            <input
              type="text"
              name="street"
              placeholder="House No., Street, Subdivision"
              value={form.street}
              onChange={handleChange}
            />
            {errors.street && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.street}</p>}
            
            <div className="d-flex gap-3">
              <select
                name="region"
                value={selectedRegion}
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  handleChange(e);
                }}
                className="form-control"
              >
                <option value="">Select Region</option>
                {regions.map(region => (
                  <option key={region.code} value={region.code}>
                    {region.name}
                  </option>
                ))}
              </select>

              <select
                name="city"
                value={selectedCity}
                onChange={(e) => {
                  setSelectedCity(e.target.value);
                  handleChange(e);
                }}
                className="form-control"
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.code} value={city.code}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="d-flex gap-3">
              <select
                name="barangay"
                value={form.barangay}
                onChange={handleChange}
                className="form-control"
              >
                <option value="">Select Barangay</option>
                {barangays.map(brgy => (
                  <option key={brgy.code} value={brgy.name}>
                    {brgy.name}
                  </option>
                ))}
              </select>
            </div>


            <input type="tel" name="contactNumber" placeholder="Contact Number" value={form.contactNumber} onChange={handleChange} />
            {errors.contactNumber && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.contactNumber}</p>}

            <input type="email" name="email" placeholder="Email (Gmail only)" value={form.email} onChange={handleChange} style={getEmailInputStyle()} />
            {getEmailFeedback()}
            {errors.email && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.email}</p>}

            <PasswordInput type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} />
            {errors.password && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.password}</p>}

            <PasswordInput type="password" name="confirmPassword" placeholder="Confirm Password" value={form.confirmPassword} onChange={handleChange} />
            {errors.confirmPassword && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.confirmPassword}</p>}

            <label className="terms-text d-flex justify-content-center align-items-center">
              <input type="checkbox" className="form-control flex-0" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange} />
              <a onClick={() => setShowTermsModal(true)} className="terms-link">I agree to the Terms of Service and Privacy Policy.</a>
            </label>
            {errors.termsAccepted && <p style={{ color: "red", fontSize: "0.8rem" }}>{errors.termsAccepted}</p>}

            <button type="submit">SIGN UP</button>
          </form>
          <div style={{ textAlign: "center", marginTop: "15px" }}>
            Already have an account?{" "}
            <Link to="/" style={{ color: "#2e7d32", fontWeight: "bold" }}>
              Login
            </Link>
          </div>
        </div>
      </div>
      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: 600,
              width: "95%",
              height: "auto",
              maxHeight: "90%",
              padding: "50px 40px",
              background: "#fff",
              borderRadius: "10px",
              position: "relative",
              overflowY: "auto",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          >
            <button
              onClick={() => setShowTermsModal(false)}
              style={{
                position: "absolute",
                top: 10,
                right: 16,
                background: "transparent",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "#555",
              }}
              aria-label="Close"
              title="Close"
            >
              &times;
            </button>

            <h3 style={{ textAlign: "center", fontWeight: "600", marginBottom: "1rem", paddingBottom: "40px" }}>
              Terms & Agreements
            </h3>

            <ul style={{ fontSize: "0.9rem", lineHeight: "2.5", paddingLeft: "20px" }}>
              <li>I will take care of any book I borrow and return it on time.</li>
              <li>Borrowed books must be returned within the allowed lending period.</li>
              <li>I will not write on, damage, or lose any book I borrow.</li>
              <li>
                If I damage or lose a book, I will be responsible for replacing it or
                paying the necessary fees.
              </li>
              <li>I will not lend the borrowed book to other students.</li>
              <li>Overdue books may result in borrowing restrictions.</li>
              <li>I agree to follow all school library rules and staff instructions.</li>
              <li>All information I provide is true and correct.</li>
            </ul>

            <p style={{ fontSize: "1rem", textAlign: "center", marginTop: "1rem", fontWeight: "600" }}>
              By registering, I confirm that I understand and agree to these terms.
            </p>
          </div>

        </div>
      )}
    </div>
  );
}

export default Register;
