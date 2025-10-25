import React from "react";
import img1 from "../../assets/1.jpg";
import img2 from "../../assets/2.jpg";
import img3 from "../../assets/3.jpg";
import img4 from "../../assets/4.png";
import logo from "../../assets/vnrvjiet-logo.png";
import '../../styles/homepage.css';

const HomePage = () => {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section
        className="hero-section"
        style={{
          backgroundImage: `url(${img1})`, // ✅ Only image, no dark overlay
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          minHeight: "100vh",
        }}
      >
        {/* Foreground content */}
        <div
          className="hero-overlay d-flex align-items-center justify-content-center flex-column"
          style={{
            position: "relative",
            textAlign: "center",
            color: "white",
            padding: "60px 20px",
          }}
        >
          {/* Logo + Text */}
          <div
            className="d-flex align-items-center justify-content-center mb-4"
            style={{ gap: "15px" }}
          >
            <img
              src={logo}
              alt="VNR VJIET Logo"
              style={{
                width: "90px",
                height: "90px",
              }}
            />
            <div style={{ textAlign: "left" }}>
              <h1
                style={{
                  margin: 0,
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                VNR VJIET
              </h1>
              <h4
                style={{
                  margin: 0,
                  color: "#fff",
                }}
              >
                Hostel
              </h4>
            </div>
          </div>

          {/* Subtitle */}
          <p
            style={{
              fontSize: "18px",
              maxWidth: "700px",
              margin: "0 auto",
              color: "#fff",
            }}
          >
            Your home away from home – Safe, Comfortable, and Supportive.
          </p>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="gallery-section">
        <div className="responsive-container">
          <h2
            className="section-title"
            style={{
              textAlign: "center",
            }}
          >
            Explore Our Hostel
          </h2>
          <div className="gallery-grid">
            <div className="gallery-item">
              <img src={img2} alt="Hostel Room" className="gallery-image" />
              <div className="gallery-caption">
                Comfortable Rooms
              </div>
            </div>
            <div className="gallery-item">
              <img src={img3} alt="Common Area" className="gallery-image" />
                <div className="gallery-caption">Common Areas</div>
            </div>
            <div className="gallery-item">
              <img src={img4} alt="Facilities" className="gallery-image" />
              <div className="gallery-caption">Modern Facilities</div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="responsive-container">
          <h2
            className="section-title"
            style={{
              textAlign: "center",
            }}
          >
            Emergency Contacts
          </h2>
          <div className="contact-grid">
            <div className="contact-card">
              <h4>Hostel Warden</h4>
              <p>+91-98765-43210</p>
            </div>
            <div className="contact-card">
              <h4>Security Office</h4>
              <p>+91-87654-32109</p>
            </div>
            <div className="contact-card">
              <h4>Medical Assistance</h4>
              <p>+91-76543-21098</p>
            </div>
            <div className="contact-card">
              <h4>Admin Office</h4>
              <p>+91-65432-10987</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="home-footer"
        style={{
          color: "#fff",
          backgroundColor: "rgba(0,0,0,0.8)",
          textAlign: "center",
          padding: "20px 0",
        }}
      >
        <div className="responsive-container">
          &copy; 2025 VNR VJIET Hostel | All Rights Reserved
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
