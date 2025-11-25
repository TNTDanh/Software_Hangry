import React, { useState } from "react";
import "./Login.css";
import axios from "axios";
import { toast } from "react-toastify";
import { assets } from "../../assets/assets";
import useAuth from "../../auth/useAuth.jsx";
import useUI from "../../ui/useUI.jsx";

const Login = ({ url }) => {
  const { login } = useAuth();
  const { t } = useUI();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${url}/api/user/login`, {
        email,
        password,
      });
      if (res.data?.success && res.data?.token) {
        const role = res.data.role || "user";
        const allowed = ["admin", "restaurantOwner"];
        if (!allowed.includes(role)) {
          toast.error(t("noPermission"));
        } else {
          login({
            token: res.data.token,
            role,
            restaurantIds: res.data.restaurantIds || [],
          });
          toast.success(res.data?.message || t("loginSuccess") || "Login success");
        }
      } else {
        toast.error(res.data?.message || t("loginFailed"));
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || t("loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <img src={assets.logo} alt="logo" className="login-logo" />
        <h2>Admin / Owner Login</h2>
        <form onSubmit={onSubmit} className="login-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
