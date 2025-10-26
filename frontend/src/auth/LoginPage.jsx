import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Sun, Moon } from "lucide-react";
import backgroundImage from "../assets/1.jpg";
import logoDark from "../assets/vnrvjiet-logo.png";
import logoLight from "../assets/vnrvjiet-logo.png";
import { useAuthStore } from "../store/authStore";
import GoogleOAuthButton from "./GoogleOAuthButton";
import { useAdmin } from "../context/AdminContext";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading, error, checkAuth, forceResetAuthState } = useAuthStore();
  const { login: adminLogin } = useAdmin();

  const [theme, setTheme] = useState("dark");
  const [selectedRole, setSelectedRole] = useState("");

  const isDark = theme === "dark";

  const themeStyles = {
    cardBg: isDark ? "rgba(15, 20, 35, 0.75)" : "rgba(220, 230, 250, 0.85)",
    cardBorder: isDark
      ? "1px solid rgba(255,255,255,0.15)"
      : "1px solid rgba(0,0,0,0.1)",
    textColor: isDark ? "#fff" : "#111",
    subText: isDark ? "#ccc" : "#555",
    btnBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    btnBorder: isDark
      ? "1px solid rgba(255,255,255,0.25)"
      : "1px solid rgba(0,0,0,0.2)",
    overlay: isDark ? "rgba(0,0,0,0.65)" : "rgba(255,255,255,0.35)",
  };

  // OAuth callback handling and navigation
  useEffect(() => {
    const authStatus = searchParams.get("auth");
    const token = searchParams.get("token");
    const role = searchParams.get("role");
if (authStatus === "success" && token && role) {
  // Store tokens FIRST
  localStorage.setItem("token", token);
  localStorage.setItem("auth-token", token);
  
  if (role === "security") {
    localStorage.setItem("guard_token", token);
  }
  
  // For admin role, also call AdminContext login to store token under 'adminToken' key
  if (role === "admin") {
    adminLogin({ role: "admin" }, token);
  }
  
  forceResetAuthState();
  toast.success("Successfully logged in with Google!");
  
  // Force a reload after navigation
  setTimeout(() => {
    const path = role === "security" ? "/security" : 
                 role === "student" ? "/student" : "/admin";
    navigate(path, { replace: true });
    window.location.reload();
  }, 100);
}else if (searchParams.get("error")) {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams, navigate, forceResetAuthState, adminLogin]);

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        color: themeStyles.textColor,
        transition: "all 0.3s ease",
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: themeStyles.overlay,
          zIndex: 1,
          transition: "all 0.3s ease",
        }}
      ></div>

      {/* Theme Toggle */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        style={{
          position: "absolute",
          top: "25px",
          right: "25px",
          zIndex: 3,
          background: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          border: "none",
          borderRadius: "50%",
          padding: "8px",
          cursor: "pointer",
          color: isDark ? "#fff" : "#000",
          transition: "all 0.3s ease",
        }}
      >
        {isDark ? <Sun size={20} /> : <Moon size={20} />}
      </button>

      {/* Frosted Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          zIndex: 2,
          width: "100%",
          maxWidth: "420px",
          padding: "2.2rem",
          borderRadius: "16px",
          background: themeStyles.cardBg,
          backdropFilter: "blur(14px)",
          border: themeStyles.cardBorder,
          boxShadow: isDark
            ? "0 8px 25px rgba(0,0,0,0.5)"
            : "0 8px 25px rgba(0,0,0,0.15)",
          textAlign: "center",
          transition: "all 0.3s ease",
        }}
      >
        {/* Logo */}
        <div
          className="d-flex align-items-center justify-content-center mb-4"
          style={{ gap: "15px" }}
        >
          <img
            src={isDark ? logoDark : logoLight}
            alt="VNR Logo"
            style={{
              width: "75px",
              height: "75px",
              filter: isDark
                ? "drop-shadow(0px 0px 6px rgba(255,255,255,0.2))"
                : "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))",
              transition: "all 0.3s ease",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <h2
              style={{
                margin: 0,
                fontWeight: "bold",
                color: themeStyles.textColor,
              }}
            >
              VNR VJIET
            </h2>
            <h5 style={{ margin: 0, color: themeStyles.subText }}>
              Hostel Login Portal
            </h5>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger py-2" role="alert">
            {error}
          </div>
        )}

        <p
          className="mb-4"
          style={{ fontSize: "0.95rem", color: themeStyles.subText }}
        >
          Select your role and sign in with Google
        </p>

        {/* Role Buttons */}
        <div className="mb-4 d-flex justify-content-between" style={{ gap: "12px" }}>
          {[
            { id: "student", label: "Student", icon: "🎓" },
            { id: "admin", label: "Admin", icon: "👨‍💼" },
            { id: "security", label: "Security", icon: "🛡️" },
          ].map((role) => (
            <button
              key={role.id}
              className="btn flex-grow-1"
              style={{
                backgroundColor: themeStyles.btnBg,
                border: selectedRole === role.id
                  ? "2px solid rgba(59,130,246,0.9)"
                  : "2px solid transparent",
                borderRadius: "12px",
                color: themeStyles.textColor,
                transition: "box-shadow 0.3s ease, border 0.3s ease",
                minWidth: "100px",
              }}
              onClick={() => setSelectedRole(role.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow =
                  "0 0 12px rgba(59,130,246,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = selectedRole === role.id
                  ? "0 0 18px rgba(59,130,246,0.7)"
                  : "none";
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{role.icon}</span>
              <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>
                {role.label}
              </div>
            </button>
          ))}
        </div>

        {/* ORIGINAL Google OAuth Button */}
        <div className="d-grid">
          <GoogleOAuthButton className="w-10"
            isLoading={isLoading}
            disabled={!selectedRole}
            selectedRole={selectedRole}
          />
        </div>

        {/* <p
          className="mt-3"
          style={{ fontSize: "0.85rem", color: themeStyles.subText }}
        >
          Secure Google Authentication
        </p> */}
      </motion.div>
    </div>
  );
};

export default LoginPage;
``
