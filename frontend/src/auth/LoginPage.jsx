import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import GoogleOAuthButton from "./GoogleOAuthButton";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState("");

  const { isLoading, error, checkAuth } = useAuthStore();

  // Handle OAuth callback
  useEffect(() => {
    const authStatus = searchParams.get("auth");
    const errorParam = searchParams.get("error");
    const token = searchParams.get("token");
    const role = searchParams.get("role");

    if (authStatus === "success" && token) {
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      toast.success("Successfully logged in with Google!");
      
      // Navigate to role-based route
      setTimeout(() => {
        if (role === 'student') {
          navigate('/student', { replace: true });
        } else if (role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (role === 'security') {
          navigate('/security', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 500);
    } else if (errorParam) {
      toast.error("Authentication failed. Please try again.");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 bg-gradient-to-br from-blue-950 via-slate-900 to-black">
      
      {/* 🔵 Animated glowing background blobs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute w-[700px] h-[700px] bg-blue-500/10 rounded-full blur-3xl"
          animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
          style={{ top: "-200px", left: "-150px" }}
        />
        <motion.div
          className="absolute w-[500px] h-[500px] bg-cyan-400/10 rounded-full blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 18, ease: "easeInOut" }}
          style={{ bottom: "-150px", right: "-150px" }}
        />
      </div>

      {/* 🔐 Keycard-styled login card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-slate-900/70 backdrop-blur-xl rounded-2xl 
          border border-blue-500/30 p-6
          transition-all duration-500 
          hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] hover:border-blue-400"
      >
        {/* Title */}
        <h2 className="text-2xl font-bold mb-4 text-center bg-gradient-to-r from-blue-400 to-cyan-500 text-transparent bg-clip-text">
          Welcome to VNR Hostels
        </h2>

        <p className="text-gray-300 text-center mb-5">
          Select your role and sign in with your Google account
        </p>

        {error && (
          <p className="text-red-500 font-semibold mb-3 text-center">{error}</p>
        )}

        {/* Role Selection */}
        <div className="mb-6">
          <label className="block text-gray-300 text-sm font-medium mb-3">
            Select Your Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'student', label: 'Student', icon: '🎓' },
              { id: 'admin', label: 'Admin', icon: '👨‍💼' },
              { id: 'security', label: 'Security', icon: '🛡️' }
            ].map((role) => (
              <motion.button
                key={role.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  p-3 rounded-lg border transition-all duration-200 text-center
                  ${selectedRole === role.id
                    ? 'border-blue-400 bg-blue-500/20 text-blue-300'
                    : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                  }
                `}
              >
                <div className="text-lg mb-1">{role.icon}</div>
                <div className="text-sm font-medium">{role.label}</div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Google OAuth Button */}
        <GoogleOAuthButton 
          isLoading={isLoading} 
          disabled={!selectedRole}
          selectedRole={selectedRole}
        />

        {/* Inline footer (no box) */}
        <p className="text-sm text-gray-400 text-center mt-4">
          Secure access with Google authentication
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
