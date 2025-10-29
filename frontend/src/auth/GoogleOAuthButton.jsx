import { useState } from "react";
import { motion } from "framer-motion";
import { config } from "../utils/config.js";
import googleLogo from "../assets/google-logo.png";

const GoogleOAuthButton = ({
  isLoading = false,
  disabled = false,
  theme = "dark",
}) => {
  const [isClicked, setIsClicked] = useState(false);
  const isDark = theme === "dark";

  const handleGoogleLogin = () => {
    setIsClicked(true);
    const API_URL = config.api.baseUrl;
    window.location.href = `${API_URL}/auth/google`;
  };

  const isDisabled = disabled || isLoading || isClicked;

  return (
    <motion.button
      whileHover={{ scale: isDisabled ? 1 : 1.03 }}
      whileTap={{ scale: isDisabled ? 1 : 0.97 }}
      onClick={handleGoogleLogin}
      disabled={isDisabled}
  className={`w-full flex items-center justify-center gap-4 px-6 py-3 font-semibold transition-all duration-200 ${
        isDisabled
          ? "cursor-not-allowed opacity-60"
          : isDark
          ? "bg-white text-gray-900 hover:shadow-lg"
          : "bg-[#4285F4] text-white hover:shadow-lg"
      }`}
      style={{
        border: "none",
        borderRadius: "12px", // ✅ soft rounded corners (not fully circular)
        outline: "none",
        boxShadow: isDisabled
          ? "none"
          : isDark
          ? "0 4px 12px rgba(255,255,255,0.25)"
          : "0 4px 12px rgba(66,133,244,0.4)",
        transition: "all 0.25s ease",
      }}
    >
      {isClicked || isLoading ? (
        <>
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{
              borderColor: isDark ? "#111" : "#fff",
              borderTopColor: "transparent",
            }}
          ></div>
          <span className="text-sm font-medium">Redirecting...</span>
        </>
      ) : (
        <>
          <img
            src={googleLogo}
            alt="Google"
            className="object-contain"
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "6px", // ✅ subtle rounding on logo too
              filter: isDark
                ? "none"
                : "drop-shadow(0 1px 2px rgba(0,0,0,0.2))",
              marginRight: "12px",
              display: "inline-block",
              verticalAlign: "middle",
            }}
          />
          <span
            className="text-sm font-medium tracking-wide"
            style={{ display: "inline-block", verticalAlign: "middle", lineHeight: "20px" }}
          >
            Continue with Google
          </span>
        </>
      )}
    </motion.button>
  );
};

export default GoogleOAuthButton;
