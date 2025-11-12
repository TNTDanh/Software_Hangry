import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  return (
    <aside className="sidebar card">
      <div className="menu-title">MENU</div>
      <nav className="menu">
        <NavLink to="/users" className={({isActive}) => `item pill${isActive ? ' active' : ''}`}>
          <span className="ico" aria-hidden>👤</span>
          <span>USERS</span>
        </NavLink>
      </nav>
    </aside>
  )
}
