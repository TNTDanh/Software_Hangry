import React from 'react'
import { NavLink } from 'react-router-dom'
import useUI from '../ui/useUI.jsx'

export default function Sidebar() {
  const { t } = useUI()
  return (
    <aside className="sidebar card">
      <div className="menu-title">{t("menu")}</div>
      <nav className="menu">
        <NavLink to="/users" className={({isActive}) => `item pill${isActive ? ' active' : ''}`}>
          <span className="ico" aria-hidden>👥</span>
          <span>{t("users")}</span>
        </NavLink>
      </nav>
    </aside>
  )
}
