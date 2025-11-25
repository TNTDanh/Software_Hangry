import React from 'react'
import useUI from '../ui/useUI.jsx'
import useAuth from '../auth/useAuth.jsx'
import { toast } from 'react-toastify'

export default function Navbar() {
  const { theme, lang, toggleTheme, toggleLang, t } = useUI()
  const { logout } = useAuth()
  const modeIcon = theme === 'light' ? '🌞' : '🌙'
  const langLabel = lang === 'vi' ? 'VI' : 'EN'

  return (
    <header className="nav fancy-header">
      <div className="nav-left">
        <div className="logo-badge" aria-hidden>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6"/>
            <path d="M4 20c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="brand">
          {t("appName")}
          <span className="brand-badge">ADMIN</span>
        </span>
      </div>

      <div className="nav-actions">
        <button className="mode-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {modeIcon}
        </button>
        <button className="mode-toggle" onClick={toggleLang} aria-label="Toggle language">
          {langLabel}
        </button>
        <button
          className="pill-btn danger"
          onClick={() => {
            if (window.confirm(t("confirmLogout") || "Logout?")) {
              logout()
              toast.success(t("logout"))
            }
          }}
        >
          {t("logout")}
        </button>
      </div>
    </header>
  )
}
