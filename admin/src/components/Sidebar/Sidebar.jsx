import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = () => {
  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">MENU</span>
      </div>

      <nav className="sidebar-options">
        <NavLink
          to="/add"
          className={({ isActive }) => `sidebar-option${isActive ? ' active' : ''}`}
        >
          <img className="addd" src={assets.add_icon} alt="" />
          <p>ADD ITEMS</p>
        </NavLink>

        <NavLink
          to="/list"
          className={({ isActive }) => `sidebar-option${isActive ? ' active' : ''}`}
        >
          <img className="listt" src={assets.order_icon} alt="" />
          <p>LIST ITEMS</p>
        </NavLink>

        <NavLink
          to="/orders"
          className={({ isActive }) => `sidebar-option${isActive ? ' active' : ''}`}
        >
          <img className="orderr" src={assets.order_icon} alt="" />
          <p>ORDERS</p>
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar
