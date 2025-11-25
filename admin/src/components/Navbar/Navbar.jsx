import React from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import useAuth from '../../auth/useAuth.jsx'
import useUI from '../../ui/useUI.jsx'
import { toast } from 'react-toastify'

const Navbar = () => {
  const { logout, role } = useAuth()
  const { theme, toggleTheme, lang, toggleLang, t } = useUI()

  const handleLogout = () => {
    if (window.confirm(t("confirmLogout"))) {
      logout()
      toast.success(t("loggedOut"))
    }
  }

  const modeIcon = theme === 'light' ? '🌞' : '🌙'
  const nextLang = lang === 'vi' ? 'EN' : 'VI'

  return (
    <header className="admin-navbar">
      <div className="nav-left">
        <img className="logo" src={assets.logo} alt="Hangry Admin" />
        <div className="brand">
          <p className="brand-top">{t("adminPortal")}</p>
          <span className="brand-sub">({role})</span>
        </div>
      </div>

      <div className="nav-right">
        <button className="pill-btn ghost" onClick={toggleTheme} title={t("toggleTheme")}>
          {modeIcon}
        </button>
        <button className="pill-btn ghost" onClick={toggleLang} title={t("toggleLang")}>
          {nextLang}
        </button>
        <button
          className="logout-btn"
          onClick={handleLogout}
          title={t("logout")}
        >
          {t("logout")}
        </button>
      </div>
    </header>
  )
}

export default Navbar
