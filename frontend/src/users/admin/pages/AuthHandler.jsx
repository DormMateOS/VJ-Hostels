import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdmin } from "../context/AdminContext";

const AuthHandler = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const adminEmail = params.get("admin");

    if (token) {
      login({ email: adminEmail }, token); // save to context + localStorage
      navigate("/dashboard", { replace: true });
    } else {
      navigate("/login", { replace: true });
    }
  }, [location, login, navigate]);

  return <p>Logging you in...</p>;
};

export default AuthHandler;
