import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useAdmin } from "../context/AdminContext";
import backgroundImage from "../assets/1.jpg";
import logo from "../assets/vnrvjiet-logo.png"; // cropped logo
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdmin();

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/admin-api/login`,
        data
      );
      login(response.data.admin, response.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google/admin`;
  };

  return (
    <div
      className="container-fluid text-light min-vh-100 d-flex align-items-center justify-content-center"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        position: "relative",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1,
        }}
      ></div>

      {/* Floating Login Form */}
      <div
        style={{
          zIndex: 2,
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          color: "#fff",
          textShadow: "0px 1px 3px rgba(0,0,0,0.8)",
        }}
      >
        {/* Logo + Text side by side */}
        <div
          className="d-flex align-items-center justify-content-center mb-4"
          style={{ gap: "15px" }}
        >
          <img
            src={logo}
            alt="VNR VJIET Logo"
            style={{ width: "80px", height: "80px" }}
          />
          <div style={{ textAlign: "left" }}>
            <h2 style={{ margin: 0, fontWeight: "bold", color: "#fff" }}>
              VNR VJIET
            </h2>
            <h5 style={{ margin: 0, color: "#ddd" }}>Hostel Admin Portal</h5>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3 text-start">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              className={`form-control ${errors.username ? "is-invalid" : ""}`}
              id="username"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.4)",
                backdropFilter: "blur(12px)",
                caretColor: "#fff", // White cursor
              }}
              {...register("username", { required: "Username is required" })}
            />
            {errors.username && (
              <div className="invalid-feedback">
                {errors.username.message}
              </div>
            )}
          </div>

          <div className="mb-4 text-start">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="input-group">
              <input
                type={passwordVisible ? "text" : "password"}
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                id="password"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)",
                  backdropFilter: "blur(12px)",
                  caretColor: "#fff", // White cursor
                }}
                {...register("password", {
                  required: "Password is required",
                })}
              />
              <button
                className="btn shadow-none"
                type="button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                style={{
                  border: "1px solid rgba(255,255,255,0.4)",
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  backdropFilter: "blur(12px)",
                }}
              >
                {passwordVisible ? <BsEyeSlashFill /> : <BsEyeFill />}
              </button>
              {errors.password && (
                <div className="invalid-feedback">
                  {errors.password.message}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 mb-3"
            style={{
              background: "linear-gradient(to right, #4e54c8, #8f94fb)",
              border: "none",
              padding: "12px",
              fontWeight: "bold",
              borderRadius: "10px",
              color: "#fff",
              boxShadow:
                "0 4px 15px rgba(50, 50, 93, 0.4), 0 2px 5px rgba(0, 0, 0, 0.3)",
              transition: "all 0.3s ease",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </button>
        </form>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="btn w-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "#fff",
            color: "#000",
            fontWeight: "bold",
            padding: "12px",
            borderRadius: "10px",
            boxShadow:
              "0 4px 15px rgba(50, 50, 93, 0.4), 0 2px 5px rgba(0, 0, 0, 0.3)",
          }}
        >
          <FcGoogle size={22} className="me-2" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
