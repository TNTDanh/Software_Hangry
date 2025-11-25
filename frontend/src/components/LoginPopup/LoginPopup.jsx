import React, { useContext, useState } from "react";
import "./LoginPopup.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";

const LoginPopup = ({ setShowLogin }) => {
  const { url, setToken, lang, setUserName } = useContext(StoreContext);
  const t = (vi, en) => (lang === "vi" ? vi : en);

  const [currState, setCurrState] = useState("Login");
  const [data, setData] = useState({
    name: "",
    email: "test@gmail.com",
    password: "123456789",
  });

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login";
    } else {
      newUrl += "/api/user/register";
    }

    const response = await axios.post(newUrl, data);

    if (response.data.success) {
      const name = response.data.name || data.name || "";
      setToken(response.data.token);
      setUserName?.(name);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("userName", name);
      setShowLogin(false);
    } else {
      alert(response.data.message);
    }
  };

  return (
    <div className="login-popup">
      <form onSubmit={onLogin} className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState === "Login" ? t("Đăng nhập", "Login") : t("Đăng ký", "Sign Up")}</h2>
          <img
            onClick={() => setShowLogin(false)}
            src={assets.cross_icon}
            alt="close"
          />
        </div>
        <div className="login-popup-inputs">
          {currState === "Login" ? null : (
            <input
              name="name"
              onChange={onChangeHandler}
              value={data.name}
              type="text"
              placeholder={t("Tên của bạn", "Your name")}
              required
            />
          )}
          <input
            name="email"
            onChange={onChangeHandler}
            value={data.email}
            type="email"
            placeholder="you@example.com"
            required
          />
          <input
            name="password"
            onChange={onChangeHandler}
            value={data.password}
            type="password"
            placeholder={t("Mật khẩu", "Password")}
            required
          />
        </div>
        <button type="submit">
          {currState === "Sign Up" ? t("Tạo tài khoản", "Create account") : t("Đăng nhập", "Login")}
        </button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p className="continuee">
            {t(
              "Tiếp tục đồng nghĩa với việc bạn đồng ý điều khoản và chính sách.",
              "By continuing, you agree to the terms of use & privacy policy."
            )}
          </p>
        </div>
        <div className="login-switch">
          {currState === "Login" ? (
            <p>
              {t("Chưa có tài khoản?", "You do not have an account?")}{" "}
              <span onClick={() => setCurrState("Sign Up")}>{t("ĐĂNG KÝ", "SIGN UP")}</span>
            </p>
          ) : (
            <p>
              {t("Đã có tài khoản?", "Already have an account?")}{" "}
              <span onClick={() => setCurrState("Login")}>{t("ĐĂNG NHẬP", "LOGIN HERE")}</span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPopup;
