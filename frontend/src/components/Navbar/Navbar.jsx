import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { assets } from "../../assets/assets";
import { StoreContext } from "../../context/StoreContext";

const Navbar = ({ setShowLogin }) => {
  const {
    getTotalCartAmount,
    token,
    setToken,
    cartItems,
    lang,
    setLang,
    userName,
    setUserName,
  } = useContext(StoreContext);
  const [mode, setMode] = useState("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [elevated, setElevated] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const t = (vi, en) => (lang === "vi" ? vi : en);

  const hasItems = useMemo(() => {
    const qty = cartItems
      ? Object.values(cartItems).reduce(
          (acc, v) => acc + (Number(v) > 0 ? Number(v) : 0),
          0
        )
      : 0;
    const hasAmount = Number(getTotalCartAmount?.()) > 0;
    return qty > 0 || hasAmount;
  }, [cartItems, getTotalCartAmount]);

  useEffect(() => {
    const stored = localStorage.getItem("mode");
    const next = stored === "light" ? "light" : "dark";
    setMode(next);
    if (next === "light") document.body.classList.add("lightcolors");
    else document.body.classList.remove("lightcolors");
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || window.pageYOffset;
      setElevated(y > 8);
      setShowScrollTop(y > 300);
    };
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMode = () => {
    const next = mode === "light" ? "dark" : "light";
    setMode(next);
    localStorage.setItem("mode", next);
    if (next === "light") document.body.classList.add("lightcolors");
    else document.body.classList.remove("lightcolors");
  };

  const logout = () => {
    if (!window.confirm(t("Bạn chắc chắn muốn đăng xuất?", "Log out?"))) return;
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken("");
    setUserName?.("");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path;
  const closeMobile = () => setMobileOpen(false);

  const handleOrdersClick = (e) => {
    if (!token) {
      e.preventDefault();
      setShowLogin?.(true);
    }
  };

  const scrollToTop = () =>
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

  return (
    <>
      <header className={`site-navbar ${elevated ? "elevated" : "at-top"}`}>
        <div className="nav-inner">
          <div className="nav-left">
            <Link to="/" className="brand" onClick={closeMobile}>
              <img src={assets.logo} alt="Hangry" className="brand-logo" />
            </Link>
          </div>

          <nav
            className={`nav-center ${mobileOpen ? "open" : ""}`}
            aria-label="Primary"
          >
            <Link
              to="/"
              className={`nav-link ${isActive("/") ? "active" : ""}`}
              onClick={closeMobile}
            >
              {t("Trang chủ", "Home")}
            </Link>
            <Link to="/#explore-menu" className="nav-link" onClick={closeMobile}>
              {t("Menu", "Menu")}
            </Link>
            <Link to="/#app-download" className="nav-link" onClick={closeMobile}>
              {t("Ứng dụng", "Mobile - App")}
            </Link>
            <Link
              to="/#footer"
              className="nav-link"
              onClick={(e) => {
                closeMobile();
                if (
                  location.pathname === "/myorders" ||
                  location.pathname === "/cart"
                ) {
                  e.preventDefault();
                  window.scrollTo({
                    top: document.documentElement.scrollHeight,
                    behavior: "smooth",
                  });
                }
              }}
            >
              {t("Liên hệ", "Contact")}
            </Link>
            <Link
              to="/myorders"
              className="nav-link"
              onClick={(e) => {
                handleOrdersClick(e);
                closeMobile();
              }}
              title={
                token
                  ? t("Đơn hàng của tôi", "My Orders")
                  : t("Đăng nhập để xem đơn hàng", "Login to view orders")
              }
            >
              {t("Đơn hàng", "My Orders")}
            </Link>
          </nav>

          <div className="nav-right">
            <Link
              to="/cart"
              className="cart-link"
              aria-label="Cart"
              onClick={() => setMobileOpen(false)}
            >
              <img className="basketlogo" src={assets.basket_icon} alt="" />
              <div className={hasItems ? "dot" : "dot hide"} />
            </Link>

            <button
              className="mode-btn"
              onClick={toggleMode}
              title={
                mode === "light"
                  ? t("Chuyển sang Dark mode", "Switch to Dark")
                  : t("Chuyển sang Light mode", "Switch to Light")
              }
              aria-label={t("Đổi giao diện", "Toggle theme")}
            >
              {mode === "light" ? "☀️" : "🌙"}
            </button>

            <button
              className="lang-switch"
              type="button"
              onClick={() => setLang?.(lang === "vi" ? "en" : "vi")}
              title={t("Đổi ngôn ngữ", "Toggle language")}
            >
              {lang === "vi" ? "🇻🇳" : "🇺🇸"}
            </button>

            {!token ? (
              <button className="sign-btn" onClick={() => setShowLogin(true)}>
                {t("Đăng nhập", "Sign In")}
              </button>
            ) : (
              <div className="profile-wrap">
                <button
                  className="profile-btn"
                  aria-haspopup="menu"
                  aria-expanded="false"
                >
                  <span className="profile-greeting">
                    {lang === "vi" ? "XIN CHÀO" : "WELCOME"}, {userName || (lang === "vi" ? "Bạn" : "There")}
                  </span>
                </button>
                <ul className="profile-menu" role="menu">
                  <li role="menuitem" onClick={logout}>
                    <img src={assets.logout_icon} alt="" />
                    <p>{t("Đăng xuất", "Logout")}</p>
                  </li>
                </ul>
              </div>
            )}

            <button
              className="hamburger"
              aria-label="Open menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>

      <div className="navbar-offset" />

      {showScrollTop && (
        <button
          className="scroll-top"
          onClick={scrollToTop}
          title={t("Lên đầu trang", "Scroll to top")}
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}
    </>
  );
};

export default Navbar;
