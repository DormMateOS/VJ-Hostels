import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Sun, Moon } from "lucide-react";
import backgroundImage from "../assets/1.jpg";
import logo from "../assets/vnrvjiet-logo.png";
import { useAuthStore } from "../store/authStore";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isLoading, error } = useAuthStore();
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const authStatus = searchParams.get("auth");
    const errorParam = searchParams.get("error");
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (authStatus === "success" && token) {
      if (role === "security") {
        localStorage.setItem("guard_token", token);
        navigate("/security", { replace: true });
      } else if (role === "student") {
        localStorage.setItem("token", token);
        navigate("/student", { replace: true });
      } else if (role === "admin") {
        localStorage.setItem("token", token);
        navigate("/admin", { replace: true });
      }
      toast.success("Successfully logged in with Google!");
    } else if (errorParam) {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams, navigate]);

  const isDark = theme === "dark";

  const themeStyles = {
    cardBg: isDark ? "rgba(15, 20, 35, 0.75)" : "rgba(255, 255, 255, 0.7)",
    cardBorder: isDark
      ? "1px solid rgba(255,255,255,0.15)"
      : "1px solid rgba(0,0,0,0.1)",
    textColor: isDark ? "#fff" : "#222",
    subText: isDark ? "#ccc" : "#555",
    btnBg: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
    btnBorder: isDark
      ? "1px solid rgba(255,255,255,0.25)"
      : "1px solid rgba(0,0,0,0.2)",
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        position: "relative",
        transition: "all 0.3s ease",
        color: themeStyles.textColor,
      }}
    >
      {/* Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: isDark
            ? "rgba(0,0,0,0.65)"
            : "rgba(255,255,255,0.45)",
          zIndex: 1,
          transition: "all 0.4s ease",
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
          background: isDark
            ? "rgba(255,255,255,0.1)"
            : "rgba(0,0,0,0.1)",
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
            src={logo}
            alt="VNR Logo"
            style={{
              width: "75px",
              height: "75px",
              filter: isDark
                ? "drop-shadow(0px 0px 6px rgba(255,255,255,0.2))"
                : "drop-shadow(0px 0px 6px rgba(0,0,0,0.3))",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <h2 style={{ margin: 0, fontWeight: "bold", color: themeStyles.textColor }}>
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
        <div className="mb-4 d-flex justify-content-between">
          {[
            { id: "student", label: "Student", icon: "🎓" },
            { id: "admin", label: "Admin", icon: "👨‍💼" },
            { id: "security", label: "Security", icon: "🛡️" },
          ].map((role) => (
            <button
              key={role.id}
              className="btn w-100 mx-1"
              style={{
                backgroundColor: themeStyles.btnBg,
                border: themeStyles.btnBorder,
                borderRadius: "12px",
                color: themeStyles.textColor,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = "1px solid rgba(59,130,246,0.8)";
                e.currentTarget.style.boxShadow =
                  "0 0 12px rgba(59,130,246,0.6)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = themeStyles.btnBorder;
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <span style={{ fontSize: "1.2rem" }}>{role.icon}</span>
              <div style={{ fontSize: "0.9rem", marginTop: "4px" }}>
                {role.label}
              </div>
            </button>
          ))}
        </div>

        {/* Mild Google Button with soft hover */}
        <div className="d-grid">
          <button
            disabled={isLoading}
            style={{
              background: isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
              color: themeStyles.textColor,
              width: "100%",
              border: themeStyles.btnBorder,
              borderRadius: "8px",
              padding: "10px 0",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.3s ease",
              boxShadow: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = isDark
                ? "0 0 10px rgba(255,255,255,0.2)"
                : "0 0 10px rgba(0,0,0,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <img
              src="https://www.svgrepo.com/show/355037/google.svg"
              alt="Google"
              style={{
                width: "18px",
                height: "18px",
                opacity: 0.9,
              }}
            />
            {isLoading ? "Signing in..." : "Sign in with Google"}
          </button>
        </div>

        <p
          className="mt-3"
          style={{ fontSize: "0.85rem", color: themeStyles.subText }}
        >
          Secure Google Authentication
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
