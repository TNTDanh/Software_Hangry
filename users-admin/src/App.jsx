import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Users from './pages/Users'
import AddRestaurant from './pages/AddRestaurant'
import AddOwner from './pages/AddOwner'
import Login from './pages/Login'
import useAuth from './auth/useAuth.jsx'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function App() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'
  const { token, role, logout } = useAuth()

  if (!token) {
    return (
      <div className="admin-wrap">
        <ToastContainer position="top-center" theme="colored" autoClose={1800} />
        <Login url={apiUrl} />
      </div>
    )
  }

  if (role !== 'admin') {
    return (
      <div className="unauth">
        <ToastContainer />
        <div className="card unauth-card">
          <p className="unauth-title">No permission</p>
          <p className="unauth-sub">Please login with an admin account.</p>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-wrap">
      <ToastContainer position="top-center" theme="colored" autoClose={1800} />
      <Navbar />
      <div className="content with-top-border">
        <Sidebar />
        <div className="page card">
          <Routes>
            <Route path="/users" element={<Users url={apiUrl} />} />
            <Route path="/restaurants/add" element={<AddRestaurant url={apiUrl} />} />
            <Route path="/owners/add" element={<AddOwner url={apiUrl} />} />
            <Route path="/" element={<Navigate to="/users" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
