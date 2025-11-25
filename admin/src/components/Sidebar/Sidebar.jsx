import React from 'react'
import './Sidebar.css'
import { Link, useLocation } from 'react-router-dom'
import { assets } from '../../assets/assets'
import useUI from '../../ui/useUI.jsx'

const Sidebar = ({ role }) => {
  const location = useLocation()
  const { t } = useUI()
  const isActive = (path) => location.pathname.startsWith(path)

  return (
    <aside className="sidebar">
      <Link to="/list" className={`sidebar-item ${isActive('/list') ? 'active' : ''}`}>
        <img src={assets.order_icon} alt="" />
        <p>{t("menu")}</p>
      </Link>
      <Link to="/add" className={`sidebar-item ${isActive('/add') ? 'active' : ''}`}>
        <img src={assets.add_icon} alt="" />
        <p>{t("addItem")}</p>
      </Link>
      <Link to="/orders" className={`sidebar-item ${isActive('/orders') ? 'active' : ''}`}>
        <img src={assets.order_icon} alt="" />
        <p>{t("orders")}</p>
      </Link>
      {role !== 'restaurantOwner' && (
        <div className="sidebar-note">
          <p>{t("adminView")}</p>
        </div>
      )}
    </aside>
  )
}

export default Sidebar
