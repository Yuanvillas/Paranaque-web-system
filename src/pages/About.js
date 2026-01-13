import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMapMarkerAlt, faPhone, faEnvelope, faClock } from "@fortawesome/free-solid-svg-icons";
import "../styles/about.css";

const About = () => {
  return (
    <div className="about-container">
      {/* Header Section */}
      <div className="about-header">
        <h1>About Us</h1>
        <p>Learn more about Parañaque City Public Library</p>
      </div>

      {/* Main Content */}
      <div className="about-content">
        {/* Description Section */}
        <section className="about-section description-section">
          <h2>Our Library</h2>
          <p>
            The Parañaque City Public Library is a local government institution 
            that enriches the life in the community by providing books and reading 
            materials for education, technology, and cultural knowledge, as well as 
            promoting lifelong learning.
          </p>
          <p>
            We are committed to providing accessible, high-quality library services 
            to all residents of Parañaque City. Our collection continues to grow with 
            diverse titles covering various genres and subjects to cater to the needs 
            of our patrons.
          </p>
        </section>

        {/* Contact Information Section */}
        <section className="about-section contact-section">
          <h2>Get In Touch</h2>
          <div className="contact-grid">
            {/* Address */}
            <div className="contact-item">
              <div className="contact-icon">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
              </div>
              <div className="contact-info">
                <h3>Address</h3>
                <p>Ground Floor Barangay Daniel Fajardo Hall,<br />
                   Padule Open Circle,<br />
                   Polytechnic University of the Philippines - Parañaque<br />
                   Parañaque, Philippines, 1740</p>
              </div>
            </div>

            {/* Phone */}
            <div className="contact-item">
              <div className="contact-icon">
                <FontAwesomeIcon icon={faPhone} />
              </div>
              <div className="contact-info">
                <h3>Phone</h3>
                <p><a href="tel:+63288251262">(02) 8825 1262</a></p>
              </div>
            </div>

            {/* Email */}
            <div className="contact-item">
              <div className="contact-icon">
                <FontAwesomeIcon icon={faEnvelope} />
              </div>
              <div className="contact-info">
                <h3>Email</h3>
                <p><a href="mailto:paranaquecitypubliclibrary.pcpl@gmail.com">paranaquecitypubliclibrary.pcpl@gmail.com</a></p>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="contact-item">
              <div className="contact-icon">
                <FontAwesomeIcon icon={faClock} />
              </div>
              <div className="contact-info">
                <h3>Opening Hours</h3>
                <p>Monday - Friday: 8:00 AM - 5:00 PM<br />
                   Saturday & Sunday: Closed</p>
              </div>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="about-section map-section">
          <h2>Find Us On The Map</h2>
          <div className="map-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3861.502662066156!2d121.00312!3d14.364722!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397ca8d5c5c5c5d%3A0x5c5c5c5d5c5c5c5d!2sParañaque%20City%20Public%20Library%2C%20Ground%20Floor%20Barangay%20Daniel%20Fajardo%20Hall%2C%20Padule%20Open%20Circle%2C%20Polytechnic%20University%20of%20the%20Philippines%20-%20Paran%CC%83aque%2C%201740!5e0!3m2!1sen!2sph!4v1701781200000"
              width="100%"
              height="500"
              style={{ border: 0, borderRadius: "12px" }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Parañaque City Public Library Location"
            ></iframe>
          </div>
          <div className="map-note">
            <p>📍 Library location marked on map. Click to get directions via Google Maps</p>
            <a 
              href="https://www.google.com/maps/search/Parañaque+City+Public+Library,+Ground+Floor+Barangay+Daniel+Fajardo+Hall,+Padule+Open+Circle,+Polytechnic+University+of+the+Philippines+-+Parañaque,+1740/@14.364722,121.00312,16z" 
              target="_blank" 
              rel="noopener noreferrer"
              className="directions-button"
            >
              📍 Get Directions
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
